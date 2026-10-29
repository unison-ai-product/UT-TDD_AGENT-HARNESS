/**
 * Issue #1423 Red: baseline を持つ gate の並行 PR 競合を merge wrapper で止める契約の oracle。
 * 契約: docs/design/harness/L6-function-design/merge-gate-check-run-selection.md §6。
 * oracle: docs/test-design/harness/L7-unit-test-design.md の CANDIDATE-U-RVMG-047〜049。
 * 実装 PR (Green) が `it.fails` を `it` に戻す。fixture は一時ディレクトリの git repo (bare origin + 2 clone)。
 */
import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Command } from "commander";
import { describe, expect, it } from "vitest";
import { registerPrMergeCommands } from "../src/cli/pr-merge.ts";
import { type GhPrMergePorts, runPrMerge } from "../src/feedback/review-merge-gate.ts";

const now = "2026-10-28T01:00:00.000Z";

interface GateFiles {
  name: "doc-split" | "code-size";
  target: string;
  renamed: string;
  other: string;
  baseline: string;
}

const DOC_SPLIT: GateFiles = {
  name: "doc-split",
  target: "docs/design/harness/L6-function-design/alpha.md",
  renamed: "docs/design/harness/L6-function-design/alpha-renamed.md",
  other: "docs/design/harness/L6-function-design/beta.md",
  baseline: "docs/governance/doc-split-baseline.json",
};
const CODE_SIZE: GateFiles = {
  name: "code-size",
  target: "src/alpha.ts",
  renamed: "src/alpha-renamed.ts",
  other: "src/beta.ts",
  baseline: "docs/governance/code-size-baseline.json",
};
const OUT_OF_SCOPE = "README.md";
const BASE_FILES = [
  DOC_SPLIT.target,
  DOC_SPLIT.other,
  DOC_SPLIT.baseline,
  CODE_SIZE.target,
  CODE_SIZE.other,
  CODE_SIZE.baseline,
  OUT_OF_SCOPE,
];

interface Edit {
  touch?: string[];
  rename?: [string, string];
}

interface Plan {
  pr: Edit;
  main: Edit;
  mergeMain?: boolean;
  /** mergeMain の後に main を対象外の変更でさらに進める (merge-base が main 先端と一致しなくなる)。 */
  advanceAfterMerge?: boolean;
}

function git(dir: string, ...args: string[]): string {
  try {
    return execFileSync("git", ["-C", dir, ...args], {
      encoding: "utf8",
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const e = error as { stderr?: string; stdout?: string };
    const stderr = `${e.stderr ?? ""}${e.stdout ?? ""}`;
    throw new Error(`git ${args.join(" ")} failed: ${stderr}`);
  }
}

function configure(dir: string): void {
  git(dir, "config", "user.email", "fixture@example.test");
  git(dir, "config", "user.name", "fixture");
  git(dir, "config", "core.autocrlf", "false");
}

function writeFile(dir: string, path: string, line: string): void {
  const full = join(dir, path);
  mkdirSync(dirname(full), { recursive: true });
  appendFileSync(full, `${line}\n`, "utf8");
}

function applyEdit(dir: string, edit: Edit, label: string): void {
  for (const path of edit.touch ?? []) writeFile(dir, path, `${label} change`);
  if (edit.rename) git(dir, "mv", edit.rename[0], edit.rename[1]);
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "--allow-empty", "-m", label);
}

interface Fixture {
  base: string;
  work: string;
  prHead: string;
  mainTip: string;
}

/** bare origin + work (PR branch) + other (main を進める側)。work の origin/main は取り込むまで古いまま。 */
function buildFixture(plan: Plan): Fixture {
  const base = mkdtempSync(join(tmpdir(), "ut-tdd-bconf-"));
  const origin = join(base, "origin.git");
  const work = join(base, "work");
  const other = join(base, "other");
  execFileSync("git", ["init", "-q", "--bare", "-b", "main", origin], { windowsHide: true });
  execFileSync("git", ["clone", "-q", "-c", "core.autocrlf=false", origin, work], {
    windowsHide: true,
    stdio: "ignore",
  });
  configure(work);
  git(work, "checkout", "-q", "-B", "main");
  for (const path of BASE_FILES) writeFile(work, path, path.endsWith(".json") ? "{}" : "base");
  git(work, "add", "-A");
  git(work, "commit", "-q", "-m", "base");
  git(work, "push", "-q", "-u", "origin", "main");
  execFileSync("git", ["clone", "-q", "-c", "core.autocrlf=false", origin, other], {
    windowsHide: true,
    stdio: "ignore",
  });
  configure(other);
  git(work, "checkout", "-q", "-b", "pr");
  applyEdit(work, plan.pr, "pr");
  applyEdit(other, plan.main, "main");
  git(other, "push", "-q", "origin", "main");
  let mainTip = git(other, "rev-parse", "HEAD");
  if (plan.mergeMain) {
    // work の origin/main (remote-tracking ref) を動かさずに main の先端だけを取り込む。
    git(work, "fetch", "-q", "origin", "main:refs/tmp/main");
    git(work, "merge", "-q", "--no-ff", "--no-verify", "-m", "chore: merge main", "refs/tmp/main");
    git(work, "update-ref", "-d", "refs/tmp/main");
    if (plan.advanceAfterMerge) {
      applyEdit(other, { touch: [OUT_OF_SCOPE] }, "main-after-merge");
      git(other, "push", "-q", "origin", "main");
      mainTip = git(other, "rev-parse", "HEAD");
    }
  }
  return { base, work, prHead: git(work, "rev-parse", "HEAD"), mainTip };
}

function seedPassReview(root: string, headSha: string): void {
  const requests = join(root, ".ut-tdd", "review", "requests");
  const receipts = join(root, ".ut-tdd", "review", "receipts");
  mkdirSync(requests, { recursive: true });
  mkdirSync(receipts, { recursive: true });
  writeFileSync(
    join(requests, "request.json"),
    JSON.stringify({
      memoryId: "review:465:head:1",
      pr: 465,
      exactHead: headSha,
      reviewRevision: "review-r1",
      authorFamily: "claude",
      requestedAt: "2026-10-28T00:30:00.000Z",
    }),
  );
  writeFileSync(
    join(receipts, "receipt.json"),
    JSON.stringify({
      memoryId: "review:465:head:1",
      pr: 465,
      head: headSha,
      reviewRevision: "review-r1",
      reviewerFamily: "codex",
      kind: "verdict",
      verdict: "PASS",
      blockingFindings: [],
      at: "2026-10-28T00:45:00.000Z",
    }),
  );
}

function countingPorts(headSha: string): { ports: GhPrMergePorts; merges: () => number } {
  let merged = 0;
  return {
    ports: {
      getPullRequest: () => ({
        pr: 465,
        headSha,
        evaluatedHeadSha: headSha,
        state: "OPEN",
        checksGreen: true,
      }),
      mergePullRequest: () => {
        merged += 1;
      },
    },
    merges: () => merged,
  };
}

function runMerge(fx: Fixture, headSha = fx.prHead) {
  seedPassReview(fx.work, headSha);
  const counter = countingPorts(headSha);
  const result = runPrMerge({
    repoRoot: fx.work,
    pr: 465,
    now: () => now,
    ports: counter.ports,
  });
  return { result, merges: counter.merges() };
}

async function runCli(
  fx: Fixture,
  json: boolean,
): Promise<{ stdout: string; exitCode: number; merges: number }> {
  seedPassReview(fx.work, fx.prHead);
  const counter = countingPorts(fx.prHead);
  const previousExitCode = process.exitCode;
  const write = process.stdout.write;
  let stdout = "";
  process.exitCode = 0;
  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdout += String(chunk);
    return true;
  }) as typeof process.stdout.write;
  try {
    const program = new Command();
    registerPrMergeCommands(program, { ports: counter.ports, now: () => now, repoRoot: fx.work });
    const argv = ["node", "ut-tdd", "pr", "merge", "--pr", "465", ...(json ? ["--json"] : [])];
    await program.parseAsync(argv);
    return { stdout, exitCode: Number(process.exitCode), merges: counter.merges() };
  } finally {
    process.stdout.write = write;
    process.exitCode = previousExitCode;
  }
}

function withFixture(plan: Plan, body: (fx: Fixture) => void | Promise<void>) {
  return async () => {
    expect.hasAssertions();
    const fx = buildFixture(plan);
    try {
      await body(fx);
    } finally {
      rmSync(fx.base, { recursive: true, force: true });
    }
  };
}

function expectBaselineConflictDeny(run: ReturnType<typeof runMerge>): void {
  expect(run.result.ok).toBe(false);
  expect(run.result.decision).toBe("deny");
  expect(run.result.reason).toMatch(/^baseline_conflict(?!_unknown)/);
  expect(run.merges).toBe(0);
}

function expectUnknownDeny(run: ReturnType<typeof runMerge>): void {
  expect(run.result.ok).toBe(false);
  expect(run.result.reason).toMatch(/^baseline_conflict_unknown/);
  expect(run.merges).toBe(0);
}

const untouched: Plan = { pr: { touch: [OUT_OF_SCOPE] }, main: { touch: [OUT_OF_SCOPE] } };

describe("review merge gate baseline conflict (Issue #1423)", { timeout: 120_000 }, () => {
  for (const gate of [DOC_SPLIT, CODE_SIZE]) {
    const conflicts: Array<[string, Plan]> = [
      [
        "(a) PR と main が同じ対象ファイルを変更",
        { pr: { touch: [gate.target] }, main: { touch: [gate.target] } },
      ],
      [
        "(b) PR が baseline を変更し main が別の対象ファイルを変更",
        { pr: { touch: [gate.baseline] }, main: { touch: [gate.other] } },
      ],
      [
        "(c) main が baseline を変更し PR が対象ファイルを変更",
        { pr: { touch: [gate.target] }, main: { touch: [gate.baseline] } },
      ],
      [
        "(d) PR が対象ファイルを rename し main が旧 path を変更",
        { pr: { rename: [gate.target, gate.renamed] }, main: { touch: [gate.target] } },
      ],
    ];
    for (const [label, plan] of conflicts) {
      it.fails(
        `CANDIDATE-U-RVMG-047: ${gate.name} ${label} は baseline_conflict で deny し gh pr merge を呼ばない`,
        withFixture(plan, (fx) => {
          expectBaselineConflictDeny(runMerge(fx));
        }),
      );
    }

    const clean: Array<[string, Plan]> = [
      [
        "(a) 別々の対象ファイルを変更し baseline は両者とも不変",
        { pr: { touch: [gate.target] }, main: { touch: [gate.other] } },
      ],
      [
        "(b) PR が対象外だけを変更",
        { pr: { touch: [OUT_OF_SCOPE] }, main: { touch: [gate.target, gate.baseline] } },
      ],
      [
        "(c) main が対象外だけを変更",
        { pr: { touch: [gate.target, gate.baseline] }, main: { touch: [OUT_OF_SCOPE] } },
      ],
      [
        "(d) PR が main を取り込み済みで mb が main 先端 (mainChanged が空)",
        { pr: { touch: [gate.target] }, main: { touch: [gate.baseline] }, mergeMain: true },
      ],
      [
        "(e) PR が main を取り込んだ後に main が対象外の変更だけ進む",
        {
          pr: { touch: [gate.target] },
          main: { touch: [gate.baseline] },
          mergeMain: true,
          advanceAfterMerge: true,
        },
      ],
    ];
    for (const [label, plan] of clean) {
      it.fails(
        `CANDIDATE-U-RVMG-048: ${gate.name} ${label} は競合なしで merge し、判定のため origin/main を取得し直す`,
        withFixture(plan, (fx) => {
          if (plan.mergeMain) {
            // 前提: main の取り込みが済んでいる。advance なしなら merge-base は main 先端と一致する。
            expect(git(fx.work, "merge-base", fx.prHead, fx.mainTip) === fx.mainTip).toBe(
              !plan.advanceAfterMerge,
            );
            expect(git(fx.work, "rev-parse", "origin/main")).not.toBe(fx.mainTip);
          }
          const run = runMerge(fx);
          expect(run.result).toMatchObject({ ok: true, decision: "merge" });
          expect(run.merges).toBe(1);
          // L6 §6.2: mainChanged は「取得し直した origin/main」の先端との差。取得前の work の origin/main は古い。
          expect(git(fx.work, "rev-parse", "origin/main")).toBe(fx.mainTip);
        }),
      );
    }
  }

  const conflictPlan: Plan = {
    pr: { touch: [DOC_SPLIT.target] },
    main: { touch: [DOC_SPLIT.target] },
  };

  it.fails(
    "CANDIDATE-U-RVMG-049: 競合は exit 1 で、出力に gate 名・競合 path・main を取り込んで CI を取り直す案内を含む",
    withFixture(conflictPlan, async (fx) => {
      const cli = await runCli(fx, false);
      expect(cli.exitCode).toBe(1);
      expect(cli.merges).toBe(0);
      expect(cli.stdout).toContain("doc-split");
      expect(cli.stdout).toContain(DOC_SPLIT.target);
      expect(cli.stdout).toContain("git merge origin/main");
      // L6 §6.2: 取り込み後に CI が緑になってから再実行する案内 (同じ行に CI・緑・再実行がこの順で出る)。
      expect(cli.stdout).toMatch(/CI.*緑.*再実行/);
    }),
  );

  it.fails(
    "CANDIDATE-U-RVMG-049: --json の reason は baseline_conflict になる",
    withFixture(conflictPlan, async (fx) => {
      const cli = await runCli(fx, true);
      expect(cli.exitCode).toBe(1);
      expect(cli.merges).toBe(0);
      expect(JSON.parse(cli.stdout).reason).toMatch(/^baseline_conflict(?!_unknown)/);
    }),
  );

  it.fails(
    "CANDIDATE-U-RVMG-049: git fetch の失敗 (error) は baseline_conflict_unknown で deny し緑にならない",
    withFixture(untouched, (fx) => {
      git(fx.work, "remote", "set-url", "origin", join(fx.base, "missing-origin.git"));
      expectUnknownDeny(runMerge(fx));
    }),
  );

  it.fails(
    "CANDIDATE-U-RVMG-049: git diff の失敗 (error: fetch と merge-base は成功し diff だけ失敗) は baseline_conflict_unknown で deny する",
    withFixture(untouched, (fx) => {
      // PR head の tree object を消す。commit は読めるので fetch と merge-base は成功し、diff だけが失敗する。
      const tree = git(fx.work, "rev-parse", `${fx.prHead}^{tree}`);
      const object = join(fx.work, ".git", "objects", tree.slice(0, 2), tree.slice(2));
      expect(existsSync(object)).toBe(true);
      chmodSync(object, 0o666);
      rmSync(object, { force: true });
      expect(existsSync(object)).toBe(false);
      // 前提: fetch と merge-base は成功し、diff は失敗する。
      expect(() => git(fx.work, "fetch", "-q", "origin")).not.toThrow();
      const mb = git(fx.work, "merge-base", fx.prHead, "origin/main");
      expect(mb).toMatch(/^[0-9a-f]{40}$/);
      expect(() => git(fx.work, "diff", "-M", "--name-status", mb, fx.prHead)).toThrow();
      expectUnknownDeny(runMerge(fx));
    }),
  );

  it.fails(
    "CANDIDATE-U-RVMG-049: merge-base を解決できない (origin/main と履歴が無関係) PR は baseline_conflict_unknown で deny する",
    withFixture(untouched, (fx) => {
      git(fx.work, "checkout", "-q", "--orphan", "unrelated");
      git(fx.work, "rm", "-rfq", ".");
      writeFile(fx.work, "unrelated.txt", "unrelated");
      git(fx.work, "add", "unrelated.txt");
      git(fx.work, "commit", "-q", "-m", "unrelated");
      expectUnknownDeny(runMerge(fx, git(fx.work, "rev-parse", "HEAD")));
    }),
  );
});
