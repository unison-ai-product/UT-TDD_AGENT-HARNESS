import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { analyzeGithubCiPolicy, loadGithubCiPolicyDocs } from "../src/lint/github-ci-policy.ts";
import {
  type GitCommandPort,
  GitDiffAdapterError,
  type GitDiffAdapterErrorCode,
} from "../src/plan-admission/git-diff-adapter.ts";

/*
 * Contract-first Red: the subject module is intentionally absent in this slice.
 * A module-resolution failure inside it.fails keeps the contract PR green, but is
 * NOT evidence that any individual guard is Red. The implementation PR must run
 * candidate-specific mutation probes before converting these to ordinary tests.
 */

const REPO_ROOT = process.cwd();
const CLI_PATH = join(REPO_ROOT, "src", "cli.ts");
const GIT_BASE = "a".repeat(40);
const GIT_HEAD = "b".repeat(40);
const encoder = new TextEncoder();
const PROTECTION_IF = "$" + "{{ github.event_name == 'pull_request' }}";
const BASE_SHA_EXPR = "$" + "{{ github.event.pull_request.base.sha }}";
const GITHUB_SHA_EXPR = "$" + "{{ github.sha }}";
const FULL_LANE_IF = "$" + "{{ steps.classify.outputs.lane == 'full' }}";

type Change =
  | { kind: "added"; path: string }
  | { kind: "modified"; path: string }
  | { kind: "deleted"; path: string }
  | { kind: "renamed"; from: string; path: string };

interface Violation {
  code: string;
  path: string;
  from?: string;
}

interface CheckResult {
  ok: boolean;
  classification: "implementation" | "non-implementation" | "unknown";
  implementationPaths: string[];
  violations: Violation[];
  error?: { code: string; detail: string };
}

interface GitPort extends GitCommandPort {
  calls: string[][];
}

interface GateApi {
  IMPLEMENTATION_PATH_PREFIXES: readonly string[];
  PROTECTED_PATH_PREFIXES: readonly string[];
  classifyPullRequestChanges(
    changes: readonly Change[],
    paths?: { implementation: readonly string[]; protected: readonly string[] },
  ): "implementation" | "non-implementation";
  checkDesignProtection(input: {
    baseRef: string;
    headRef: string;
    git: GitCommandPort;
    paths?: { implementation: readonly string[]; protected: readonly string[] };
  }): CheckResult;
  runDesignProtectionCommand(
    argv: readonly string[],
    deps: { git: GitCommandPort; write: (line: string) => void },
  ): number;
}

async function loadGate(): Promise<GateApi> {
  // Resolve at test time so this file compiles before the production subject exists.
  // If it is absent, that import failure is deliberately not treated as per-guard proof.
  const subjectUrl = pathToFileURL(resolve(REPO_ROOT, "src/github/design-protection.ts")).href;
  return (await import(subjectUrl)) as unknown as GateApi;
}

function nul(...fields: string[]): Uint8Array {
  return encoder.encode(fields.length === 0 ? "" : `${fields.join("\0")}\0`);
}

function diffFor(changes: readonly Change[]): Uint8Array {
  const fields: string[] = [];
  for (const change of changes) {
    if (change.kind === "renamed") fields.push("R100", change.from, change.path);
    else
      fields.push(
        change.kind === "added" ? "A" : change.kind === "modified" ? "M" : "D",
        change.path,
      );
  }
  return nul(...fields);
}

class FakeGit implements GitPort {
  calls: string[][] = [];

  constructor(
    private readonly diff: Uint8Array,
    private readonly diffError?: GitDiffAdapterError,
  ) {}

  run(args: readonly string[]): Uint8Array {
    this.calls.push([...args]);
    if (args[0] === "rev-parse") {
      return encoder.encode(args.at(-1)?.includes("base") ? `${GIT_BASE}\n` : `${GIT_HEAD}\n`);
    }
    if (args[0] === "diff") {
      if (this.diffError) throw this.diffError;
      return this.diff;
    }
    throw new Error(`unexpected git command: ${args.join(" ")}`);
  }
}

async function check(
  changes: readonly Change[],
  paths?: { implementation: readonly string[]; protected: readonly string[] },
): Promise<CheckResult> {
  const api = await loadGate();
  return api.checkDesignProtection({
    baseRef: "base",
    headRef: "head",
    git: new FakeGit(diffFor(changes)),
    ...(paths ? { paths } : {}),
  });
}

function initRepo(files: Record<string, string>): { root: string; base: string } {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-design-protection-"));
  git(root, "init", "--quiet");
  git(root, "config", "user.email", "test@example.invalid");
  git(root, "config", "user.name", "UT-TDD test");
  for (const [path, content] of Object.entries(files)) writeRepoFile(root, path, content);
  commit(root, "seed");
  return { root, base: git(root, "rev-parse", "HEAD").trim() };
}

function git(root: string, ...args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function writeRepoFile(root: string, path: string, content: string): void {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
}

function commit(root: string, message: string): string {
  git(root, "add", "-A");
  git(root, "commit", "--quiet", "-m", message);
  return git(root, "rev-parse", "HEAD").trim();
}

function removeRepo(root: string): void {
  // `root` is always the unique mkdtempSync path created by initRepo or the test.
  rmSync(root, { recursive: true, force: true });
}

function runCli(root: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  return spawnSync(process.execPath, [CLI_PATH, ...args], {
    cwd: root,
    encoding: "utf8",
    env,
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  });
}

function requireCliJson(run: ReturnType<typeof runCli>): Record<string, unknown> {
  expect(run.error?.message ?? "", "CLI process must start without a spawn error").toBe("");
  expect(run.stdout.trim(), `stderr:\n${run.stderr}`).not.toBe("");
  return JSON.parse(run.stdout) as Record<string, unknown>;
}

function designStep(): Record<string, unknown> {
  return {
    name: "design-protection (実装 PR の設計書書き換え拒否、fail-close)",
    if: PROTECTION_IF,
    env: { BASE_SHA: BASE_SHA_EXPR },
    run: `node src/cli.ts github design-protection --base "$BASE_SHA" --head "${GITHUB_SHA_EXPR}"`,
  };
}

interface WorkflowStep {
  name?: string;
  if?: string;
  env?: Record<string, string>;
  run?: string;
  "continue-on-error"?: boolean;
}

interface WorkflowShape {
  jobs: Record<string, { steps: WorkflowStep[] }>;
}

function mutateWorkflow(content: string, mutate: (workflow: WorkflowShape) => void): string {
  const workflow = parseYaml(content) as WorkflowShape;
  mutate(workflow);
  return stringifyYaml(workflow);
}

function withProtectionStep(content: string): string {
  return mutateWorkflow(content, (workflow) => {
    const steps = workflow.jobs["harness-check-linux"].steps;
    const existing = steps.filter((step) => step.run?.includes("github design-protection"));
    if (existing.length > 1) throw new Error("fixture contains duplicate design-protection steps");
    if (existing.length === 1) return;
    const admissionIndex = steps.findIndex((step) => step.run?.includes("plan admission-check"));
    if (admissionIndex < 0) throw new Error("fixture is missing the admission step");
    steps.splice(admissionIndex + 1, 0, designStep() as WorkflowStep);
  });
}

function policyWithRuntime(runtimeContent: string) {
  const docs = loadGithubCiPolicyDocs({ runtimeProfile: "source", repoRoot: REPO_ROOT });
  return analyzeGithubCiPolicy(
    docs.map((doc) =>
      doc.role === "runtime" && doc.file === ".github/workflows/harness-check.yml"
        ? { ...doc, content: runtimeContent }
        : doc,
    ),
  );
}

function sorted(values: readonly string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function tablePrefixes(content: string, heading: "判定 path" | "保護 path"): string[] | undefined {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith(`| ${heading} `));
  if (start < 0) return undefined;
  const rows: string[] = [];
  for (let index = start + 2; index < lines.length && lines[index].startsWith("|"); index += 1) {
    const value = /^\|\s*`([^`]+)`\s*\|/.exec(lines[index])?.[1];
    if (value) rows.push(value);
  }
  return rows.length > 0 ? rows : undefined;
}

function inventory(root: string, prefixes: readonly string[]): Map<string, string[]> {
  const tracked = git(root, "ls-files", "-z").split("\0").filter(Boolean);
  return new Map(
    prefixes.map((prefix) => [prefix, tracked.filter((path) => path.startsWith(prefix))]),
  );
}

function repoState(root: string): string[] {
  return [
    git(root, "rev-parse", "HEAD").trim(),
    git(root, "write-tree").trim(),
    git(root, "status", "--porcelain=v1", "--untracked-files=all"),
    git(root, "count-objects", "-v"),
  ];
}

describe("design-protection L7 candidate Red (PR #981)", () => {
  it.fails("U-DPROT-001: implementation PR の design M を拒否する", async () => {
    const result = await check([
      { kind: "modified", path: "src/a.ts" },
      { kind: "modified", path: "docs/design/harness/x.md" },
    ]);
    expect(result).toMatchObject({
      ok: false,
      classification: "implementation",
      violations: [{ code: "protected-modified", path: "docs/design/harness/x.md" }],
    });
  });

  it.fails("U-DPROT-002: implementation PR の design D を拒否する", async () => {
    const result = await check([
      { kind: "modified", path: "src/a.ts" },
      { kind: "deleted", path: "docs/design/harness/x.md" },
    ]);
    expect(result.violations).toEqual([
      expect.objectContaining({ code: "protected-deleted", path: "docs/design/harness/x.md" }),
    ]);
  });

  it.fails("U-DPROT-003: protected design 内外への rename は旧pathを理由に拒否する", async () => {
    const api = await loadGate();
    const cases: Change[][] = [
      [
        { kind: "modified", path: "src/a.ts" },
        { kind: "renamed", from: "docs/design/harness/x.md", path: "docs/design/harness/z.md" },
      ],
      [
        { kind: "modified", path: "src/a.ts" },
        { kind: "renamed", from: "docs/design/harness/x.md", path: "docs/archive/x.md" },
      ],
    ];
    for (const changes of cases) {
      const result = await api.checkDesignProtection({
        baseRef: "base",
        headRef: "head",
        git: new FakeGit(diffFor(changes)),
      });
      expect(result.violations).toContainEqual(
        expect.objectContaining({ code: "protected-renamed", from: "docs/design/harness/x.md" }),
      );
    }
  });

  it.fails("U-DPROT-004: protected への新規追加/外部からのrenameは許可する", async () => {
    const result = await check([
      { kind: "modified", path: "src/a.ts" },
      { kind: "added", path: "docs/design/harness/new.md" },
      { kind: "renamed", from: "docs/archive/old.md", path: "docs/design/harness/moved.md" },
    ]);
    expect(result).toMatchObject({ ok: true, classification: "implementation", violations: [] });
  });

  it.fails("U-DPROT-005: implementation PR の test-design M を拒否する", async () => {
    const result = await check([
      { kind: "modified", path: "src/a.ts" },
      { kind: "modified", path: "docs/test-design/harness/y.md" },
    ]);
    expect(result.violations).toContainEqual(
      expect.objectContaining({
        code: "protected-modified",
        path: "docs/test-design/harness/y.md",
      }),
    );
  });

  it.fails("U-DPROT-006: scripts-only change もimplementationに分類する", async () => {
    const api = await loadGate();
    expect(api.classifyPullRequestChanges([{ kind: "modified", path: "scripts/b.sh" }])).toBe(
      "implementation",
    );
    const result = await api.checkDesignProtection({
      baseRef: "base",
      headRef: "head",
      git: new FakeGit(
        diffFor([
          { kind: "modified", path: "scripts/b.sh" },
          { kind: "modified", path: "docs/design/harness/x.md" },
        ]),
      ),
    });
    expect(result.violations).toContainEqual(
      expect.objectContaining({ code: "protected-modified", path: "docs/design/harness/x.md" }),
    );
  });

  it.fails("U-DPROT-007: rename from 側のsrc pathもimplementation判定に含める", async () => {
    const api = await loadGate();
    const changes: Change[] = [
      { kind: "renamed", from: "src/a.ts", path: "lib/a.ts" },
      { kind: "modified", path: "docs/design/harness/x.md" },
    ];
    expect(api.classifyPullRequestChanges(changes)).toBe("implementation");
    const result = await api.checkDesignProtection({
      baseRef: "base",
      headRef: "head",
      git: new FakeGit(diffFor(changes)),
    });
    expect(result.violations).toContainEqual(
      expect.objectContaining({ code: "protected-modified", path: "docs/design/harness/x.md" }),
    );
  });

  it.fails("U-DPROT-008: contract+Red PR のdesign/test-design/tests変更は通す", async () => {
    const result = await check([
      { kind: "modified", path: "docs/design/harness/x.md" },
      { kind: "modified", path: "docs/test-design/harness/y.md" },
      { kind: "deleted", path: "docs/design/harness/old.md" },
      { kind: "added", path: "tests/z.test.ts" },
      { kind: "modified", path: "tests/existing.test.ts" },
    ]);
    expect(result).toMatchObject({
      ok: true,
      classification: "non-implementation",
      violations: [],
    });
  });

  it.fails("U-DPROT-009: non-implementation分類とhooks/workflow非保証境界を保つ", async () => {
    const cases: Change[][] = [
      [
        { kind: "modified", path: "README.md" },
        { kind: "modified", path: ".ut-tdd/memory/m.md" },
      ],
      [
        { kind: "modified", path: ".claude/hooks/work-guard.ts" },
        { kind: "modified", path: "docs/design/harness/x.md" },
      ],
      [
        { kind: "modified", path: ".github/workflows/harness-check.yml" },
        { kind: "modified", path: "docs/test-design/harness/y.md" },
      ],
    ];
    for (const changes of cases) {
      const result = await check(changes);
      expect(result).toMatchObject({
        ok: true,
        classification: "non-implementation",
        violations: [],
      });
    }
  });

  it.fails("U-DPROT-010: 読み取れたempty diffをnon-implementation PASSにする", async () => {
    const result = await check([]);
    expect(result).toMatchObject({
      ok: true,
      classification: "non-implementation",
      implementationPaths: [],
      violations: [],
    });
    expect(result.error).toBeUndefined();
  });

  it.fails("U-DPROT-011: noncanonical pathを拒否しprefix照合はcase-sensitive", async () => {
    const invalid = ["docs\\design\\harness\\x.md", "C:/x", "../x"];
    for (const path of invalid) {
      const result = await check([{ kind: "modified", path }]);
      expect(result).toMatchObject({
        ok: false,
        classification: "unknown",
        error: { code: "git-path-invalid" },
      });
    }
    const caseSensitive = await check([
      { kind: "modified", path: "Docs/Design/x.md" },
      { kind: "modified", path: "SRC/a.ts" },
    ]);
    expect(caseSensitive).toMatchObject({
      ok: true,
      classification: "non-implementation",
      violations: [],
    });
  });

  it.fails("U-DPROT-012: unknown status / malformed NUL / missing rename pathはfail-close", async () => {
    const api = await loadGate();
    const fixtures: Array<[Uint8Array, GitDiffAdapterErrorCode]> = [
      [nul("T", "docs/design/harness/x.md"), "git-status-unknown"],
      [encoder.encode("M\0docs/design/harness/x.md"), "git-diff-malformed"],
      [nul("R100", "docs/design/harness/x.md"), "git-diff-malformed"],
    ];
    for (const [diff, code] of fixtures) {
      const result = await api.checkDesignProtection({
        baseRef: "base",
        headRef: "head",
        git: new FakeGit(diff),
      });
      expect(result).toMatchObject({
        ok: false,
        classification: "unknown",
        error: { code },
        violations: [],
      });
    }
  });

  it.fails("U-DPROT-013: 実CLIがargvで運べるinvalid refをtyped BLOCKにする", () => {
    const { root, base } = initRepo({ "README.md": "seed\n" });
    try {
      const refs = ["refs/heads/nope", "", "bad\tref"];
      for (const ref of refs) {
        const run = runCli(root, [
          "github",
          "design-protection",
          "--base",
          ref,
          "--head",
          base,
          "--json",
        ]);
        expect(run.error?.message ?? "", "production CLI must start").toBe("");
        expect(run.status, `stderr:\n${run.stderr}\nstdout:\n${run.stdout}`).toBe(1);
        expect(requireCliJson(run)).toMatchObject({
          ok: false,
          classification: "unknown",
          error: { code: "git-ref-invalid" },
        });
        const plain = runCli(root, ["github", "design-protection", "--base", ref, "--head", base]);
        expect(plain.error?.message ?? "", "production CLI must start").toBe("");
        expect(plain.status).toBe(1);
        expect(plain.stdout).toContain("design-protection: BLOCK");
      }
    } finally {
      removeRepo(root);
    }
  });

  it.fails("U-DPROT-014: 実CLIはM/D/R違反をJSON/plainで全件path順に返す", () => {
    const { root, base } = initRepo({
      "src/a.ts": "before\n",
      "docs/design/harness/a-modified.md": "before\n",
      "docs/design/harness/b-deleted.md": "delete\n",
      "docs/design/harness/c-renamed.md": "rename\n",
    });
    try {
      writeRepoFile(root, "src/a.ts", "after\n");
      writeRepoFile(root, "docs/design/harness/a-modified.md", "after\n");
      git(root, "rm", "docs/design/harness/b-deleted.md");
      mkdirSync(join(root, "docs/archive"), { recursive: true });
      git(root, "mv", "docs/design/harness/c-renamed.md", "docs/archive/c-renamed.md");
      const head = commit(root, "violating design edits");
      const jsonRun = runCli(root, [
        "github",
        "design-protection",
        "--base",
        base,
        "--head",
        head,
        "--json",
      ]);
      expect(jsonRun.error?.message ?? "", "production CLI must start").toBe("");
      expect(jsonRun.status).toBe(1);
      const result = requireCliJson(jsonRun) as unknown as CheckResult;
      expect(result).toMatchObject({ ok: false, classification: "implementation" });
      expect(result.violations.map((violation) => violation.code).sort()).toEqual([
        "protected-deleted",
        "protected-modified",
        "protected-renamed",
      ]);
      const violationPaths = result.violations.map((violation) => violation.path);
      expect(violationPaths).toEqual(sorted(violationPaths));

      const plainRun = runCli(root, [
        "github",
        "design-protection",
        "--base",
        base,
        "--head",
        head,
      ]);
      expect(plainRun.error?.message ?? "", "production CLI must start").toBe("");
      expect(plainRun.status).toBe(1);
      expect(plainRun.stdout).toContain("design-protection: BLOCK");
      expect(plainRun.stdout).toContain("protected-modified");
      expect(plainRun.stdout).toContain("protected-deleted");
      expect(plainRun.stdout).toContain("protected-renamed");
      expect(plainRun.stdout).toContain("別 PR");
      expect(plainRun.stdout.trim().split(/\r?\n/)).toHaveLength(5);
    } finally {
      removeRepo(root);
    }
  });

  it.fails("U-DPROT-015: change順序とPLANの有無で分類/違反は変わらない", async () => {
    const api = await loadGate();
    const changes: Change[] = [
      { kind: "modified", path: "src/a.ts" },
      { kind: "modified", path: "docs/design/harness/x.md" },
    ];
    const planAdded = [
      ...changes,
      { kind: "added", path: "docs/plans/PLAN-L7-999-order.md" } as const,
    ];
    const resultA = await api.checkDesignProtection({
      baseRef: "base",
      headRef: "head",
      git: new FakeGit(diffFor(changes)),
    });
    const resultB = await api.checkDesignProtection({
      baseRef: "base",
      headRef: "head",
      git: new FakeGit(diffFor([...changes].reverse())),
    });
    const resultWithPlan = await api.checkDesignProtection({
      baseRef: "base",
      headRef: "head",
      git: new FakeGit(diffFor(planAdded)),
    });
    const relevant = (result: CheckResult) => ({
      ok: result.ok,
      classification: result.classification,
      violations: result.violations,
    });
    expect(relevant(resultB)).toEqual(relevant(resultA));
    expect(relevant(resultWithPlan)).toEqual(relevant(resultA));
  });

  it.fails("U-DPROT-016: workflowからstepを消す/skip-ifへ変えるとpolicyが拒否する", () => {
    const baseline = withProtectionStep(
      readFileSync(join(REPO_ROOT, ".github/workflows/harness-check.yml"), "utf8"),
    );
    const removed = mutateWorkflow(baseline, (workflow) => {
      workflow.jobs["harness-check-linux"].steps = workflow.jobs[
        "harness-check-linux"
      ].steps.filter((step) => !step.run?.includes("github design-protection"));
    });
    const removedResult = policyWithRuntime(removed);
    expect(removedResult.violations).toContainEqual(
      expect.objectContaining({
        reason: "missing_step",
        detail: expect.stringContaining("design protection"),
      }),
    );
    expect(removedResult.violations).toContainEqual(
      expect.objectContaining({
        reason: "missing_runtime_leg",
        file: ".github/workflows/harness-check.yml",
      }),
    );

    const skipped = mutateWorkflow(baseline, (workflow) => {
      const step = workflow.jobs["harness-check-linux"].steps.find((item) =>
        item.run?.includes("github design-protection"),
      );
      if (!step) throw new Error("proposed step missing from fixture");
      step.if = FULL_LANE_IF;
    });
    expect(policyWithRuntime(skipped).violations).toContainEqual(
      expect.objectContaining({
        reason: "missing_runtime_leg",
        file: ".github/workflows/harness-check.yml",
      }),
    );
  });

  it.fails("U-DPROT-017: gate実行とoverride試行はrepo stateを書き換えない", () => {
    const { root, base } = initRepo({
      "src/a.ts": "before\n",
      "docs/design/harness/x.md": "before\n",
    });
    try {
      writeRepoFile(root, "src/a.ts", "after\n");
      writeRepoFile(root, "docs/design/harness/x.md", "after\n");
      const head = commit(root, "protected edit");
      const before = repoState(root);
      const overrideEnv = { ...process.env, UT_TDD_ALLOW_DESIGN_EDIT: "1" };
      const gateRun = runCli(
        root,
        ["github", "design-protection", "--base", base, "--head", head],
        overrideEnv,
      );
      expect(gateRun.error?.message ?? "", "production CLI must start").toBe("");
      expect(gateRun.status).toBe(1);
      expect(gateRun.stdout).toContain("design-protection: BLOCK");
      const allowRun = runCli(root, [
        "github",
        "design-protection",
        "--base",
        base,
        "--head",
        head,
        "--allow",
      ]);
      expect(allowRun.error?.message ?? "", "production CLI must start").toBe("");
      expect(allowRun.status).not.toBe(0);
      const after = repoState(root);
      expect(after).toEqual(before);
    } finally {
      removeRepo(root);
    }
  });

  it.fails("U-DPROT-018: implementation PR のtest-design Dを拒否する", async () => {
    const result = await check([
      { kind: "modified", path: "src/a.ts" },
      { kind: "deleted", path: "docs/test-design/harness/y.md" },
    ]);
    expect(result.violations).toContainEqual(
      expect.objectContaining({ code: "protected-deleted", path: "docs/test-design/harness/y.md" }),
    );
  });

  it.fails("U-DPROT-019: protected test-design 内外へのrenameを拒否する", async () => {
    const api = await loadGate();
    const cases: Change[][] = [
      [
        { kind: "modified", path: "src/a.ts" },
        {
          kind: "renamed",
          from: "docs/test-design/harness/y.md",
          path: "docs/test-design/harness/y2.md",
        },
      ],
      [
        { kind: "modified", path: "src/a.ts" },
        { kind: "renamed", from: "docs/test-design/harness/y.md", path: "docs/archive/y.md" },
      ],
    ];
    for (const changes of cases) {
      const result = await api.checkDesignProtection({
        baseRef: "base",
        headRef: "head",
        git: new FakeGit(diffFor(changes)),
      });
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: "protected-renamed",
          from: "docs/test-design/harness/y.md",
        }),
      );
    }
  });

  it.fails("U-DPROT-020: diff失敗はunit結果unknown/git-command-failedでfail-close", async () => {
    const api = await loadGate();
    const result = await api.checkDesignProtection({
      baseRef: "base",
      headRef: "head",
      git: new FakeGit(
        nul(),
        new GitDiffAdapterError("git-command-failed", "fixture diff failure"),
      ),
    });
    expect(result).toMatchObject({
      ok: false,
      classification: "unknown",
      violations: [],
      error: { code: "git-command-failed" },
    });
  });

  it.fails("U-DPROT-021: C75/C90 copy statusはunknownとして拒否する", async () => {
    const api = await loadGate();
    const fixtures = [
      nul("C75", "src/a.ts", "docs/design/harness/c.md"),
      nul("C90", "docs/design/harness/x.md", "docs/design/harness/x-copy.md"),
    ];
    for (const diff of fixtures) {
      const result = await api.checkDesignProtection({
        baseRef: "base",
        headRef: "head",
        git: new FakeGit(diff),
      });
      expect(result).toMatchObject({
        ok: false,
        classification: "unknown",
        violations: [],
        error: { code: "git-status-unknown" },
      });
    }
  });

  it.fails("U-DPROT-022:実gitのmode-only Mは実装PRで拒否しnon-implementationでは許可", () => {
    const { root, base } = initRepo({
      "src/a.ts": "src\n",
      "docs/design/harness/x.md": "unchanged bytes\n",
    });
    try {
      writeRepoFile(root, "src/a.ts", "implementation change\n");
      git(root, "add", "src/a.ts");
      git(root, "update-index", "--chmod=+x", "docs/design/harness/x.md");
      git(root, "commit", "--quiet", "-m", "implementation plus mode-only protected design change");
      const implementationHead = git(root, "rev-parse", "HEAD").trim();
      expect(git(root, "ls-tree", implementationHead, "docs/design/harness/x.md")).toMatch(
        /^100755 blob /,
      );
      const denied = runCli(root, [
        "github",
        "design-protection",
        "--base",
        base,
        "--head",
        implementationHead,
        "--json",
      ]);
      expect(denied.error?.message ?? "", "production CLI must start").toBe("");
      expect(denied.status).toBe(1);
      expect(requireCliJson(denied)).toMatchObject({
        ok: false,
        violations: [expect.objectContaining({ code: "protected-modified" })],
      });

      const { root: nonImplRoot, base: nonImplBase } = initRepo({
        "docs/design/harness/x.md": "unchanged bytes\n",
      });
      try {
        git(nonImplRoot, "update-index", "--chmod=+x", "docs/design/harness/x.md");
        git(nonImplRoot, "commit", "--quiet", "-m", "mode-only non-implementation change");
        const head = git(nonImplRoot, "rev-parse", "HEAD").trim();
        expect(git(nonImplRoot, "ls-tree", head, "docs/design/harness/x.md")).toMatch(
          /^100755 blob /,
        );
        const allowed = runCli(nonImplRoot, [
          "github",
          "design-protection",
          "--base",
          nonImplBase,
          "--head",
          head,
          "--json",
        ]);
        expect(allowed.error?.message ?? "", "production CLI must start").toBe("");
        expect(allowed.status).toBe(0);
        expect(requireCliJson(allowed)).toMatchObject({
          ok: true,
          classification: "non-implementation",
          violations: [],
        });
      } finally {
        removeRepo(nonImplRoot);
      }
    } finally {
      removeRepo(root);
    }
  });

  it.fails("U-DPROT-023: 実gitはbase/headのtwo-point結果でdelete+re-addを正規化する", () => {
    const changed = initRepo({ "src/a.ts": "before\n", "docs/design/harness/x.md": "original\n" });
    try {
      writeRepoFile(changed.root, "src/a.ts", "after\n");
      git(changed.root, "rm", "docs/design/harness/x.md");
      commit(changed.root, "delete design in first commit");
      writeRepoFile(changed.root, "docs/design/harness/x.md", "changed bytes\n");
      const changedHead = commit(changed.root, "re-add changed design");
      const changedRun = runCli(changed.root, [
        "github",
        "design-protection",
        "--base",
        changed.base,
        "--head",
        changedHead,
        "--json",
      ]);
      expect(changedRun.error?.message ?? "", "production CLI must start").toBe("");
      expect(changedRun.status).toBe(1);
      expect(requireCliJson(changedRun)).toMatchObject({
        ok: false,
        violations: [
          expect.objectContaining({ code: "protected-modified", path: "docs/design/harness/x.md" }),
        ],
      });
    } finally {
      removeRepo(changed.root);
    }

    const identical = initRepo({
      "src/a.ts": "before\n",
      "docs/design/harness/x.md": "original\n",
    });
    try {
      writeRepoFile(identical.root, "src/a.ts", "after\n");
      git(identical.root, "rm", "docs/design/harness/x.md");
      commit(identical.root, "delete design in first commit");
      writeRepoFile(identical.root, "docs/design/harness/x.md", "original\n");
      const identicalHead = commit(identical.root, "re-add identical design");
      const identicalRun = runCli(identical.root, [
        "github",
        "design-protection",
        "--base",
        identical.base,
        "--head",
        identicalHead,
        "--json",
      ]);
      expect(identicalRun.error?.message ?? "", "production CLI must start").toBe("");
      expect(identicalRun.status).toBe(0);
      expect(requireCliJson(identicalRun)).toMatchObject({ ok: true, violations: [] });
    } finally {
      removeRepo(identical.root);
    }
  });

  it.fails("U-DPROT-024: workflowとruntime manifestに正しいLinux stepがあればpolicy OK", () => {
    const actual = readFileSync(join(REPO_ROOT, ".github/workflows/harness-check.yml"), "utf8");
    const workflow = parseYaml(actual) as WorkflowShape;
    const installed = workflow.jobs["harness-check-linux"].steps.filter((step) =>
      step.run?.includes("github design-protection"),
    );
    // A synthetic extra step can be ignored by the old policy. Require the
    // completed repository workflow before checking its runtime manifest join.
    expect(installed).toEqual([designStep()]);
    const result = policyWithRuntime(actual);
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it.fails("U-DPROT-025: order/if/error/window変異はruntime manifest不一致になる", () => {
    const proposed = withProtectionStep(
      readFileSync(join(REPO_ROOT, ".github/workflows/harness-check.yml"), "utf8"),
    );
    const baseline = policyWithRuntime(proposed);
    expect(baseline.ok).toBe(true);
    expect(baseline.violations).toEqual([]);
    const variants: Array<[string, string]> = [
      [
        "if missing",
        mutateWorkflow(proposed, (workflow) => {
          const step = workflow.jobs["harness-check-linux"].steps.find((item) =>
            item.run?.includes("github design-protection"),
          );
          if (!step) throw new Error("proposed step missing from fixture");
          delete step.if;
        }),
      ],
      [
        "always",
        mutateWorkflow(proposed, (workflow) => {
          const step = workflow.jobs["harness-check-linux"].steps.find((item) =>
            item.run?.includes("github design-protection"),
          );
          if (!step) throw new Error("proposed step missing from fixture");
          step.if = "$" + "{{ always() }}";
        }),
      ],
      [
        "before admission",
        mutateWorkflow(proposed, (workflow) => {
          const steps = workflow.jobs["harness-check-linux"].steps;
          const index = steps.findIndex((step) => step.run?.includes("github design-protection"));
          const [step] = steps.splice(index, 1);
          const admission = steps.findIndex((item) => item.run?.includes("plan admission-check"));
          steps.splice(admission, 0, step);
        }),
      ],
      [
        "after typecheck",
        mutateWorkflow(proposed, (workflow) => {
          const steps = workflow.jobs["harness-check-linux"].steps;
          const index = steps.findIndex((step) => step.run?.includes("github design-protection"));
          const [step] = steps.splice(index, 1);
          const typecheck = steps.findIndex((item) => item.run?.includes("npm run typecheck"));
          steps.splice(typecheck + 1, 0, step);
        }),
      ],
      [
        "continue on error",
        mutateWorkflow(proposed, (workflow) => {
          const step = workflow.jobs["harness-check-linux"].steps.find((item) =>
            item.run?.includes("github design-protection"),
          );
          if (!step) throw new Error("proposed step missing from fixture");
          step["continue-on-error"] = true;
        }),
      ],
      [
        "duplicate on windows",
        mutateWorkflow(proposed, (workflow) => {
          workflow.jobs["harness-check-windows"].steps.push(designStep() as WorkflowStep);
        }),
      ],
    ];
    for (const [label, workflow] of variants) {
      const result = policyWithRuntime(workflow);
      expect(result.violations, label).toContainEqual(
        expect.objectContaining({ reason: "missing_runtime_leg" }),
      );
    }
  });

  it.fails("U-DPROT-026:実workflowのstepは一件・PR限定・BASE_SHAはPR base only", () => {
    const workflow = parseYaml(
      readFileSync(join(REPO_ROOT, ".github/workflows/harness-check.yml"), "utf8"),
    ) as WorkflowShape;
    const steps = workflow.jobs["harness-check-linux"].steps.filter((step) =>
      step.run?.includes("github design-protection"),
    );
    expect(steps).toHaveLength(1);
    expect(steps[0]?.if).toBe(PROTECTION_IF);
    expect(steps[0]?.env).toEqual({ BASE_SHA: BASE_SHA_EXPR });
    expect(steps[0]?.run).toBe(designStep().run);
    expect(steps[0]?.run).not.toContain("github.event.before");
  });

  it.fails("U-DPROT-027: repository-structureの2表と定数は集合一致し壊れた表を拒否", async () => {
    const api = await loadGate();
    const path = join(REPO_ROOT, "docs/governance/repository-structure.md");
    const content = readFileSync(path, "utf8");
    const implementation = tablePrefixes(content, "判定 path");
    const protectedPaths = tablePrefixes(content, "保護 path");
    expect(implementation).toBeDefined();
    expect(protectedPaths).toBeDefined();
    expect(sorted(api.IMPLEMENTATION_PATH_PREFIXES)).toEqual(sorted(implementation ?? []));
    expect(sorted(api.PROTECTED_PATH_PREFIXES)).toEqual(sorted(protectedPaths ?? []));

    const changedHeading = content.replace("判定 path (どれか", "判定 PATH (どれか");
    expect(changedHeading).not.toBe(content);
    expect(tablePrefixes(changedHeading, "判定 path")).toBeUndefined();

    const emptyTable = removeTableRows(content, "判定 path");
    expect(tablePrefixes(emptyTable, "判定 path")).toBeUndefined();

    const extraRow = content.replace(
      "| `scripts/` | §2 の OS entrypoint |",
      "| `scripts/` | §2 の OS entrypoint |\n| `lib/` | unexpected |",
    );
    expect(extraRow).not.toBe(content);
    expect(sorted(tablePrefixes(extraRow, "判定 path") ?? [])).not.toEqual(
      sorted(api.IMPLEMENTATION_PATH_PREFIXES),
    );

    const reordered = mutateTableRows(content, "判定 path");
    expect(sorted(tablePrefixes(reordered, "判定 path") ?? [])).toEqual(
      sorted(api.IMPLEMENTATION_PATH_PREFIXES),
    );
    expect(
      sorted(tablePrefixes(mutateTableRows(content, "保護 path") ?? "", "保護 path") ?? []),
    ).toEqual(sorted(api.PROTECTED_PATH_PREFIXES));
  });

  it.fails("U-DPROT-028: injected pathsがclassificationとprotectionの両方を制御する", async () => {
    const paths = { implementation: ["product/"], protected: ["spec/design/"] };
    const blocked = await check(
      [
        { kind: "modified", path: "product/a.ts" },
        { kind: "modified", path: "spec/design/x.md" },
      ],
      paths,
    );
    expect(blocked).toMatchObject({
      ok: false,
      classification: "implementation",
      violations: [{ code: "protected-modified", path: "spec/design/x.md" }],
    });

    const defaultSource = await check(
      [
        { kind: "modified", path: "src/a.ts" },
        { kind: "modified", path: "spec/design/x.md" },
      ],
      paths,
    );
    expect(defaultSource).toMatchObject({
      ok: true,
      classification: "non-implementation",
      violations: [],
    });

    const customSourceDefaultProtected = await check(
      [
        { kind: "modified", path: "product/a.ts" },
        { kind: "modified", path: "docs/design/harness/x.md" },
      ],
      paths,
    );
    expect(customSourceDefaultProtected).toMatchObject({
      ok: true,
      classification: "implementation",
      violations: [],
    });
  });

  it.fails("U-DPROT-029: implementation path外renameを拒否し内側renameとcustom prefixを許可", async () => {
    const api = await loadGate();
    const cases: Array<{
      change: Change;
      paths?: { implementation: readonly string[]; protected: readonly string[] };
      code?: string;
    }> = [
      {
        change: { kind: "renamed", from: "src/a.ts", path: "product/a.ts" },
        code: "implementation-moved-out",
      },
      {
        change: { kind: "renamed", from: "scripts/b.sh", path: "tools/b.sh" },
        code: "implementation-moved-out",
      },
      { change: { kind: "renamed", from: "src/a.ts", path: "src/sub/a.ts" } },
      {
        change: { kind: "renamed", from: "src/a.ts", path: "product/a.ts" },
        paths: {
          implementation: ["src/", "product/"],
          protected: ["docs/design/", "docs/test-design/"],
        },
      },
      {
        change: { kind: "renamed", from: "src/a.ts", path: "docs/design/harness/moved.md" },
        code: "implementation-moved-out",
      },
    ];
    for (const item of cases) {
      const result = await api.checkDesignProtection({
        baseRef: "base",
        headRef: "head",
        git: new FakeGit(diffFor([item.change])),
        ...(item.paths ? { paths: item.paths } : {}),
      });
      if (item.code) {
        expect(result).toMatchObject({ ok: false, classification: "implementation" });
        expect(result.violations).toEqual([
          expect.objectContaining({
            code: item.code,
            path: item.change.path,
            from: item.change.kind === "renamed" ? item.change.from : undefined,
          }),
        ]);
      } else {
        expect(result).toMatchObject({ ok: true, violations: [] });
      }
    }
  });

  it.fails("U-DPROT-030: HEAD git ls-filesで各prefixの存在を確認し全src移動を検出", async () => {
    const api = await loadGate();
    const implementationInventory = inventory(REPO_ROOT, api.IMPLEMENTATION_PATH_PREFIXES);
    const protectedInventory = inventory(REPO_ROOT, api.PROTECTED_PATH_PREFIXES);
    for (const prefix of api.IMPLEMENTATION_PATH_PREFIXES)
      expect(implementationInventory.get(prefix)?.length ?? 0).toBeGreaterThan(0);
    for (const prefix of api.PROTECTED_PATH_PREFIXES)
      expect(protectedInventory.get(prefix)?.length ?? 0).toBeGreaterThan(0);

    const { root } = initRepo({ "src/a.ts": "source\n", "docs/design/harness/x.md": "design\n" });
    try {
      const pathsBefore = inventory(root, ["src/"]);
      expect(pathsBefore.get("src/")?.length ?? 0).toBeGreaterThan(0);
      mkdirSync(join(root, "product"), { recursive: true });
      git(root, "mv", "src/a.ts", "product/a.ts");
      commit(root, "move all implementation files out of src");
      const pathsAfter = inventory(root, ["src/"]);
      expect(pathsAfter.get("src/")?.length ?? 0).toBe(0);
      expect(pathsAfter.has("src/")).toBe(true);
    } finally {
      removeRepo(root);
    }
  });

  it.fails("U-DPROT-031: NUL/LF/CR refはGitCommandPortを呼ぶ前に拒否する", async () => {
    const api = await loadGate();
    for (const baseRef of ["bad\0ref", "bad\nref", "bad\rref"]) {
      const git = new FakeGit(nul());
      const result = await api.checkDesignProtection({ baseRef, headRef: GIT_HEAD, git });
      expect(result).toMatchObject({
        ok: false,
        classification: "unknown",
        error: { code: "git-ref-invalid" },
      });
      expect(git.calls).toEqual([]);
    }
  });

  it.fails("U-DPROT-032: injected CLI handlerはokだけからexit codeとtyped outputを決める", async () => {
    const api = await loadGate();
    const errorGit = new FakeGit(
      nul(),
      new GitDiffAdapterError("git-command-failed", "fixture diff failure"),
    );
    const errorOutput: string[] = [];
    const errorCode = api.runDesignProtectionCommand(["--base", "base", "--head", "head"], {
      git: errorGit,
      write: (line) => errorOutput.push(line),
    });
    expect(errorCode).toBe(1);
    expect(errorOutput.join("\n")).toContain("design-protection: BLOCK");
    expect(errorOutput.join("\n")).toContain("git-command-failed");

    const cleanOutput: string[] = [];
    const cleanCode = api.runDesignProtectionCommand(["--base", "base", "--head", "head"], {
      git: new FakeGit(nul()),
      write: (line) => cleanOutput.push(line),
    });
    expect(cleanCode).toBe(0);
    expect(cleanOutput.join("\n")).toContain("design-protection: PASS");

    const violatingOutput: string[] = [];
    const violatingCode = api.runDesignProtectionCommand(["--base", "base", "--head", "head"], {
      git: new FakeGit(
        diffFor([
          { kind: "modified", path: "src/a.ts" },
          { kind: "modified", path: "docs/design/harness/x.md" },
        ]),
      ),
      write: (line) => violatingOutput.push(line),
    });
    expect(violatingCode).toBe(1);
    expect(violatingOutput.join("\n")).toContain("design-protection: BLOCK");
  });
});

function mutateTableRows(content: string, heading: "判定 path" | "保護 path"): string {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith(`| ${heading} `));
  if (start < 0) return content;
  let end = start + 1;
  while (end < lines.length && lines[end].startsWith("|")) end += 1;
  const rows = lines.slice(start + 2, end);
  lines.splice(start + 2, rows.length, ...rows.reverse());
  return lines.join("\n");
}

function removeTableRows(content: string, heading: "判定 path" | "保護 path"): string {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith(`| ${heading} `));
  if (start < 0) return content;
  let end = start + 1;
  while (end < lines.length && lines[end].startsWith("|")) end += 1;
  lines.splice(start + 2, end - (start + 2));
  return lines.join("\n");
}
