import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, parse, resolve, sep } from "node:path";
import { expect } from "vitest";
import { checkBaselineConflict } from "../../src/feedback/baseline-conflict.ts";
import { type GhPrMergePorts, runPrMerge } from "../../src/feedback/review-merge-gate.ts";
import {
  analyzeCodeSize,
  CODE_SIZE_BASELINE_PATH,
  type CodeSizeBaseline,
  type CodeSizeSource,
  measureCodeFile,
  parseCodeSizeBaseline,
  recordForm,
} from "../../src/lint/code-size.ts";
import { checkCodeSize } from "../../src/lint/code-size-inputs.ts";

export const NOW = "2026-11-05T11:00:00.000Z";
export const TARGET = "src/alpha.ts";
export const SMALL_BASELINE = "docs/governance/small-baseline.json";

interface InjectedFinding {
  path: string;
  kind: string;
  reason: string;
}

export interface InjectedGate {
  name: string;
  inScope: (path: string) => boolean;
  baselinePath: string;
  check: (repoRoot: string) => {
    ok: boolean;
    findings: InjectedFinding[];
    summary?: { over: number; stale: number };
  };
}

interface BranchFiles {
  pr: Record<string, string>;
  main: Record<string, string>;
}

export interface Fixture {
  scratchRoot: string;
  base: string;
  work: string;
  baseSha: string;
  headSha: string;
  mainSha: string;
  gitCommonDir: string;
  initialWorktreePaths: string[];
  ownedPreviewPaths: Set<string>;
}

export function git(root: string, ...args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function configure(root: string): void {
  git(root, "config", "user.email", "fixture@example.test");
  git(root, "config", "user.name", "fixture");
  git(root, "config", "core.autocrlf", "false");
}

function writeFiles(root: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content, "utf8");
  }
}

export function worktreePaths(root: string): string[] {
  return git(root, "worktree", "list", "--porcelain")
    .split(/\r?\n/)
    .filter((line) => line.startsWith("worktree "))
    .map((line) => resolve(line.slice("worktree ".length)));
}

export function changedPaths(root: string, from: string, to: string): string[] {
  return git(root, "diff", "--name-only", "-z", from, to)
    .split("\0")
    .filter((path) => path !== "");
}

function functionText(name: string, excess: number): string {
  return `function ${name}() {\n${"  return 1;\n".repeat(120 + excess)}}\n`;
}

function functionRow(path: string, content: string): string {
  return JSON.stringify(recordForm(measureCodeFile({ path, text: content })));
}

function functionBaseline(a: string, b: string): string {
  return `{
  "src/a.ts": ${a},
${"\n".repeat(8)}
  "src/b.ts": ${b}
}\n`;
}

export function separatedFile(firstLine: string, lastLine: string): string {
  return [
    firstLine,
    ...Array.from({ length: 8 }, (_, index) => `// shared context ${index + 1}`),
    lastLine,
    "",
  ].join("\n");
}

export function buildFunctionExcessFixture(): Fixture {
  const aBase = functionText("a", 2);
  const bBase = functionText("b", 3);
  const aMain = functionText("a", 1);
  const bPr = functionText("b", 4);
  return buildFixture(
    {
      "src/a.ts": aBase,
      "src/b.ts": bBase,
      [CODE_SIZE_BASELINE_PATH]: functionBaseline(
        functionRow("src/a.ts", aBase),
        functionRow("src/b.ts", bBase),
      ),
    },
    {
      pr: {
        "src/b.ts": bPr,
        [CODE_SIZE_BASELINE_PATH]: functionBaseline(
          functionRow("src/a.ts", aBase),
          functionRow("src/b.ts", bPr),
        ),
      },
      main: {
        "src/a.ts": aMain,
        [CODE_SIZE_BASELINE_PATH]: functionBaseline(
          functionRow("src/a.ts", aMain),
          functionRow("src/b.ts", bBase),
        ),
      },
    },
  );
}

export function verifyFunctionExcessFixture(fixture: Fixture): void {
  const preview = createPreviewWorktree(fixture);
  try {
    const mergedSources = ["src/a.ts", "src/b.ts"].map(
      (path): CodeSizeSource => ({
        path,
        text: readFileSync(join(preview.path, path), "utf8"),
      }),
    );
    const mergedBaseline = parseCodeSizeBaseline(
      readFileSync(join(preview.path, CODE_SIZE_BASELINE_PATH), "utf8"),
    ) as CodeSizeBaseline;
    const baseBaseline = parseCodeSizeBaseline(
      execFileSync(
        "git",
        ["-C", fixture.work, "show", `${fixture.baseSha}:${CODE_SIZE_BASELINE_PATH}`],
        { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
      ),
    ) as CodeSizeBaseline;
    const mainBaseline = parseCodeSizeBaseline(
      execFileSync(
        "git",
        ["-C", fixture.work, "show", `${fixture.mainSha}:${CODE_SIZE_BASELINE_PATH}`],
        { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
      ),
    ) as CodeSizeBaseline;
    const analyze = (previousBaseline: CodeSizeBaseline) =>
      analyzeCodeSize({
        sources: mergedSources,
        baseline: mergedBaseline,
        previousBaseline,
        mergeBaseMeasures: null,
        renames: [],
      });
    const againstBase = analyze(baseBaseline);
    expect(againstBase.findings).toHaveLength(0);
    const againstMain = analyze(mainBaseline);
    expect(againstMain.findings).toContainEqual({
      path: CODE_SIZE_BASELINE_PATH,
      kind: "code-size-baseline-grown",
      reason: "functionExcess-total",
    });
    expect(againstMain.summary).toMatchObject({ over: 0, stale: 0 });
    const gate = checkCodeSize(preview.path);
    expect(gate.ok).toBe(false);
    expect(gate.messages.join("\n")).toContain("functionExcess-total");
  } finally {
    removeFixturePreviewWorktree(fixture, preview.path);
  }
}

function fixtureScratchRoot(): string {
  const root = resolve(process.env.UT_TDD_TEST_SCRATCH_ROOT ?? tmpdir());
  if (root.toLowerCase() === parse(root).root.toLowerCase()) {
    throw new Error("UT_TDD_TEST_SCRATCH_ROOT must not be a filesystem root");
  }
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`UT_TDD_TEST_SCRATCH_ROOT must be an existing directory: ${root}`);
  }
  return root;
}

export function buildFixture(baseFiles: Record<string, string>, branchFiles: BranchFiles): Fixture {
  const scratchRoot = fixtureScratchRoot();
  const base = mkdtempSync(join(scratchRoot, "ut-tdd-rvmg-"));
  const origin = join(base, "origin.git");
  const work = join(base, "clone");
  try {
    execFileSync("git", ["init", "-q", "--bare", "-b", "main", origin], { windowsHide: true });
    execFileSync("git", ["clone", "-q", "-c", "core.autocrlf=false", origin, work], {
      windowsHide: true,
      stdio: "ignore",
    });
    configure(work);
    git(work, "checkout", "-q", "-B", "main");
    writeFiles(work, baseFiles);
    git(work, "add", "-A");
    git(work, "commit", "-q", "-m", "base");
    const baseSha = git(work, "rev-parse", "HEAD");
    git(work, "push", "-q", "-u", "origin", "main");

    git(work, "checkout", "-q", "-b", "pr");
    writeFiles(work, branchFiles.pr);
    git(work, "add", "-A");
    git(work, "commit", "-q", "-m", "pr");
    const headSha = git(work, "rev-parse", "HEAD");
    git(work, "push", "-q", "-u", "origin", "pr");

    git(work, "checkout", "-q", "main");
    writeFiles(work, branchFiles.main);
    git(work, "add", "-A");
    git(work, "commit", "-q", "-m", "main");
    const mainSha = git(work, "rev-parse", "HEAD");
    git(work, "push", "-q", "origin", "main");
    git(work, "checkout", "-q", "pr");
    git(work, "fetch", "-q", "origin", "+refs/heads/main:refs/remotes/origin/main");
    return {
      scratchRoot,
      base,
      work,
      baseSha,
      headSha,
      mainSha,
      gitCommonDir: resolve(work, git(work, "rev-parse", "--git-common-dir")),
      initialWorktreePaths: worktreePaths(work),
      ownedPreviewPaths: new Set(),
    };
  } catch (error) {
    rmSync(base, { recursive: true });
    throw error;
  }
}

export function buildGateSelectionFixture(key: "code" | "doc" | "both" | "none"): Fixture {
  const base = {
    "src/alpha.ts": separatedFile("base-src-a", "base-src-b"),
    "docs/alpha.md": separatedFile("base-doc-a", "base-doc-b"),
    "docs/governance/code-baseline.json": "{}\n",
    "docs/governance/doc-baseline.json": "{}\n",
  };
  if (key === "code") {
    return buildFixture(base, {
      pr: { "src/alpha.ts": separatedFile("pr-src", "base-src-b") },
      main: { "src/alpha.ts": separatedFile("base-src-a", "main-src") },
    });
  }
  if (key === "doc") {
    return buildFixture(base, {
      pr: { "docs/alpha.md": separatedFile("pr-doc", "base-doc-b") },
      main: { "docs/alpha.md": separatedFile("base-doc-a", "main-doc") },
    });
  }
  if (key === "both") {
    return buildFixture(base, {
      pr: {
        "src/alpha.ts": separatedFile("pr-src", "base-src-b"),
        "docs/alpha.md": separatedFile("pr-doc", "base-doc-b"),
      },
      main: {
        "src/alpha.ts": separatedFile("base-src-a", "main-src"),
        "docs/alpha.md": separatedFile("base-doc-a", "main-doc"),
      },
    });
  }
  return buildFixture(base, {
    pr: { "src/alpha.ts": separatedFile("pr-src", "base-src-b") },
    main: { "docs/alpha.md": separatedFile("base-doc-a", "main-doc") },
  });
}

export function createPreviewWorktree(fixture: Fixture): { path: string; treeSha: string } {
  const treeSha = git(
    fixture.work,
    "merge-tree",
    "--write-tree",
    fixture.mainSha,
    fixture.headSha,
  ).split(/\r?\n/)[0];
  if (treeSha === undefined || !/^[0-9a-f]{40,64}$/.test(treeSha)) {
    throw new Error("fixture merge-tree did not produce a tree SHA");
  }
  const commitSha = git(
    fixture.work,
    "commit-tree",
    treeSha,
    "-p",
    fixture.mainSha,
    "-p",
    fixture.headSha,
    "-m",
    "fixture preview",
  );
  const path = mkdtempSync(join(fixture.scratchRoot, "ut-tdd-rvmg-preview-"));
  const absolutePath = resolve(path);
  fixture.ownedPreviewPaths.add(absolutePath);
  try {
    git(fixture.work, "worktree", "add", "-q", "--detach", absolutePath, commitSha);
    return { path: absolutePath, treeSha };
  } catch (error) {
    const registered = worktreePaths(fixture.work).some(
      (candidate) => resolve(candidate).toLowerCase() === absolutePath.toLowerCase(),
    );
    if (registered) removeFixturePreviewWorktree(fixture, absolutePath);
    else {
      fixture.ownedPreviewPaths.delete(absolutePath);
      rmdirSync(absolutePath);
    }
    throw error;
  }
}

export function removeFixturePreviewWorktree(fixture: Fixture, previewPath: string): void {
  const absolutePath = resolve(previewPath);
  const scratchRoot = resolve(fixture.scratchRoot);
  const ownsPath = [...fixture.ownedPreviewPaths].some(
    (ownedPath) => resolve(ownedPath).toLowerCase() === absolutePath.toLowerCase(),
  );
  if (
    !ownsPath ||
    dirname(absolutePath).toLowerCase() !== scratchRoot.toLowerCase() ||
    !basename(absolutePath).startsWith("ut-tdd-rvmg-preview-")
  ) {
    throw new Error("refusing to remove a preview worktree outside this fixture");
  }
  if (!existsSync(absolutePath)) {
    fixture.ownedPreviewPaths.delete(absolutePath);
    return;
  }
  const common = resolve(absolutePath, git(absolutePath, "rev-parse", "--git-common-dir"));
  if (common.toLowerCase() !== fixture.gitCommonDir.toLowerCase()) {
    throw new Error("refusing to remove a preview worktree with a different git common directory");
  }
  if (
    !worktreePaths(fixture.work).some(
      (candidate) => resolve(candidate).toLowerCase() === absolutePath.toLowerCase(),
    )
  ) {
    throw new Error("refusing to remove a path not registered as this fixture's worktree");
  }
  git(fixture.work, "worktree", "remove", absolutePath);
  fixture.ownedPreviewPaths.delete(absolutePath);
}

export function smallFiles(
  prLine = "pr-line",
  mainLine = "main-line",
): {
  base: Record<string, string>;
  branches: BranchFiles;
} {
  return {
    base: {
      [TARGET]: separatedFile("base-a", "base-b"),
      [SMALL_BASELINE]: '{"baseline":1}\n',
    },
    branches: {
      pr: { [TARGET]: separatedFile(prLine, "base-b") },
      main: { [TARGET]: separatedFile("base-a", mainLine) },
    },
  };
}

export function injectedGate(
  kind: string | null,
  options: {
    throwOnCheck?: boolean;
    over?: number;
    stale?: number;
    name?: string;
    inScope?: (path: string) => boolean;
    baselinePath?: string;
    calls?: string[];
  } = {},
): InjectedGate {
  return {
    name: options.name ?? "fixture-gate",
    inScope: options.inScope ?? ((path) => path === TARGET),
    baselinePath: options.baselinePath ?? SMALL_BASELINE,
    check: (repoRoot) => {
      options.calls?.push(options.name ?? "fixture-gate");
      if (options.throwOnCheck) throw new Error("fixture gate check failed");
      const content = readFileSync(join(repoRoot, TARGET), "utf8");
      const hasMergedEdits = content.includes("pr-line") && content.includes("main-line");
      let shouldFind = hasMergedEdits;
      if (kind === "code-size-required") {
        const baseline = JSON.parse(readFileSync(join(repoRoot, SMALL_BASELINE), "utf8")) as Record<
          string,
          unknown
        >;
        const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");
        shouldFind = !(TARGET in baseline) && lines.length > 2;
      }
      const findings = kind === null || !shouldFind ? [] : [{ path: TARGET, kind, reason: kind }];
      return {
        ok: findings.length === 0,
        findings,
        summary: { over: options.over ?? 0, stale: options.stale ?? 0 },
      };
    },
  };
}

export function gateSelectionGates(calls: string[]): InjectedGate[] {
  return [
    injectedGate(null, {
      name: "code-size",
      inScope: (path) => path === "src/alpha.ts",
      baselinePath: "docs/governance/code-baseline.json",
      calls,
    }),
    injectedGate(null, {
      name: "doc-split",
      inScope: (path) => path === "docs/alpha.md",
      baselinePath: "docs/governance/doc-baseline.json",
      calls,
    }),
  ];
}

export function expectGateSelection(testFixture: Fixture, expected: string[]): void {
  const calls: string[] = [];
  expect(
    checkWithGates(testFixture.work, testFixture.headSha, gateSelectionGates(calls)),
  ).toBeNull();
  expect(calls.sort()).toEqual(expected);
}

export const checkWithGates = checkBaselineConflict as unknown as (
  repoRoot: string,
  headSha: string,
  gates: readonly InjectedGate[],
) => string | null;

function seedPassReview(root: string, headSha: string): void {
  const requests = join(root, ".ut-tdd", "review", "requests");
  const receipts = join(root, ".ut-tdd", "review", "receipts");
  mkdirSync(requests, { recursive: true });
  mkdirSync(receipts, { recursive: true });
  writeFileSync(
    join(requests, "request.json"),
    JSON.stringify({
      memoryId: "review:1559:head:1",
      pr: 1559,
      exactHead: headSha,
      reviewRevision: "review-r1",
      authorFamily: "claude",
      requestedAt: "2026-11-05T10:30:00.000Z",
    }),
  );
  writeFileSync(
    join(receipts, "receipt.json"),
    JSON.stringify({
      memoryId: "review:1559:head:1",
      pr: 1559,
      head: headSha,
      reviewRevision: "review-r1",
      reviewerFamily: "codex",
      kind: "verdict",
      verdict: "PASS",
      blockingFindings: [],
      at: "2026-11-05T10:45:00.000Z",
    }),
  );
}

export function runMerge(
  fixture: Fixture,
  bypassBaselineConflict = false,
  baselineConflictChecker?: GhPrMergePorts["checkBaselineConflict"],
) {
  seedPassReview(fixture.work, fixture.headSha);
  let mergeCount = 0;
  const ports: GhPrMergePorts = {
    getPullRequest: () => ({
      pr: 1559,
      headSha: fixture.headSha,
      evaluatedHeadSha: fixture.headSha,
      state: "OPEN",
      checksGreen: true,
    }),
    mergePullRequest: () => {
      mergeCount += 1;
    },
  };
  if (bypassBaselineConflict) ports.checkBaselineConflict = () => null;
  else if (baselineConflictChecker) ports.checkBaselineConflict = baselineConflictChecker;
  const result = runPrMerge({ repoRoot: fixture.work, pr: 1559, now: () => NOW, ports });
  return { result, merges: mergeCount };
}

export function expectGitFailureDenied(
  testFixture: Fixture,
  needles: string[],
  fault: { active: boolean; needles: string[]; hits: number },
): void {
  fault.active = true;
  fault.needles = needles;
  fault.hits = 0;
  const run = runMerge(testFixture);
  expect(run.result.reason).toMatch(/^baseline_conflict_unknown:/);
  expect(run.merges).toBe(0);
  expect(fault.hits).toBe(1);
}

export function isScratchPreviewRoot(repoRoot: string, fixture: Fixture): boolean {
  const candidate = resolve(repoRoot);
  const samePath = (left: string, right: string) =>
    process.platform === "win32"
      ? resolve(left).toLowerCase() === resolve(right).toLowerCase()
      : resolve(left) === resolve(right);
  return (
    samePath(dirname(candidate), fixture.scratchRoot) &&
    !samePath(candidate, fixture.base) &&
    !samePath(candidate, fixture.work)
  );
}

export function cleanFixture(fixture: Fixture): void {
  const base = resolve(fixture.base);
  const scratchRoot = resolve(fixture.scratchRoot);
  if (
    !basename(base).startsWith("ut-tdd-rvmg-") ||
    dirname(base).toLowerCase() !== scratchRoot.toLowerCase()
  ) {
    throw new Error("refusing to remove a path not created by this fixture");
  }
  for (const previewPath of [...fixture.ownedPreviewPaths]) {
    removeFixturePreviewWorktree(fixture, previewPath);
  }
  const initial = new Set(fixture.initialWorktreePaths.map((path) => resolve(path).toLowerCase()));
  const outsidePaths: string[] = [];
  for (const path of worktreePaths(fixture.work)) {
    if (initial.has(path.toLowerCase())) continue;
    if (!path.toLowerCase().startsWith(`${base}${sep}`.toLowerCase())) {
      outsidePaths.push(path);
      continue;
    }
    if (!existsSync(path)) continue;
    const common = resolve(path, git(path, "rev-parse", "--git-common-dir"));
    if (common.toLowerCase() !== fixture.gitCommonDir.toLowerCase()) {
      throw new Error("refusing to remove a linked worktree outside this fixture repository");
    }
    git(fixture.work, "worktree", "remove", path);
  }
  if (outsidePaths.length > 0) {
    throw new Error(
      `refusing to remove fixture storage while linked worktrees remain outside it: ${outsidePaths.join(", ")}`,
    );
  }
  rmSync(base, { recursive: true });
}
