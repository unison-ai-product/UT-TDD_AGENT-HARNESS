import { describe, expect, it, vi } from "vitest";
import {
  dispatchLiveReview,
  type LiveReviewProjectionPorts,
  type LiveReviewRequestInput,
  type LiveReviewVerdictPorts,
  oppositeReviewProvider,
  publishLiveReviewVerdict,
} from "../src/feedback/live-review-projection.ts";
import type {
  ReviewAttestation,
  ReviewAttestationRequest,
  ReviewRequestResult,
  ReviewVerdictProjectionResult,
} from "../src/feedback/review-attestation.ts";

const head = "a".repeat(40);
const canonicalRequest: ReviewAttestationRequest = {
  memoryId: "memory:d3a",
  pr: 218,
  exactHead: head,
  reviewRevision: "review-d3a-1",
  authorFamily: "codex",
  requestedAt: "2026-08-14T00:00:00.000Z",
};
const liveRequest: LiveReviewRequestInput = {
  ...canonicalRequest,
  memoryPath: ".ut-tdd/memory/feedback-d3a.md",
};
const issued: Extract<ReviewRequestResult, { ok: true }> = {
  ok: true,
  request: canonicalRequest,
  path: ".ut-tdd/review/requests/d3a.json",
  digest: "d3a-request",
};
const attestation: ReviewAttestation = {
  provider: "claude",
  role: "blind-reviewer",
  model: "claude-opus-5",
  pr: 218,
  head,
  reviewRevision: "review-d3a-1",
  startedAt: "2026-08-14T00:01:00.000Z",
  completedAt: "2026-08-14T00:02:00.000Z",
  exitCode: 0,
};
const projection: Extract<ReviewVerdictProjectionResult, { ok: true }> = {
  ok: true,
  path: ".ut-tdd/review/receipts/d3a.json",
  digest: "d3a-receipt",
  receipt: {
    memoryId: "memory:d3a",
    pr: 218,
    head,
    reviewRevision: "review-d3a-1",
    reviewerFamily: "claude",
    kind: "verdict",
    verdict: "PASS",
    blockingFindings: [],
    at: "2026-08-14T00:02:00.000Z",
  },
};

function requestPorts(
  overrides: Partial<LiveReviewProjectionPorts> = {},
): LiveReviewProjectionPorts {
  return {
    issueRequest: vi.fn(() => issued),
    publishReviewWake: vi.fn(),
    providerAvailable: vi.fn(() => true),
    ...overrides,
  };
}

function verdictPorts(overrides: Partial<LiveReviewVerdictPorts> = {}): LiveReviewVerdictPorts {
  return {
    projectVerdict: vi.fn(() => projection),
    publishPrComment: vi.fn(),
    publishFeedbackMemory: vi.fn(),
    ...overrides,
  };
}

describe("live review projection (U-RVATT-023..026)", () => {
  it("U-RVATT-023 persists the canonical request before publishing one typed wake", () => {
    const order: string[] = [];
    const ports = requestPorts({
      issueRequest: vi.fn(() => {
        order.push("request");
        return issued;
      }),
      publishReviewWake: vi.fn((wake) => {
        order.push("wake");
        expect(wake).toEqual({
          purpose: "review",
          requestDigest: issued.digest,
          requestPath: issued.path,
          request: canonicalRequest,
          memoryPath: liveRequest.memoryPath,
        });
      }),
    });

    expect(dispatchLiveReview({ repoRoot: "repo", request: liveRequest, ports })).toMatchObject({
      ok: true,
      reviewer: "claude",
    });
    expect(order).toEqual(["request", "wake"]);
  });

  it("U-RVATT-023 never wakes when canonical persistence fails", () => {
    const ports = requestPorts({
      issueRequest: vi.fn(() => ({ ok: false as const, reason: "invalid_review_request" })),
    });
    expect(dispatchLiveReview({ repoRoot: "repo", request: liveRequest, ports })).toEqual({
      ok: false,
      reason: "invalid_review_request",
    });
    expect(ports.publishReviewWake).not.toHaveBeenCalled();
  });

  it.each([
    ["codex", "claude"],
    ["claude", "codex"],
    ["other", null],
  ] as const)("U-RVATT-024 routes author %s to reviewer %s", (author, reviewer) => {
    expect(oppositeReviewProvider(author)).toBe(reviewer);
  });

  it("U-RVATT-024 denies unknown and unavailable opposite providers without writing", () => {
    const unavailable = requestPorts({ providerAvailable: vi.fn(() => false) });
    expect(
      dispatchLiveReview({ repoRoot: "repo", request: liveRequest, ports: unavailable }),
    ).toEqual({
      ok: false,
      reason: "opposite_provider_unavailable",
    });
    expect(unavailable.issueRequest).not.toHaveBeenCalled();

    const unknown = requestPorts();
    expect(
      dispatchLiveReview({
        repoRoot: "repo",
        request: { ...liveRequest, authorFamily: "unknown" as "codex" },
        ports: unknown,
      }),
    ).toEqual({ ok: false, reason: "unknown_author_family" });
    expect(unknown.issueRequest).not.toHaveBeenCalled();
  });

  it("U-RVATT-025 persists the receipt before derived publishers", () => {
    const order: string[] = [];
    const ports = verdictPorts({
      projectVerdict: vi.fn(() => {
        order.push("receipt");
        return projection;
      }),
      publishPrComment: vi.fn(() => {
        order.push("comment");
      }),
      publishFeedbackMemory: vi.fn(() => {
        order.push("memory");
      }),
    });
    expect(
      publishLiveReviewVerdict({
        repoRoot: "repo",
        request: canonicalRequest,
        attestation,
        verdictFile: "verdict.json",
        ports,
      }),
    ).toEqual({ ok: true, projection });
    expect(order).toEqual(["receipt", "comment", "memory"]);
  });

  it("U-RVATT-025 denies same-family facts and projection failure before derived output", () => {
    const sameFamily = verdictPorts();
    expect(
      publishLiveReviewVerdict({
        repoRoot: "repo",
        request: canonicalRequest,
        attestation: { ...attestation, provider: "codex" },
        verdictFile: "verdict.json",
        ports: sameFamily,
      }),
    ).toEqual({ ok: false, reason: "same_family_reviewer_denied" });
    expect(sameFamily.projectVerdict).not.toHaveBeenCalled();

    const failed = verdictPorts({
      projectVerdict: vi.fn(() => ({ ok: false as const, reason: "verdict_invalid" })),
    });
    expect(
      publishLiveReviewVerdict({
        repoRoot: "repo",
        request: canonicalRequest,
        attestation,
        verdictFile: "verdict.json",
        ports: failed,
      }),
    ).toEqual({ ok: false, reason: "verdict_invalid" });
    expect(failed.publishPrComment).not.toHaveBeenCalled();
    expect(failed.publishFeedbackMemory).not.toHaveBeenCalled();
  });

  it("U-RVATT-025 delegates retry convergence to canonical content identities", () => {
    const ports = requestPorts();
    dispatchLiveReview({ repoRoot: "repo", request: liveRequest, ports });
    dispatchLiveReview({ repoRoot: "repo", request: liveRequest, ports });
    expect(ports.issueRequest).toHaveBeenNthCalledWith(1, {
      repoRoot: "repo",
      request: canonicalRequest,
    });
    expect(ports.issueRequest).toHaveBeenNthCalledWith(2, {
      repoRoot: "repo",
      request: canonicalRequest,
    });
    expect(ports.publishReviewWake).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        requestDigest: issued.digest,
        requestPath: issued.path,
      }),
    );
    expect(ports.publishReviewWake).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        requestDigest: issued.digest,
        requestPath: issued.path,
      }),
    );

    const receiptPorts = verdictPorts();
    publishLiveReviewVerdict({
      repoRoot: "repo",
      request: canonicalRequest,
      attestation,
      verdictFile: "verdict.json",
      ports: receiptPorts,
    });
    publishLiveReviewVerdict({
      repoRoot: "repo",
      request: canonicalRequest,
      attestation,
      verdictFile: "verdict.json",
      ports: receiptPorts,
    });
    expect(receiptPorts.projectVerdict).toHaveBeenCalledTimes(2);
    expect(receiptPorts.publishPrComment).toHaveBeenNthCalledWith(1, projection);
    expect(receiptPorts.publishPrComment).toHaveBeenNthCalledWith(2, projection);
    expect(receiptPorts.publishFeedbackMemory).toHaveBeenNthCalledWith(1, projection);
    expect(receiptPorts.publishFeedbackMemory).toHaveBeenNthCalledWith(2, projection);
  });
});
