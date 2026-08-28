import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  canonicalizeReviewRequest,
  projectReviewVerdict,
  type ReviewAttestation,
  type ReviewAttestationRequest,
} from "../src/feedback/review-attestation.ts";
import {
  beginReviewAttempt,
  cleanupReviewAttempt,
  readReviewCustodyAudit,
  recordReviewAttemptFailure,
  reviewCustodyAuditPath,
  reviewIdentityDigest,
} from "../src/feedback/review-verdict-custody.ts";

const head = "a".repeat(40);

function fixture(): { root: string; request: ReviewAttestationRequest; digest: string } {
  const root = mkdtempSync(join(tmpdir(), "ut-rv-supersession-"));
  execFileSync("git", ["init", "--quiet"], { cwd: root, stdio: "ignore" });
  const request = canonicalizeReviewRequest({
    memoryId: "memory:rv-supersession",
    pr: 386,
    exactHead: head,
    reviewRevision: "legacy-revision",
    authorFamily: "codex",
    requestedAt: "2026-08-28T00:00:00.000Z",
  });
  return { root, request, digest: reviewIdentityDigest(request) };
}

function attestation(
  request: ReviewAttestationRequest,
  attempt: number,
  exitCode: number,
  model = "claude-opus-5",
): ReviewAttestation {
  return {
    provider: "claude",
    role: "blind-reviewer",
    model,
    pr: request.pr,
    head: request.exactHead,
    reviewRevision: request.reviewRevision,
    startedAt: "2026-08-28T00:00:00.000Z",
    completedAt: "2026-08-28T00:01:00.000Z",
    exitCode,
    attempt,
    invocationNonce: request.invocationNonce,
  };
}

function verdictText(request: ReviewAttestationRequest, attempt: number, model = "claude-opus-5") {
  return [
    "schema_version: ut-tdd.review-verdict/v1",
    `request_digest: ${reviewIdentityDigest(request)}`,
    `attempt: ${attempt}`,
    `pr: ${request.pr}`,
    `exact_head: ${request.exactHead}`,
    `review_revision: ${request.reviewRevision}`,
    "reviewer_provider: claude",
    `reviewer_model: ${model}`,
    `invocation_nonce: ${request.invocationNonce}`,
    "VERDICT: PASS",
  ].join("\n");
}

function cleanup(root: string): void {
  rmSync(root, { recursive: true, force: true });
}

describe("PLAN-L7-520 append-only receipt supersession", () => {
  it("CANDIDATE-U-RVATT-040 composition / case C preserves failed attempt and creates one receipt", () => {
    const { root, request, digest } = fixture();
    try {
      const first = beginReviewAttempt({
        repoRoot: root,
        request,
        provider: "claude",
        model: "claude-opus-5",
      });
      expect(first).toMatchObject({ ok: true, attempt: 1 });
      if (!first.ok) return;
      writeFileSync(first.path, verdictText(request, 1), "utf8");
      expect(
        projectReviewVerdict({
          repoRoot: root,
          request,
          attestation: attestation(request, 1, 7),
          verdictFile: first.path,
        }),
      ).toEqual({ ok: false, reason: "reviewer_exit_nonzero" });
      expect(readReviewCustodyAudit(root)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kind: "attempt_execution_failed", attempt: 1, exitCode: 7 }),
        ]),
      );
      const firstFailure = readReviewCustodyAudit(root).find(
        (event) => event.kind === "attempt_execution_failed" && event.attempt === 1,
      );
      if (!firstFailure) throw new Error("missing first failure event");

      const second = beginReviewAttempt({
        repoRoot: root,
        request,
        provider: "claude",
        model: "claude-sonnet-5",
      });
      expect(second).toMatchObject({ ok: true, attempt: 2 });
      if (!second.ok) return;
      writeFileSync(second.path, verdictText(request, 2, "claude-sonnet-5"), "utf8");
      const projected = projectReviewVerdict({
        repoRoot: root,
        request,
        attestation: attestation(request, 2, 0, "claude-sonnet-5"),
        verdictFile: second.path,
      });
      expect(projected).toMatchObject({ ok: true });
      expect(readReviewCustodyAudit(root)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "superseded_attempt",
            attempt: 2,
            supersededAttempt: 1,
            oldAttemptDigest: expect.any(String),
          }),
        ]),
      );
      expect(existsSync(first.path)).toBe(true);
      expect(existsSync(join(root, ".ut-tdd", "review", "receipts", `${digest}.json`))).toBe(true);
      cleanupReviewAttempt({
        repoRoot: root,
        requestDigest: digest,
        attempt: 2,
        verdictPath: second.path,
        receiptDigest: projected.ok ? projected.digest : "",
        exactHead: request.exactHead,
      });
      expect(existsSync(first.path)).toBe(true);
      expect(existsSync(second.path)).toBe(false);
      expect(readReviewCustodyAudit(root)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "attempt_execution_failed",
            attempt: 1,
            requestDigest: digest,
            exactHead: request.exactHead,
            verdictPath: first.path,
            verdictDigest: firstFailure.verdictDigest,
          }),
          expect.objectContaining({
            kind: "superseded_attempt",
            attempt: 2,
            supersededAttempt: 1,
            requestDigest: digest,
            exactHead: request.exactHead,
            verdictPath: first.path,
            oldAttemptDigest: firstFailure.verdictDigest,
          }),
        ]),
      );
    } finally {
      cleanup(root);
    }
  });

  it("CANDIDATE-U-RVATT-040: multiple retry chain keeps prior supersession history valid", () => {
    const { root, request } = fixture();
    try {
      const first = beginReviewAttempt({
        repoRoot: root,
        request,
        provider: "claude",
        model: "claude-opus-5",
      });
      if (!first.ok) throw new Error(first.reason);
      writeFileSync(first.path, verdictText(request, 1), "utf8");
      expect(
        projectReviewVerdict({
          repoRoot: root,
          request,
          attestation: attestation(request, 1, 7),
          verdictFile: first.path,
        }),
      ).toEqual({ ok: false, reason: "reviewer_exit_nonzero" });

      const second = beginReviewAttempt({
        repoRoot: root,
        request,
        provider: "claude",
        model: "claude-sonnet-5",
      });
      if (!second.ok) throw new Error(second.reason);
      writeFileSync(second.path, verdictText(request, 2, "claude-sonnet-5"), "utf8");
      expect(
        projectReviewVerdict({
          repoRoot: root,
          request,
          attestation: attestation(request, 2, 8, "claude-sonnet-5"),
          verdictFile: second.path,
        }),
      ).toEqual({ ok: false, reason: "reviewer_exit_nonzero" });

      const third = beginReviewAttempt({
        repoRoot: root,
        request,
        provider: "claude",
        model: "claude-opus-5",
      });
      expect(third).toMatchObject({ ok: true, attempt: 3 });
      if (!third.ok) return;
      writeFileSync(third.path, verdictText(request, 3), "utf8");
      expect(
        projectReviewVerdict({
          repoRoot: root,
          request,
          attestation: attestation(request, 3, 0),
          verdictFile: third.path,
        }),
      ).toMatchObject({ ok: true });
    } finally {
      cleanup(root);
    }
  });

  it("CANDIDATE-U-RVATT-040 case A: missing failure outcome blocks retry", () => {
    const { root, request } = fixture();
    try {
      const first = beginReviewAttempt({
        repoRoot: root,
        request,
        provider: "claude",
        model: "claude-opus-5",
      });
      if (!first.ok) throw new Error(first.reason);
      writeFileSync(first.path, verdictText(request, 1), "utf8");
      const recorded = recordReviewAttemptFailure({
        repoRoot: root,
        request,
        attempt: 1,
        provider: "claude",
        model: "claude-opus-5",
        exitCode: 7,
        verdictPath: first.path,
        now: "2026-08-28T00:01:00.000Z",
      });
      expect(recorded.ok).toBe(true);
      const auditPath = reviewCustodyAuditPath(root);
      const lines = readFileSync(auditPath, "utf8").trim().split("\n");
      writeFileSync(
        auditPath,
        `${lines.filter((line) => !line.includes('"kind":"attempt_execution_failed"')).join("\n")}\n`,
        "utf8",
      );
      expect(
        beginReviewAttempt({
          repoRoot: root,
          request,
          provider: "claude",
          model: "claude-sonnet-5",
        }),
      ).toEqual({
        ok: false,
        reason: "attempt_outcome_indeterminate",
      });
    } finally {
      cleanup(root);
    }
  });

  it("CANDIDATE-U-RVATT-040 case D: duplicated failure outcome blocks retry", () => {
    const { root, request } = fixture();
    try {
      const first = beginReviewAttempt({
        repoRoot: root,
        request,
        provider: "claude",
        model: "claude-opus-5",
      });
      if (!first.ok) throw new Error(first.reason);
      const recorded = recordReviewAttemptFailure({
        repoRoot: root,
        request,
        attempt: 1,
        provider: "claude",
        model: "claude-opus-5",
        exitCode: 7,
        verdictPath: first.path,
        now: "2026-08-28T00:01:00.000Z",
      });
      expect(recorded.ok).toBe(true);
      const event = readReviewCustodyAudit(root).find(
        (entry) => entry.kind === "attempt_execution_failed",
      );
      if (!event) throw new Error("missing event");
      const auditPath = reviewCustodyAuditPath(root);
      writeFileSync(
        auditPath,
        `${readFileSync(auditPath, "utf8")}${JSON.stringify(event)}\n`,
        "utf8",
      );
      expect(
        beginReviewAttempt({
          repoRoot: root,
          request,
          provider: "claude",
          model: "claude-sonnet-5",
        }),
      ).toEqual({
        ok: false,
        reason: "attempt_outcome_indeterminate",
      });
    } finally {
      cleanup(root);
    }
  });

  it("CANDIDATE-U-RVATT-040: outcome conflict is typed and blocks a new attempt", () => {
    const { root, request } = fixture();
    try {
      const first = beginReviewAttempt({
        repoRoot: root,
        request,
        provider: "claude",
        model: "claude-opus-5",
      });
      if (!first.ok) throw new Error(first.reason);
      writeFileSync(first.path, verdictText(request, 1), "utf8");
      expect(
        projectReviewVerdict({
          repoRoot: root,
          request,
          attestation: attestation(request, 1, 7),
          verdictFile: first.path,
        }),
      ).toEqual({ ok: false, reason: "reviewer_exit_nonzero" });

      const conflict = projectReviewVerdict({
        repoRoot: root,
        request,
        attestation: attestation(request, 1, 9),
        verdictFile: first.path,
      });
      expect(conflict).toEqual({ ok: false, reason: "attempt_outcome_conflict" });
      expect(existsSync(join(root, ".ut-tdd", "review", "receipts"))).toBe(false);
      expect(
        beginReviewAttempt({
          repoRoot: root,
          request,
          provider: "claude",
          model: "claude-sonnet-5",
        }),
      ).toEqual({ ok: false, reason: "attempt_outcome_indeterminate" });
      expect(
        existsSync(
          join(
            root,
            ".ut-tdd",
            "review",
            "verdicts",
            reviewIdentityDigest(request),
            "attempts",
            "attempt-2",
          ),
        ),
      ).toBe(false);
    } finally {
      cleanup(root);
    }
  });

  it("CANDIDATE-U-RVATT-044: mutated attempt outcome identity blocks retry", () => {
    const { root, request } = fixture();
    try {
      const first = beginReviewAttempt({
        repoRoot: root,
        request,
        provider: "claude",
        model: "claude-opus-5",
      });
      if (!first.ok) throw new Error(first.reason);
      const recorded = recordReviewAttemptFailure({
        repoRoot: root,
        request,
        attempt: 1,
        provider: "claude",
        model: "claude-opus-5",
        exitCode: 7,
        verdictPath: first.path,
        now: "2026-08-28T00:01:00.000Z",
      });
      expect(recorded.ok).toBe(true);
      const auditPath = reviewCustodyAuditPath(root);
      const event = readReviewCustodyAudit(root).find(
        (entry) => entry.kind === "attempt_execution_failed",
      );
      if (!event) throw new Error("missing event");
      writeFileSync(
        auditPath,
        `${JSON.stringify({ ...event, exactHead: "b".repeat(40) })}\n`,
        "utf8",
      );
      expect(
        beginReviewAttempt({
          repoRoot: root,
          request,
          provider: "claude",
          model: "claude-sonnet-5",
        }),
      ).toEqual({ ok: false, reason: "attempt_outcome_indeterminate" });
    } finally {
      cleanup(root);
    }
  });

  it("CANDIDATE-U-RVATT-040 case B / negative 043/045: canonical receipt is create-exclusive", () => {
    const { root, request, digest } = fixture();
    try {
      const first = beginReviewAttempt({
        repoRoot: root,
        request,
        provider: "claude",
        model: "claude-opus-5",
      });
      if (!first.ok) throw new Error(first.reason);
      writeFileSync(first.path, verdictText(request, 1), "utf8");
      const initial = projectReviewVerdict({
        repoRoot: root,
        request,
        attestation: attestation(request, 1, 0),
        verdictFile: first.path,
      });
      if (!initial.ok) throw new Error(initial.reason);
      const receiptPath = join(root, ".ut-tdd", "review", "receipts", `${digest}.json`);
      const before = readFileSync(receiptPath);
      writeFileSync(receiptPath, `${JSON.stringify({ changed: true })}\n`, "utf8");
      const mutated = readFileSync(receiptPath);
      const conflict = projectReviewVerdict({
        repoRoot: root,
        request,
        attestation: attestation(request, 1, 0),
        verdictFile: first.path,
      });
      expect(conflict).toEqual({ ok: false, reason: "verdict_identity_conflict" });
      expect(readFileSync(receiptPath)).toEqual(mutated);
      expect(readFileSync(receiptPath)).not.toEqual(before);
      expect(
        beginReviewAttempt({ repoRoot: root, request, provider: "claude", model: "claude-opus-5" }),
      ).toEqual({
        ok: false,
        reason: "review_receipt_already_exists",
      });
    } finally {
      cleanup(root);
    }
  });
});
