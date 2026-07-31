import { chmodSync, existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerDelegationCommands } from "../src/cli/delegation";
import {
  issueReviewRequest,
  projectReviewVerdict,
  REVIEW_VERDICT_FILE_ENV,
  type ReviewAttestation,
  type ReviewAttestationRequest,
} from "../src/feedback/review-attestation";
import { analyzeReviewDispatch } from "../src/feedback/review-dispatch";
import { REVIEW_OUTPUT_CONTRACT } from "../src/feedback/review-verdict-contract";

const head = "a".repeat(40);
const otherHead = "b".repeat(40);
let stubBinDir: string | undefined;
const originalCodexBin = process.env.UT_TDD_CODEX_BIN;

beforeAll(() => {
  stubBinDir = mkdtempSync(join(tmpdir(), "ut-tdd-rvatt-bin-"));
  if (process.platform === "win32") {
    const stub = join(stubBinDir, "codex.cmd");
    writeFileSync(stub, "@echo off\r\necho codex 0.0.0-stub\r\nexit /b 0\r\n", "utf8");
    process.env.UT_TDD_CODEX_BIN = stub;
    return;
  }
  const stub = join(stubBinDir, "codex");
  writeFileSync(stub, "#!/bin/sh\necho codex 0.0.0-stub\nexit 0\n", "utf8");
  chmodSync(stub, 0o755);
  process.env.UT_TDD_CODEX_BIN = stub;
});

afterAll(() => {
  if (originalCodexBin === undefined) delete process.env.UT_TDD_CODEX_BIN;
  else process.env.UT_TDD_CODEX_BIN = originalCodexBin;
  if (stubBinDir) rmSync(stubBinDir, { recursive: true, force: true });
});

function receiptFiles(root: string): string[] {
  const directory = join(root, ".ut-tdd", "review", "receipts");
  return existsSync(directory) ? readdirSync(directory) : [];
}

function request(): ReviewAttestationRequest {
  return {
    memoryId: "memory-rvatt",
    pr: 731,
    exactHead: head,
    reviewRevision: "review-rvatt-1",
    authorFamily: "claude",
    requestedAt: "2026-07-31T01:00:00.000Z",
  };
}

function attestation(overrides: Partial<ReviewAttestation> = {}): ReviewAttestation {
  return {
    provider: "codex",
    role: "blind-reviewer",
    model: "gpt-5.6-sol",
    pr: 731,
    head,
    reviewRevision: "review-rvatt-1",
    startedAt: "2026-07-31T01:00:00.000Z",
    completedAt: "2026-07-31T01:05:00.000Z",
    exitCode: 0,
    ...overrides,
  };
}

function runDelegation(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const program = new Command();
  registerDelegationCommands(program, {
    gitBranch: () => "work/d3b-review-attestation",
    gitHead: () => head,
    resolveTaskText: (opts) => opts.task ?? null,
    resolveSkillContextInjection: () => undefined,
    runSessionStartSideEffects: () => {},
    taskFileOptionDescription: "read task text from file",
    writeHandoverWarnings: () => {},
  });
  let stdout = "";
  let stderr = "";
  const writeStdout = process.stdout.write;
  const writeStderr = process.stderr.write;
  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdout += String(chunk);
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderr += String(chunk);
    return true;
  }) as typeof process.stderr.write;
  return program
    .parseAsync(["node", "ut-tdd", ...args])
    .then(
      () => ({ stdout, stderr }),
      (error) => {
        throw error;
      },
    )
    .finally(() => {
      process.stdout.write = writeStdout;
      process.stderr.write = writeStderr;
    });
}

describe("review attestation (U-RVATT)", () => {
  it("U-RVATT-001: reviewerFamily は呼出元の自己申告でなく attestation.provider から導出する", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-rvatt-family-"));
    const verdictFile = join(root, "reviewer.verdict");
    try {
      writeFileSync(verdictFile, "VERDICT: PASS\n", "utf8");
      const result = projectReviewVerdict({
        repoRoot: root,
        request: request(),
        attestation: attestation(),
        verdictFile,
        reviewerFamily: "claude",
      } as never);
      expect(result).toMatchObject({ ok: true, receipt: { reviewerFamily: "codex" } });
      expect(result.ok && result.receipt?.at).toBe("2026-07-31T01:05:00.000Z");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-RVATT-002: 非ゼロ終了の attestation は reviewer_exit_nonzero で receipt を作らない", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-rvatt-exit-"));
    const verdictFile = join(root, "reviewer.verdict");
    try {
      writeFileSync(verdictFile, "VERDICT: PASS\n", "utf8");
      const result = projectReviewVerdict({
        repoRoot: root,
        request: request(),
        attestation: attestation({ exitCode: 17 }),
        verdictFile,
      });
      expect(result).toEqual({ ok: false, reason: "reviewer_exit_nonzero" });
      expect(receiptFiles(root)).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-RVATT-003: 同一内容の receipt replay は content-addressed な1ファイルへ収束する", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-rvatt-replay-"));
    const verdictFile = join(root, "reviewer.verdict");
    try {
      writeFileSync(verdictFile, "VERDICT: PASS\n", "utf8");
      const first = projectReviewVerdict({
        repoRoot: root,
        request: request(),
        attestation: attestation(),
        verdictFile,
      });
      const replay = projectReviewVerdict({
        repoRoot: root,
        request: request(),
        attestation: attestation(),
        verdictFile,
      });
      expect(first).toMatchObject({ ok: true });
      expect(replay).toMatchObject({ ok: true });
      expect(receiptFiles(root)).toHaveLength(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-RVATT-004: receipt 内容が1バイトでも異なれば別 digest ファイルになる", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-rvatt-digest-"));
    const verdictFile = join(root, "reviewer.verdict");
    try {
      writeFileSync(verdictFile, "VERDICT: PASS\n", "utf8");
      const first = projectReviewVerdict({
        repoRoot: root,
        request: request(),
        attestation: attestation(),
        verdictFile,
      });
      const changed = projectReviewVerdict({
        repoRoot: root,
        request: request(),
        attestation: attestation({ completedAt: "2026-07-31T01:05:00.001Z" }),
        verdictFile,
      });
      expect(first).toMatchObject({ ok: true });
      expect(changed).toMatchObject({ ok: true });
      expect(receiptFiles(root)).toHaveLength(2);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-RVATT-005: review_lane role の --review-head 欠落は review_head_required で fail-close する", async () => {
    const priorExitCode = process.exitCode;
    process.exitCode = undefined;
    try {
      const result = await runDelegation([
        "codex",
        "--role",
        "blind-reviewer",
        "--task",
        "review slice",
        "--review-pr",
        "731",
        "--review-revision",
        "review-rvatt-1",
      ]);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("review_head_required");
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = priorExitCode;
    }
  });

  it("U-RVATT-006: attestation.head と PR observation.head が異なれば D1 は merge_ready にしない", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-rvatt-head-"));
    const verdictFile = join(root, "reviewer.verdict");
    try {
      writeFileSync(verdictFile, "VERDICT: PASS\n", "utf8");
      const issued = issueReviewRequest({ repoRoot: root, request: request() });
      const projected = projectReviewVerdict({
        repoRoot: root,
        request: request(),
        attestation: attestation(),
        verdictFile,
      });
      expect(issued).toMatchObject({ ok: true });
      expect(projected).toMatchObject({ ok: true });
      if (!issued.ok || !projected.ok || !projected.receipt) return;
      const dispatch = analyzeReviewDispatch({
        requests: [issued.request],
        receipts: [projected.receipt],
        prs: [{ pr: 731, headSha: otherHead, state: "OPEN", checksGreen: true }],
        now: "2026-07-31T01:10:00.000Z",
      });
      expect(dispatch.entries[0].state).not.toBe("merge_ready");
      expect(dispatch.entries[0].progressDiagnostics).toContain("request_superseded");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-RVATT-007: verdict file 不在は verdict_file_missing で receipt を作らず D1 の SLA breach に残す", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-rvatt-missing-"));
    const verdictFile = join(root, "missing.verdict");
    try {
      const issued = issueReviewRequest({ repoRoot: root, request: request() });
      const projected = projectReviewVerdict({
        repoRoot: root,
        request: request(),
        attestation: attestation(),
        verdictFile,
      });
      expect(issued).toMatchObject({ ok: true });
      expect(projected).toEqual({ ok: false, reason: "verdict_file_missing" });
      expect(receiptFiles(root)).toEqual([]);
      if (!issued.ok) return;
      const dispatch = analyzeReviewDispatch({
        requests: [issued.request],
        receipts: [],
        prs: [{ pr: 731, headSha: head, state: "OPEN", checksGreen: true }],
        now: "2026-07-31T02:01:00.000Z",
      });
      expect(dispatch.entries[0].breaches).toEqual(["verdict"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-RVATT-008: verdict file に echo された契約があっても実 verdict を採用する", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-rvatt-echo-"));
    const verdictFile = join(root, "reviewer.verdict");
    try {
      writeFileSync(verdictFile, `${REVIEW_OUTPUT_CONTRACT}\n\nVERDICT: PASS\n`, "utf8");
      const result = projectReviewVerdict({
        repoRoot: root,
        request: request(),
        attestation: attestation(),
        verdictFile,
      });
      expect(result).toMatchObject({
        ok: true,
        receipt: { verdict: "PASS", blockingFindings: [] },
      });
      expect(REVIEW_OUTPUT_CONTRACT).toContain("UT_TDD_REVIEW_VERDICT_FILE");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-RVATT-009: 発行 request は receipt と memoryId/pr/exactHead/reviewRevision を突合できる", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-rvatt-request-"));
    const verdictFile = join(root, "reviewer.verdict");
    try {
      writeFileSync(verdictFile, "VERDICT: PASS\n", "utf8");
      const issued = issueReviewRequest({ repoRoot: root, request: request() });
      const projected = projectReviewVerdict({
        repoRoot: root,
        request: request(),
        attestation: attestation(),
        verdictFile,
      });
      expect(issued).toMatchObject({
        ok: true,
        request: {
          memoryId: "memory-rvatt",
          pr: 731,
          exactHead: head,
          reviewRevision: "review-rvatt-1",
        },
      });
      expect(projected).toMatchObject({
        ok: true,
        receipt: { memoryId: "memory-rvatt", pr: 731, head, reviewRevision: "review-rvatt-1" },
      });
      expect(readdirSync(join(root, ".ut-tdd", "review", "requests"))).toHaveLength(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  // U-RVATT-010〜012 は**輸送そのもの**を固定する。001〜009 は `verdictFile` を手渡しで
  // 与えているため、「harness が子プロセスへ注入した path」と「harness が読み戻す path」が
  // 同一である保証がどこにも無い。別名の env を注入しても全件緑になってしまう。
  // これは D3a で踏んだ producer/consumer 乖離と同型なので、単一の定数を根拠にした
  // round-trip フェンスを張る。
  it("U-RVATT-010: review_lane 委譲だけが verdict file env を repo 外 path で子へ渡す", async () => {
    const reviewer = await runDelegation([
      "codex",
      "--role",
      "blind-reviewer",
      "--task",
      "review slice",
      "--review-pr",
      "731",
      "--review-head",
      head,
      "--review-revision",
      "review-rvatt-1",
    ]);
    const worker = await runDelegation(["codex", "--role", "be-api", "--task", "implement slice"]);
    expect(reviewer.stdout, "review_lane の dry-run が stdout へ何も出していない").not.toBe("");
    expect(worker.stdout, "worker の dry-run が stdout へ何も出していない").not.toBe("");
    const injected = JSON.parse(reviewer.stdout).env?.[REVIEW_VERDICT_FILE_ENV];
    expect(typeof injected).toBe("string");
    // read-only reviewer guard を壊さないため、書き込み先は repo の外でなければならない。
    expect(injected.startsWith(process.cwd())).toBe(false);
    expect(JSON.parse(worker.stdout).env?.[REVIEW_VERDICT_FILE_ENV]).toBeUndefined();
  });

  it("U-RVATT-011: 契約テキストと reader は同一の env 定数を根拠にする", () => {
    expect(REVIEW_VERDICT_FILE_ENV).toBe("UT_TDD_REVIEW_VERDICT_FILE");
    expect(REVIEW_OUTPUT_CONTRACT).toContain(REVIEW_VERDICT_FILE_ENV);
  });

  it("U-RVATT-012: 注入された path をそのまま読み戻して receipt を作れる", async () => {
    const delegated = await runDelegation([
      "codex",
      "--role",
      "blind-reviewer",
      "--task",
      "review slice",
      "--review-pr",
      "731",
      "--review-head",
      head,
      "--review-revision",
      "review-rvatt-1",
    ]);
    expect(delegated.stdout, "review_lane の dry-run が stdout へ何も出していない").not.toBe("");
    const verdictFile = JSON.parse(delegated.stdout).env[REVIEW_VERDICT_FILE_ENV] as string;
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-rvatt-wire-"));
    try {
      writeFileSync(verdictFile, "VERDICT: PASS\n", "utf8");
      const result = projectReviewVerdict({
        repoRoot: root,
        request: request(),
        attestation: attestation(),
        verdictFile,
      });
      expect(result).toMatchObject({ ok: true, receipt: { verdict: "PASS" } });
      expect(receiptFiles(root)).toHaveLength(1);
    } finally {
      rmSync(verdictFile, { force: true });
      rmSync(root, { recursive: true, force: true });
    }
  });
});
