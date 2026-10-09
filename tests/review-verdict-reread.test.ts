import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canonicalizeReviewRequest,
  issueReviewRequest,
  projectReviewVerdict,
  type ReviewAttestation,
} from "../src/feedback/review-attestation.ts";
import { runPrMerge } from "../src/feedback/review-merge-gate.ts";
import {
  beginReviewAttempt,
  hasTerminalReviewReceipt,
  readReviewCustodyAudit,
  reviewIdentityDigest,
} from "../src/feedback/review-verdict-custody.ts";

const fault = vi.hoisted(() => ({ path: "", mode: "none", parsed: false }));
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  const read: typeof actual.readFileSync = ((path, options) => {
    if (String(path) === fault.path && fault.parsed && fault.mode === "unreadable") {
      throw Object.assign(new Error("injected second-read failure"), { code: "EACCES" });
    }
    const result = actual.readFileSync(path, options);
    if (String(path) === fault.path && options === "utf8" && !fault.parsed) {
      fault.parsed = true;
      if (fault.mode === "delete") actual.unlinkSync(fault.path);
    }
    return result;
  }) as typeof actual.readFileSync;
  return { ...actual, readFileSync: read };
});

const roots: string[] = [];
afterEach(() => {
  fault.path = "";
  fault.mode = "none";
  fault.parsed = false;
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "ut-verdict-reread-"));
  roots.push(root);
  execFileSync("git", ["init", "--quiet"], { cwd: root, stdio: "ignore" });
  const request = canonicalizeReviewRequest({
    memoryId: "memory:issue914",
    pr: 914,
    exactHead: "a".repeat(40),
    reviewRevision: "initial",
    authorFamily: "codex",
    requestedAt: "2026-10-09T01:00:00.000Z",
  });
  expect(issueReviewRequest({ repoRoot: root, request, strict: true }).ok).toBe(true);
  const attempt = beginReviewAttempt({
    repoRoot: root,
    request,
    provider: "claude",
    model: "claude-opus-5",
  });
  if (!attempt.ok) throw new Error(attempt.reason);
  writeFileSync(
    attempt.path,
    [
      "schema_version: ut-tdd.review-verdict/v1",
      `request_digest: ${reviewIdentityDigest(request)}`,
      `attempt: ${attempt.attempt}`,
      `pr: ${request.pr}`,
      `exact_head: ${request.exactHead}`,
      `review_revision: ${request.reviewRevision}`,
      "reviewer_provider: claude",
      "reviewer_model: claude-opus-5",
      `invocation_nonce: ${request.invocationNonce}`,
      "VERDICT: PASS",
    ].join("\n"),
    "utf8",
  );
  const attestation: ReviewAttestation = {
    provider: "claude",
    role: "blind-reviewer",
    model: "claude-opus-5",
    pr: request.pr,
    head: request.exactHead,
    reviewRevision: request.reviewRevision,
    startedAt: request.requestedAt,
    completedAt: "2026-10-09T01:01:00.000Z",
    exitCode: 0,
    attempt: attempt.attempt,
    invocationNonce: request.invocationNonce,
  };
  return { root, request, attestation, path: attempt.path };
}

function measureMerge(root: string, head: string) {
  let mutations = 0;
  const result = runPrMerge({
    repoRoot: root,
    pr: 914,
    now: () => "2026-10-09T01:02:00.000Z",
    ports: {
      getPullRequest: () => ({
        pr: 914,
        headSha: head,
        evaluatedHeadSha: head,
        state: "OPEN",
        checksGreen: true,
      }),
      mergePullRequest: () => {
        mutations += 1;
      },
    },
  });
  return { result, mutations };
}

describe("Issue #914: strict verdict second-read custody regression", () => {
  it("keeps the complete verdict path authoritative through the real merge wrapper", () => {
    const { root, request, attestation, path } = fixture();
    expect(
      projectReviewVerdict({ repoRoot: root, request, attestation, verdictFile: path }).ok,
    ).toBe(true);
    expect(hasTerminalReviewReceipt(root, request)).toBe(true);
    expect(measureMerge(root, request.exactHead)).toMatchObject({
      result: { ok: true },
      mutations: 1,
    });
  });

  it.each([
    "delete",
    "unreadable",
  ])("fails closed before receipt/audit/link when the second read is %s", (mode) => {
    const { root, request, attestation, path } = fixture();
    const before = readReviewCustodyAudit(root);
    fault.path = path;
    fault.mode = mode;
    const projected = projectReviewVerdict({
      repoRoot: root,
      request,
      attestation,
      verdictFile: path,
    });
    fault.path = "";
    expect(fault.parsed).toBe(true);
    if (mode === "delete") expect(existsSync(path)).toBe(false);
    const merge = measureMerge(root, request.exactHead);
    console.info("issue914 observed", {
      mode,
      projected,
      merge,
      terminal: hasTerminalReviewReceipt(root, request),
    });
    expect(merge).toMatchObject({ result: { ok: false }, mutations: 0 });
    expect(projected).toEqual({ ok: false, reason: "receipt_write_failed" });
    expect(readReviewCustodyAudit(root)).toEqual(before);
    const receipts = join(root, ".ut-tdd", "review", "receipts");
    expect(existsSync(receipts) ? readdirSync(receipts) : []).toEqual([]);
  });
});
