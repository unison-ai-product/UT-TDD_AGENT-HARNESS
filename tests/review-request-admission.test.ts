import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerDelegationCommands } from "../src/cli/delegation.ts";
import {
  canonicalizeReviewRequest,
  type ReviewAttestationRequest,
} from "../src/feedback/review-attestation.ts";
import { runPrMerge } from "../src/feedback/review-merge-gate.ts";
import { beginReviewAttempt } from "../src/feedback/review-verdict-custody.ts";
import { removeTestTree } from "./support/temp-tree.ts";

// issue #1600: review request は入口の検査をすべて終えてから custody へ書く。
// 契約: docs/design/harness/L6-function-design/review-request-admission.md
// oracle: docs/test-design/harness/L7-review-request-admission-test-design.md
// Red は未実装の admitReviewRequest ではなく、既存の委譲 CLI の観測可能な挙動 (custody に残る
// file と stderr の reason) で表す。module の import 失敗では Red にならない。

const detected = vi.hoisted(() => ({ currentRuntime: "claude" as "claude" | "codex" | null }));
vi.mock("../src/runtime/detect.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/runtime/detect.ts")>();
  return {
    ...actual,
    detectMode: () => ({
      mode: "hybrid" as const,
      claude: true,
      codex: true,
      currentRuntime: detected.currentRuntime,
      availableRuntimes: ["claude", "codex"],
      missingRuntimes: [],
    }),
  };
});

const HEAD = "a".repeat(40);
const OTHER_HEAD = "b".repeat(40);
const PR = 465;
const NOW = "2026-11-11T01:00:00.000Z";

interface CliResult {
  exitCode: number | undefined;
  stderr: string;
  stdout: string;
  spawnCalls: number;
}

type SpawnResult = { status: number | null; signal: null; error?: Error };

const okSpawn = (): SpawnResult => ({ status: 0, signal: null });
const failLaunch = (): SpawnResult => ({
  status: null,
  signal: null,
  error: new Error("launch failed"),
});

let root = "";

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "ut-tdd-rvadm-"));
  // custody の audit は git common dir を通して読むため、tmp repo は git repo にする。
  execFileSync("git", ["init", "-q"], { cwd: root, windowsHide: true });
});

afterEach(() => {
  removeTestTree(root);
});

function runCli(
  provider: "claude" | "codex",
  runtime: "claude" | "codex",
  args: string[],
  spawn: () => SpawnResult = okSpawn,
): CliResult {
  detected.currentRuntime = runtime;
  const program = new Command();
  program.exitOverride();
  program.configureOutput({ writeErr: () => {}, writeOut: () => {} });
  let spawnCalls = 0;
  registerDelegationCommands(program, {
    gitBranch: () => "test/issue1600",
    gitHead: () => HEAD.slice(0, 7),
    resolveTaskText: (opts) => opts.task ?? null,
    resolveSkillContextInjection: () => undefined,
    runSessionStartSideEffects: () => {},
    taskFileOptionDescription: "read task text from file",
    writeHandoverWarnings: () => {},
    now: () => NOW,
    spawnSync: () => {
      spawnCalls += 1;
      return spawn();
    },
  });
  const stderr: string[] = [];
  const stdout: string[] = [];
  const cwd = vi.spyOn(process, "cwd").mockReturnValue(root);
  const errSpy = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
    stderr.push(String(chunk));
    return true;
  });
  const outSpy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    stdout.push(String(chunk));
    return true;
  });
  const previousExitCode = process.exitCode;
  process.exitCode = undefined;
  let exitCode: number | undefined;
  try {
    program.parse(["node", "ut-tdd", provider, ...args]);
  } catch (error) {
    stderr.push(String((error as Error).message));
  } finally {
    exitCode = process.exitCode as number | undefined;
    process.exitCode = previousExitCode;
    outSpy.mockRestore();
    errSpy.mockRestore();
    cwd.mockRestore();
  }
  return { exitCode, stderr: stderr.join(""), stdout: stdout.join(""), spawnCalls };
}

function base(execute: boolean, head = HEAD): string[] {
  return [
    "--role",
    "blind-reviewer",
    "--task",
    "probe admission",
    ...(execute ? ["--execute"] : []),
    "--review-pr",
    String(PR),
    "--review-head",
    head,
  ];
}

function reviewFiles(): string[] {
  const dir = join(root, ".ut-tdd", "review");
  const out: string[] = [];
  const walk = (current: string): void => {
    if (!existsSync(current)) return;
    for (const name of readdirSync(current).sort()) {
      const full = join(current, name);
      if (statSync(full).isDirectory()) walk(full);
      else out.push(full.slice(dir.length + 1).replaceAll("\\", "/"));
    }
  };
  walk(dir);
  return out;
}

function requestFiles(): string[] {
  return reviewFiles().filter((file) => file.startsWith("requests/"));
}

function readRequests(): Array<Record<string, unknown>> {
  return requestFiles().map(
    (file) =>
      JSON.parse(readFileSync(join(root, ".ut-tdd", "review", file), "utf8")) as Record<
        string,
        unknown
      >,
  );
}

function gate(head = HEAD) {
  return runPrMerge({
    repoRoot: root,
    pr: PR,
    now: () => "2026-11-11T02:00:00.000Z",
    ports: {
      getPullRequest: () => ({
        pr: PR,
        headSha: head,
        evaluatedHeadSha: head,
        state: "OPEN",
        checksGreen: true,
      }),
      mergePullRequest: () => undefined,
      checkBaselineConflict: () => null,
    },
  });
}

function writePassReceipt(request: Record<string, unknown>, reviewerFamily: "claude" | "codex") {
  const receipts = join(root, ".ut-tdd", "review", "receipts");
  mkdirSync(receipts, { recursive: true });
  writeFileSync(
    join(receipts, "synthetic-pass.json"),
    JSON.stringify({
      memoryId: request.memoryId,
      pr: request.pr,
      head: request.exactHead,
      reviewRevision: request.reviewRevision,
      reviewerFamily,
      kind: "verdict",
      verdict: "PASS",
      blockingFindings: [],
      at: "2026-11-11T01:30:00.000Z",
    }),
    "utf8",
  );
}

function expectRejectedWithoutWrite(result: CliResult, reason: string): void {
  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain(reason);
  expect(result.spawnCalls).toBe(0);
  expect(reviewFiles()).toEqual([]);
}

describe("review request admission (issue #1600)", () => {
  it.fails("U-RVADM-001: 族分離の拒否は request を残さない", () => {
    const result = runCli("claude", "claude", [
      ...base(true),
      "--review-revision",
      "r1",
      "--review-author-family",
      "claude",
    ]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("same_family_reviewer_denied");
    expect(result.spawnCalls).toBe(0);
    expect(reviewFiles()).toEqual([]);
  });

  it("U-RVADM-002: model の下限の拒否は request を残さない (CLI の入口では routing が先に拒否する)", () => {
    const result = runCli("claude", "codex", [
      ...base(true),
      "--model",
      "claude-haiku-5-5",
      "--review-revision",
      "r1",
      "--review-author-family",
      "codex",
    ]);
    expectRejectedWithoutWrite(result, "below the review floor");
  });

  it("U-RVADM-003: 空文字の revision は採番せず review_head_required で拒否する", () => {
    const result = runCli("claude", "codex", [
      ...base(true),
      "--review-revision",
      "",
      "--review-author-family",
      "codex",
    ]);
    expectRejectedWithoutWrite(result, "review_head_required");
  });

  it.fails("U-RVADM-003: 空白だけの revision は採番せず review_head_required で拒否する", () => {
    const result = runCli("claude", "codex", [
      ...base(true),
      "--review-revision",
      "  ",
      "--review-author-family",
      "codex",
    ]);
    expectRejectedWithoutWrite(result, "review_head_required");
  });

  it.fails("U-RVADM-004: 値が option 名になる revision は review_revision_invalid で拒否する (a)", () => {
    const result = runCli("claude", "codex", [
      ...base(true),
      "--review-revision",
      "--review-author-family",
    ]);
    expectRejectedWithoutWrite(result, "review_revision_invalid");
  });

  it.fails("U-RVADM-004: 事象の実例 (値が消えて位置引数が余る) は review_revision_invalid を優先する (b)", () => {
    const result = runCli("claude", "claude", [
      ...base(true),
      "--review-revision",
      "--review-author-family",
      "codex",
    ]);
    expectRejectedWithoutWrite(result, "review_revision_invalid");
  });

  it.fails("U-RVADM-005: 余分な位置引数は review_unexpected_argument で拒否する", () => {
    const result = runCli("claude", "codex", [
      ...base(true),
      "--review-revision",
      "r1",
      "--review-author-family",
      "codex",
      "extra",
    ]);
    expectRejectedWithoutWrite(result, "review_unexpected_argument");
  });

  it("U-RVADM-006: 明示した author family が推定の runtime と食い違ってもそのまま記録される", () => {
    const first = runCli("claude", "claude", [
      ...base(true),
      "--review-revision",
      "r1",
      "--review-author-family",
      "codex",
    ]);
    expect(first.stderr).not.toContain("review_author_family_required");
    expect(readRequests().map((request) => request.authorFamily)).toEqual(["codex"]);
  });

  it("U-RVADM-006: codex runtime でも明示の claude が記録される", () => {
    runCli("codex", "codex", [
      ...base(true),
      "--review-revision",
      "r1",
      "--review-author-family",
      "claude",
    ]);
    expect(readRequests().map((request) => request.authorFamily)).toEqual(["claude"]);
  });

  it("U-RVADM-006: 無効な author family は推定へ落とさず request を作らない", () => {
    const result = runCli("claude", "claude", [
      ...base(true),
      "--review-revision",
      "r1",
      "--review-author-family",
      "foo",
    ]);
    expectRejectedWithoutWrite(result, "review_author_family_required");
  });

  it("U-RVADM-007: 対照 - 正しい request に PASS receipt があれば merge gate は pending で止めない", () => {
    runCli("claude", "claude", [
      ...base(true),
      "--review-revision",
      "r1",
      "--review-author-family",
      "codex",
    ]);
    const requests = readRequests();
    expect(requests).toHaveLength(1);
    // PASS receipt は custody の正規投影ではなく合成の stand-in (verdict の file 契約は Green で通す)。
    writePassReceipt(requests[0] as Record<string, unknown>, "claude");
    const decision = gate();
    expect(decision.reason).not.toContain("pending_request_for_head");
    expect(decision.reason).not.toContain("verdict_missing");
  });

  it.fails("U-RVADM-007: 事象の実例 - 拒否された呼び出しのあとも正しい request の PASS で通る", () => {
    const incident = runCli("claude", "claude", [
      ...base(true),
      "--review-revision",
      "--review-author-family",
      "codex",
    ]);
    expect(incident.exitCode).toBe(1);
    runCli("claude", "claude", [
      ...base(true),
      "--review-revision",
      "r1",
      "--review-author-family",
      "codex",
    ]);
    const correct = readRequests().find((request) => request.authorFamily === "codex");
    expect(correct).toBeDefined();
    writePassReceipt(correct as Record<string, unknown>, "claude");
    const decision = gate();
    expect(decision.reason).not.toContain("pending_request_for_head");
    expect(decision.reason).not.toContain("verdict_missing");
  });

  it("U-RVADM-008: 受理のあとに reviewer の起動が失敗したら request が残り merge を止める", () => {
    const result = runCli(
      "claude",
      "codex",
      [...base(true), "--review-revision", "r1", "--review-author-family", "codex"],
      failLaunch,
    );
    expect(result.spawnCalls).toBe(1);
    expect(result.exitCode).not.toBe(0);
    expect(requestFiles()).toHaveLength(1);
    const decision = gate();
    expect(decision.ok).toBe(false);
    expect(decision.reason).toContain("pending_request_for_head");
    expect(decision.reason).toContain("verdict_missing");
  });

  it("U-RVADM-009: verdict の無い正規の request は従来どおり merge を止める", () => {
    const requests = join(root, ".ut-tdd", "review", "requests");
    mkdirSync(requests, { recursive: true });
    writeFileSync(
      join(requests, "request.json"),
      JSON.stringify({
        memoryId: `review:${PR}:${HEAD}:r1`,
        pr: PR,
        exactHead: HEAD,
        reviewRevision: "r1",
        authorFamily: "codex",
        requestedAt: "2026-11-11T00:30:00.000Z",
      }),
      "utf8",
    );
    const decision = gate();
    expect(decision.ok).toBe(false);
    expect(decision.reason).toContain("pending_request_for_head");
  });

  it("U-RVADM-010: beginReviewAttempt は同族の provider を従来どおり拒否する (二重防御)", () => {
    const request = canonicalizeReviewRequest({
      memoryId: `review:${PR}:${HEAD}:r1`,
      pr: PR,
      exactHead: HEAD,
      reviewRevision: "r1",
      authorFamily: "claude",
      requestedAt: NOW,
    } as ReviewAttestationRequest);
    const result = beginReviewAttempt({
      repoRoot: root,
      request,
      provider: "claude",
      model: "claude-opus-5-5",
      now: NOW,
    });
    expect(result).toEqual({ ok: false, reason: "same_family_reviewer_denied" });
    expect(reviewFiles()).toEqual([]);
  });

  it.fails("U-RVADM-011: dry-run も族分離の拒否を入口で返し、何も書かない", () => {
    const result = runCli("claude", "claude", [
      ...base(false),
      "--review-revision",
      "r1",
      "--review-author-family",
      "claude",
    ]);
    expectRejectedWithoutWrite(result, "same_family_reviewer_denied");
  });

  it.fails("U-RVADM-011: dry-run も option の取り違えを入口で拒否する", () => {
    const result = runCli("claude", "claude", [
      ...base(false),
      "--review-revision",
      "--review-author-family",
      "codex",
    ]);
    expectRejectedWithoutWrite(result, "review_revision_invalid");
  });

  it("U-RVADM-011: 正しい呼び出しの dry-run は計画を出して成功し、何も書かない", () => {
    const result = runCli("claude", "codex", [
      ...base(false),
      "--review-revision",
      "r1",
      "--review-author-family",
      "codex",
    ]);
    expect(result.exitCode).toBeUndefined();
    expect(result.stdout).toContain("claude");
    expect(result.spawnCalls).toBe(0);
    expect(reviewFiles()).toEqual([]);
  });

  it("U-RVADM-012: すでに残っている request は別 HEAD の呼び出しで変わらない", () => {
    const args = ["--review-revision", "r1", "--review-author-family", "codex"];
    runCli("claude", "codex", [...base(true, HEAD), ...args], failLaunch);
    const [firstFile] = requestFiles();
    const path = join(root, ".ut-tdd", "review", firstFile as string);
    const before = readFileSync(path);
    runCli("claude", "codex", [...base(true, OTHER_HEAD), ...args], failLaunch);
    expect(readFileSync(path).equals(before)).toBe(true);
    expect(requestFiles()).toHaveLength(2);
    expect(gate(HEAD).reason).toContain("pending_request_for_head");
  });

  it("U-RVADM-013: 複合入力は既存の author family の検査が先に当たる", () => {
    const result = runCli("claude", "codex", [
      ...base(true),
      "--review-revision=-bad",
      "--review-author-family",
      "foo",
    ]);
    expectRejectedWithoutWrite(result, "review_author_family_required");
  });

  it.fails("U-RVADM-013: 対照 - author family が有効なら revision の形で review_revision_invalid になる", () => {
    const result = runCli("claude", "codex", [
      ...base(true),
      "--review-revision=-bad",
      "--review-author-family",
      "codex",
    ]);
    expectRejectedWithoutWrite(result, "review_revision_invalid");
  });
});
