import { createHash } from "node:crypto";
import type { ReviewDispatchEntry, ReviewerFamily } from "../feedback/review-dispatch.ts";
import type { MergeGateDecision, MergeGateFacts } from "../feedback/review-merge-gate.ts";
import {
  REQUIRED_GITHUB_CHECK,
  type ReviewReceiptSource,
  reviewReceiptDigest,
  validCrossReviewSource,
} from "../kernel/github-closure-receipt.ts";
import { modelProviderFromId } from "../schema/index.ts";
import {
  type ReleaseIdentity,
  type ReleaseManifest,
  resolveReleaseChannel,
} from "../schema/release-manifest.ts";
import type {
  ReleaseAggregateApplyResult,
  ReleaseChannelMapping,
  SealedReleaseAggregatePlan,
} from "./release-aggregate-admission.ts";
import type { ReleaseChannelAttestation } from "./release-channel-adapter.ts";

export type CiLeg = "linux" | "windows" | "aggregate";
export type GateLegStatus = "success";
export type QaCheck = "G01" | "G02" | "G03" | "G04" | "G05" | "G06" | "G07" | "G08";
export type QaGateStatus = "go" | "no-go";

export interface CanonicalCiEvidence {
  readonly checkName: typeof REQUIRED_GITHUB_CHECK;
  readonly headSha: string;
  readonly planRevision: string;
  readonly legs: Readonly<Record<CiLeg, GateLegStatus>>;
  readonly evidenceDigest: string;
  readonly observedAt: string;
}

export interface QaReleaseGateEvidence {
  readonly releaseId: string;
  readonly sourceRevision: string;
  readonly artifactDigest: string;
  readonly channel: string;
  readonly checks: Readonly<Record<QaCheck, QaGateStatus>>;
  readonly evidenceDigest: string;
  readonly observedAt: string;
}

/** D1/D2の派生コピーではなく、既存review sourceをそのまま束縛する。 */
export interface ReviewGateEvidence {
  readonly exactHeadSha: string;
  readonly planRevision: string;
  readonly d1: ReviewDispatchEntry;
  readonly d2: MergeGateDecision;
  readonly facts: MergeGateFacts;
  readonly claimBlind: ReviewReceiptSource;
  readonly specBlind: ReviewReceiptSource;
}

export interface ReviewEvidenceBinding {
  readonly pr: number;
  readonly memoryId: string;
  readonly planId: string;
  readonly authorFamily: ReviewerFamily;
  readonly reviewerFamily: ReviewerFamily;
  readonly claimBlindReceiptDigest: string;
  readonly specBlindReceiptDigest: string;
}

export interface PromotionEvidenceBinding extends ReviewEvidenceBinding {
  readonly ciEvidenceDigest: string;
  readonly qaEvidenceDigest: string;
}

export type PromotionGateReason =
  | "invalid_input"
  | "identity_mismatch"
  | "ci_missing"
  | "qa_missing"
  | "qa_no_go"
  | "review_missing"
  | "channel_transition_invalid"
  | "attestation_unavailable";

export type RollbackGateReason =
  | "invalid_input"
  | "candidate_missing"
  | "candidate_ambiguous"
  | "identity_mismatch"
  | "attestation_missing"
  | "artifact_unavailable"
  | "rollback_failed";

export interface PromotionGateInput {
  readonly manifest: ReleaseManifest;
  readonly currentChannel: string;
  readonly currentRelease: ReleaseIdentity;
  readonly targetChannel: string;
  readonly release: ReleaseIdentity;
  readonly mapping: ReleaseChannelMapping;
  readonly sealedPlan: SealedReleaseAggregatePlan;
  readonly exactHeadSha: string;
  readonly planRevision: string;
  readonly expectedEvidence: PromotionEvidenceBinding;
  readonly ci?: CanonicalCiEvidence;
  readonly qa?: QaReleaseGateEvidence;
  readonly review?: ReviewGateEvidence;
  readonly attestation?: ReleaseChannelAttestation;
}

export type PromotionGateResult =
  | {
      readonly decision: "allow";
      readonly releaseId: string;
      readonly targetChannel: string;
      readonly sourceRevision: string;
      readonly artifactDigest: string;
      readonly evidenceDigest: string;
      readonly sideEffects: "none";
    }
  | {
      readonly decision: "deny";
      readonly reason: PromotionGateReason;
      readonly sideEffects: "none";
    };

export interface RollbackCandidate {
  readonly channel: string;
  readonly release: ReleaseIdentity;
  readonly attestation?: ReleaseChannelAttestation;
  readonly plan: SealedReleaseAggregatePlan;
  /** 欠落も利用不能としてfail-closeする。 */
  readonly artifactAvailable?: boolean;
}

export interface RollbackSelectionInput {
  readonly manifest: ReleaseManifest;
  readonly currentChannel: string;
  readonly current: ReleaseIdentity;
  readonly targetChannel: string;
  readonly exactHeadSha: string;
  readonly planRevision: string;
  readonly expectedReview: ReviewEvidenceBinding;
  readonly review?: ReviewGateEvidence;
  readonly candidates: readonly RollbackCandidate[];
}

export interface RollbackPointerDelta {
  readonly channel: string;
  readonly fromReleaseId: string;
  readonly toReleaseId: string;
}

export type RollbackSelectionResult =
  | {
      readonly decision: "allow";
      readonly candidate: RollbackCandidate;
      readonly pointerDelta: RollbackPointerDelta;
      readonly decisionDigest: string;
      readonly sideEffects: "none";
    }
  | {
      readonly decision: "deny";
      readonly reason: RollbackGateReason;
      readonly sideEffects: "none";
    };

export type RollbackApplyResult =
  | { readonly decision: "allow"; readonly sideEffects: "none" }
  | { readonly decision: "deny"; readonly reason: RollbackGateReason; readonly sideEffects: "none" }
  | {
      readonly decision: "indeterminate";
      readonly reason: "rollback_failed";
      readonly sideEffects: "none";
    };

const COMMIT = /^[a-f0-9]{40}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const RECEIPT_DIGEST = /^[a-f0-9]{64}$/;
const QA_CHECKS: readonly QaCheck[] = ["G01", "G02", "G03", "G04", "G05", "G06", "G07", "G08"];
const CI_LEGS: readonly CiLeg[] = ["linux", "windows", "aggregate"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isTimestamp(value: unknown): value is string {
  return isString(value) && Number.isFinite(Date.parse(value));
}

function sameIdentity(left: ReleaseIdentity, right: ReleaseIdentity): boolean {
  return (
    left.releaseId === right.releaseId &&
    left.materializerVersion === right.materializerVersion &&
    left.artifactSourceCommit === right.artifactSourceCommit &&
    left.artifactSetDigest === right.artifactSetDigest
  );
}

function validIdentity(value: unknown): value is ReleaseIdentity {
  return (
    isRecord(value) &&
    typeof value.releaseId === "string" &&
    /^rel-sha256:[a-f0-9]{64}$/.test(value.releaseId) &&
    isString(value.materializerVersion) &&
    typeof value.artifactSourceCommit === "string" &&
    COMMIT.test(value.artifactSourceCommit) &&
    typeof value.artifactSetDigest === "string" &&
    DIGEST.test(value.artifactSetDigest)
  );
}

function validManifest(value: unknown): value is ReleaseManifest {
  return (
    isRecord(value) &&
    value.schemaVersion === "v1" &&
    isRecord(value.releases) &&
    isRecord(value.channels) &&
    Array.isArray(value.channelOrder) &&
    value.channelOrder.every(isString)
  );
}

function attested(
  value: unknown,
): value is Extract<ReleaseChannelAttestation, { status: "attested" }> {
  return (
    isRecord(value) &&
    value.status === "attested" &&
    isString(value.releaseId) &&
    typeof value.artifactSourceCommit === "string" &&
    COMMIT.test(value.artifactSourceCommit) &&
    typeof value.expectedDigest === "string" &&
    DIGEST.test(value.expectedDigest) &&
    typeof value.actualDigest === "string" &&
    DIGEST.test(value.actualDigest) &&
    Array.isArray(value.entries)
  );
}

function validReviewBinding(value: unknown): value is ReviewEvidenceBinding {
  return (
    isRecord(value) &&
    Number.isSafeInteger(value.pr) &&
    Number(value.pr) > 0 &&
    isString(value.memoryId) &&
    isString(value.planId) &&
    (value.authorFamily === "claude" || value.authorFamily === "codex") &&
    (value.reviewerFamily === "claude" || value.reviewerFamily === "codex") &&
    value.authorFamily !== value.reviewerFamily &&
    typeof value.claimBlindReceiptDigest === "string" &&
    RECEIPT_DIGEST.test(value.claimBlindReceiptDigest) &&
    typeof value.specBlindReceiptDigest === "string" &&
    RECEIPT_DIGEST.test(value.specBlindReceiptDigest)
  );
}

function validBinding(value: unknown): value is PromotionEvidenceBinding {
  if (!validReviewBinding(value)) return false;
  const record = value as unknown as Record<string, unknown>;
  return (
    typeof record.ciEvidenceDigest === "string" &&
    DIGEST.test(record.ciEvidenceDigest) &&
    typeof record.qaEvidenceDigest === "string" &&
    DIGEST.test(record.qaEvidenceDigest)
  );
}

function validCiShape(value: unknown): value is CanonicalCiEvidence {
  if (
    !isRecord(value) ||
    value.checkName !== REQUIRED_GITHUB_CHECK ||
    typeof value.headSha !== "string" ||
    !COMMIT.test(value.headSha) ||
    !isString(value.planRevision) ||
    typeof value.evidenceDigest !== "string" ||
    !DIGEST.test(value.evidenceDigest) ||
    !isTimestamp(value.observedAt) ||
    !isRecord(value.legs)
  )
    return false;
  const legs = value.legs;
  return CI_LEGS.every((leg) => legs[leg] === "success") && Object.keys(legs).length === 3;
}

function validQaShape(value: unknown): value is QaReleaseGateEvidence {
  if (
    !isRecord(value) ||
    !isString(value.releaseId) ||
    typeof value.sourceRevision !== "string" ||
    !COMMIT.test(value.sourceRevision) ||
    typeof value.artifactDigest !== "string" ||
    !DIGEST.test(value.artifactDigest) ||
    !isString(value.channel) ||
    typeof value.evidenceDigest !== "string" ||
    !DIGEST.test(value.evidenceDigest) ||
    !isTimestamp(value.observedAt) ||
    !isRecord(value.checks)
  )
    return false;
  const checks = value.checks;
  return (
    Object.keys(checks).length === QA_CHECKS.length &&
    QA_CHECKS.every((check) => checks[check] === "go" || checks[check] === "no-go")
  );
}

function reviewPartsPresent(value: unknown): value is ReviewGateEvidence {
  return (
    isRecord(value) &&
    isRecord(value.d1) &&
    isRecord(value.d2) &&
    isRecord(value.facts) &&
    isRecord(value.claimBlind) &&
    isRecord(value.specBlind)
  );
}

interface ReviewSubject {
  readonly exactHeadSha: string;
  readonly planRevision: string;
  readonly expectedReview: ReviewEvidenceBinding;
}

function reviewIdentityMatches(review: ReviewGateEvidence, subject: ReviewSubject): boolean {
  const { d1, d2, facts, claimBlind, specBlind } = review;
  const expected = subject.expectedReview;
  const authorized = d2.authorizedEntry;
  return (
    review.exactHeadSha === subject.exactHeadSha &&
    review.planRevision === subject.planRevision &&
    d1.exactHead === subject.exactHeadSha &&
    d1.reviewRevision === subject.planRevision &&
    d1.pr === expected.pr &&
    d2.pr === expected.pr &&
    facts.pr === expected.pr &&
    d1.memoryId === expected.memoryId &&
    d1.authorFamily === expected.authorFamily &&
    d1.reviewerFamily === expected.reviewerFamily &&
    authorized !== null &&
    authorized.memoryId === expected.memoryId &&
    authorized.reviewRevision === subject.planRevision &&
    authorized.reviewerFamily === expected.reviewerFamily &&
    d2.headSha === subject.exactHeadSha &&
    facts.headSha === subject.exactHeadSha &&
    facts.evaluatedHeadSha === subject.exactHeadSha &&
    claimBlind.lane === "claim-blind" &&
    specBlind.lane === "spec-blind" &&
    claimBlind.planId === expected.planId &&
    specBlind.planId === expected.planId &&
    claimBlind.headSha === subject.exactHeadSha &&
    specBlind.headSha === subject.exactHeadSha &&
    claimBlind.planRevision === subject.planRevision &&
    specBlind.planRevision === subject.planRevision &&
    modelProviderFromId(claimBlind.workerModel) === expected.authorFamily &&
    modelProviderFromId(specBlind.workerModel) === expected.authorFamily &&
    modelProviderFromId(claimBlind.reviewerModel) === expected.reviewerFamily &&
    modelProviderFromId(specBlind.reviewerModel) === expected.reviewerFamily &&
    claimBlind.verdict === d1.verdict &&
    specBlind.verdict === d1.verdict &&
    d2.verdict === d1.verdict &&
    reviewReceiptDigest(claimBlind) === expected.claimBlindReceiptDigest &&
    reviewReceiptDigest(specBlind) === expected.specBlindReceiptDigest
  );
}

function attestationIdentityMatches(value: unknown, release: ReleaseIdentity): boolean {
  if (!isRecord(value)) return true;
  return (
    (value.releaseId === undefined || value.releaseId === release.releaseId) &&
    (value.artifactSourceCommit === undefined ||
      value.artifactSourceCommit === release.artifactSourceCommit) &&
    (value.expectedDigest === undefined || value.expectedDigest === release.artifactSetDigest) &&
    (value.actualDigest === undefined || value.actualDigest === release.artifactSetDigest)
  );
}

function reviewIsReady(review: ReviewGateEvidence): boolean {
  return (
    review.d1.state === "merge_ready" &&
    (review.d1.verdict === "PASS" || review.d1.verdict === "PASS-WEAK") &&
    review.d1.blocking.length === 0 &&
    review.d2.ok === true &&
    review.d2.state === "merge_ready" &&
    review.d2.reasons.length === 0 &&
    (review.d2.verdict === "PASS" || review.d2.verdict === "PASS-WEAK") &&
    review.facts.checksGreen === true &&
    validCrossReviewSource(review.claimBlind) &&
    validCrossReviewSource(review.specBlind)
  );
}

function promotionDeny(reason: PromotionGateReason): PromotionGateResult {
  return { decision: "deny", reason, sideEffects: "none" };
}

function rollbackDeny(reason: RollbackGateReason): RollbackSelectionResult {
  return { decision: "deny", reason, sideEffects: "none" };
}

function promotionShapeIsValid(input: unknown): input is PromotionGateInput {
  return (
    isRecord(input) &&
    validManifest(input.manifest) &&
    validIdentity(input.currentRelease) &&
    validIdentity(input.release) &&
    isString(input.currentChannel) &&
    isString(input.targetChannel) &&
    typeof input.exactHeadSha === "string" &&
    COMMIT.test(input.exactHeadSha) &&
    isString(input.planRevision) &&
    validBinding(input.expectedEvidence) &&
    isRecord(input.mapping) &&
    isRecord(input.sealedPlan)
  );
}

function aggregateIdentityMatches(input: PromotionGateInput): boolean {
  const selected = resolveReleaseChannel(input.manifest, input.targetChannel);
  const current = resolveReleaseChannel(input.manifest, input.currentChannel);
  return (
    selected.ok &&
    current.ok &&
    sameIdentity(selected.release, input.release) &&
    sameIdentity(current.release, input.currentRelease) &&
    input.mapping.channel === input.targetChannel &&
    input.mapping.releaseId === input.release.releaseId &&
    input.mapping.sourceRevision === input.release.artifactSourceCommit &&
    input.sealedPlan.channel === input.targetChannel &&
    input.sealedPlan.releaseId === input.release.releaseId &&
    input.sealedPlan.sourceRevision === input.release.artifactSourceCommit &&
    input.sealedPlan.expectedDigest === input.release.artifactSetDigest &&
    input.sealedPlan.actualDigest === input.release.artifactSetDigest &&
    input.mapping.destinationPath === input.sealedPlan.destinationPath
  );
}

function evidenceIdentityMatches(input: PromotionGateInput): boolean {
  if (
    input.ci !== undefined &&
    (input.ci.headSha !== input.exactHeadSha ||
      input.ci.planRevision !== input.planRevision ||
      input.ci.evidenceDigest !== input.expectedEvidence.ciEvidenceDigest)
  )
    return false;
  if (
    input.qa !== undefined &&
    (input.qa.releaseId !== input.release.releaseId ||
      input.qa.sourceRevision !== input.release.artifactSourceCommit ||
      input.qa.artifactDigest !== input.release.artifactSetDigest ||
      input.qa.channel !== input.targetChannel ||
      input.qa.evidenceDigest !== input.expectedEvidence.qaEvidenceDigest)
  )
    return false;
  if (
    input.review !== undefined &&
    reviewPartsPresent(input.review) &&
    !reviewIdentityMatches(input.review, {
      exactHeadSha: input.exactHeadSha,
      planRevision: input.planRevision,
      expectedReview: input.expectedEvidence,
    })
  )
    return false;
  if (!attestationIdentityMatches(input.attestation, input.release)) return false;
  return true;
}

/** L6-102で固定したreason precedenceどおりにpure判定する。 */
export function evaluatePromotionGate(input: unknown): PromotionGateResult {
  if (!promotionShapeIsValid(input)) return promotionDeny("invalid_input");
  if (input.ci !== undefined && !validCiShape(input.ci)) return promotionDeny("invalid_input");
  if (input.qa !== undefined && !validQaShape(input.qa)) return promotionDeny("invalid_input");
  if (!aggregateIdentityMatches(input) || !evidenceIdentityMatches(input))
    return promotionDeny("identity_mismatch");
  if (input.ci === undefined) return promotionDeny("ci_missing");
  if (input.qa === undefined) return promotionDeny("qa_missing");
  if (QA_CHECKS.some((check) => input.qa?.checks[check] !== "go")) return promotionDeny("qa_no_go");
  if (
    input.review === undefined ||
    !reviewPartsPresent(input.review) ||
    !reviewIsReady(input.review)
  ) {
    return promotionDeny("review_missing");
  }
  const from = input.manifest.channelOrder.indexOf(input.currentChannel);
  const to = input.manifest.channelOrder.indexOf(input.targetChannel);
  if (from < 0 || to !== from + 1) return promotionDeny("channel_transition_invalid");
  if (!attested(input.attestation)) return promotionDeny("attestation_unavailable");
  return {
    decision: "allow",
    releaseId: input.release.releaseId,
    targetChannel: input.targetChannel,
    sourceRevision: input.release.artifactSourceCommit,
    artifactDigest: input.release.artifactSetDigest,
    evidenceDigest: createHash("sha256")
      .update(JSON.stringify(input.expectedEvidence))
      .digest("hex"),
    sideEffects: "none",
  };
}

function validRollbackShape(input: unknown): input is RollbackSelectionInput {
  return (
    isRecord(input) &&
    validManifest(input.manifest) &&
    validIdentity(input.current) &&
    isString(input.currentChannel) &&
    isString(input.targetChannel) &&
    typeof input.exactHeadSha === "string" &&
    COMMIT.test(input.exactHeadSha) &&
    isString(input.planRevision) &&
    validReviewBinding(input.expectedReview) &&
    Array.isArray(input.candidates)
  );
}

function validRollbackCandidateShape(value: unknown): value is RollbackCandidate {
  return (
    isRecord(value) &&
    validIdentity(value.release) &&
    isRecord(value.plan) &&
    isString(value.channel) &&
    (value.attestation === undefined || isRecord(value.attestation)) &&
    (value.artifactAvailable === undefined || typeof value.artifactAvailable === "boolean")
  );
}

function rollbackIdentityMatches(
  input: RollbackSelectionInput,
  candidate: RollbackCandidate,
): boolean {
  if (
    !validIdentity(candidate.release) ||
    !isRecord(candidate.plan) ||
    !isString(candidate.channel)
  )
    return false;
  const current = resolveReleaseChannel(input.manifest, input.currentChannel);
  const target = resolveReleaseChannel(input.manifest, input.targetChannel);
  const from = input.manifest.channelOrder.indexOf(input.currentChannel);
  const to = input.manifest.channelOrder.indexOf(input.targetChannel);
  return (
    current.ok &&
    target.ok &&
    sameIdentity(current.release, input.current) &&
    to === from - 1 &&
    candidate.channel === input.targetChannel &&
    sameIdentity(candidate.release, target.release) &&
    candidate.plan.channel === candidate.channel &&
    candidate.plan.releaseId === candidate.release.releaseId &&
    candidate.plan.sourceRevision === candidate.release.artifactSourceCommit &&
    candidate.plan.expectedDigest === candidate.release.artifactSetDigest &&
    candidate.plan.actualDigest === candidate.release.artifactSetDigest
  );
}

export function selectRollbackCandidate(input: unknown): RollbackSelectionResult {
  if (!validRollbackShape(input)) return rollbackDeny("invalid_input");
  if (input.review === undefined || !reviewPartsPresent(input.review))
    return rollbackDeny("invalid_input");
  if (
    !reviewIdentityMatches(input.review, {
      exactHeadSha: input.exactHeadSha,
      planRevision: input.planRevision,
      expectedReview: input.expectedReview,
    })
  )
    return rollbackDeny("identity_mismatch");
  if (!reviewIsReady(input.review)) return rollbackDeny("invalid_input");
  if (input.candidates.length === 0) return rollbackDeny("candidate_missing");
  if (input.candidates.length > 1) return rollbackDeny("candidate_ambiguous");
  const candidate = input.candidates[0];
  if (!validRollbackCandidateShape(candidate)) return rollbackDeny("invalid_input");
  if (!rollbackIdentityMatches(input, candidate)) return rollbackDeny("identity_mismatch");
  if (!attestationIdentityMatches(candidate.attestation, candidate.release))
    return rollbackDeny("identity_mismatch");
  if (!attested(candidate.attestation)) return rollbackDeny("attestation_missing");
  if (candidate.artifactAvailable !== true) return rollbackDeny("artifact_unavailable");
  const pointerDelta: RollbackPointerDelta = {
    channel: input.currentChannel,
    fromReleaseId: input.current.releaseId,
    toReleaseId: candidate.release.releaseId,
  };
  return {
    decision: "allow",
    candidate,
    pointerDelta,
    decisionDigest: createHash("sha256").update(JSON.stringify(pointerDelta)).digest("hex"),
    sideEffects: "none",
  };
}

export function classifyRollbackApply(result: ReleaseAggregateApplyResult): RollbackApplyResult {
  if (!isRecord(result)) return { decision: "deny", reason: "invalid_input", sideEffects: "none" };
  if (result.ok === true && result.applied === 1) return { decision: "allow", sideEffects: "none" };
  if (result.ok === false && result.error === "unavailable" && result.applied === 0) {
    return { decision: "deny", reason: "artifact_unavailable", sideEffects: "none" };
  }
  if (
    result.ok === false &&
    result.error === "rollback_failed" &&
    result.applied === "indeterminate"
  ) {
    return { decision: "indeterminate", reason: "rollback_failed", sideEffects: "none" };
  }
  return { decision: "deny", reason: "invalid_input", sideEffects: "none" };
}
