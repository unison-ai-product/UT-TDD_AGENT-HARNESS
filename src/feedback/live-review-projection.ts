import type {
  ReviewAttestation,
  ReviewAttestationRequest,
  ReviewRequestResult,
  ReviewVerdictProjectionResult,
} from "./review-attestation.ts";

export type ReviewProvider = "codex" | "claude";

export interface LiveReviewRequestInput extends ReviewAttestationRequest {
  readonly memoryPath: string;
}

export interface CanonicalReviewWake {
  readonly purpose: "review";
  readonly requestDigest: string;
  readonly requestPath: string;
  readonly request: ReviewAttestationRequest;
  readonly memoryPath: string;
}

export interface LiveReviewProjectionPorts {
  readonly issueRequest: (input: {
    repoRoot: string;
    request: ReviewAttestationRequest;
  }) => ReviewRequestResult;
  readonly publishReviewWake: (wake: CanonicalReviewWake) => void;
  readonly providerAvailable: (provider: ReviewProvider) => boolean;
}

export type LiveReviewDispatchResult =
  | {
      readonly ok: true;
      readonly reviewer: ReviewProvider;
      readonly request: Extract<ReviewRequestResult, { ok: true }>;
    }
  | { readonly ok: false; readonly reason: string };

export interface LiveReviewVerdictPorts {
  readonly projectVerdict: (input: {
    repoRoot: string;
    request: ReviewAttestationRequest;
    attestation: ReviewAttestation;
    verdictFile: string;
  }) => ReviewVerdictProjectionResult;
  readonly publishPrComment: (
    receipt: Extract<ReviewVerdictProjectionResult, { ok: true }>,
  ) => void;
  readonly publishFeedbackMemory: (
    receipt: Extract<ReviewVerdictProjectionResult, { ok: true }>,
  ) => void;
}

export type LiveReviewVerdictResult =
  | {
      readonly ok: true;
      readonly projection: Extract<ReviewVerdictProjectionResult, { ok: true }>;
    }
  | { readonly ok: false; readonly reason: string };

export function oppositeReviewProvider(authorFamily: unknown): ReviewProvider | null {
  if (authorFamily === "codex") return "claude";
  if (authorFamily === "claude") return "codex";
  return null;
}

/** Canonical request is persisted before its typed, derived wake is published. */
export function dispatchLiveReview(input: {
  readonly repoRoot: string;
  readonly request: LiveReviewRequestInput;
  readonly ports: LiveReviewProjectionPorts;
}): LiveReviewDispatchResult {
  const reviewer = oppositeReviewProvider(input.request.authorFamily);
  if (!reviewer) return { ok: false, reason: "unknown_author_family" };
  if (!input.ports.providerAvailable(reviewer)) {
    return { ok: false, reason: "opposite_provider_unavailable" };
  }

  const { memoryPath, ...request } = input.request;
  const issued = input.ports.issueRequest({ repoRoot: input.repoRoot, request });
  if (!issued.ok) return issued;

  try {
    input.ports.publishReviewWake({
      purpose: "review",
      requestDigest: issued.digest,
      requestPath: issued.path,
      request: issued.request,
      memoryPath,
    });
  } catch {
    return { ok: false, reason: "review_wake_publish_failed" };
  }
  return { ok: true, reviewer, request: issued };
}

/** Canonical receipt is persisted before any human-facing projection is published. */
export function publishLiveReviewVerdict(input: {
  readonly repoRoot: string;
  readonly request: ReviewAttestationRequest;
  readonly attestation: ReviewAttestation;
  readonly verdictFile: string;
  readonly ports: LiveReviewVerdictPorts;
}): LiveReviewVerdictResult {
  const expectedReviewer = oppositeReviewProvider(input.request.authorFamily);
  if (!expectedReviewer) return { ok: false, reason: "unknown_author_family" };
  if (input.attestation.provider !== expectedReviewer) {
    return { ok: false, reason: "same_family_reviewer_denied" };
  }

  const projected = input.ports.projectVerdict({
    repoRoot: input.repoRoot,
    request: input.request,
    attestation: input.attestation,
    verdictFile: input.verdictFile,
  });
  if (!projected.ok) return projected;

  try {
    input.ports.publishPrComment(projected);
    input.ports.publishFeedbackMemory(projected);
  } catch {
    return { ok: false, reason: "derived_verdict_publish_failed" };
  }
  return { ok: true, projection: projected };
}
