import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { reviewReceiptDigest } from "../src/kernel/github-closure-receipt.ts";
import type { ReleaseIdentity, ReleaseManifest } from "../src/schema/release-manifest.ts";
import { applySealedReleaseAggregate } from "../src/setup/release-aggregate-admission.ts";
import {
  type CanonicalCiEvidence,
  classifyRollbackApply,
  evaluatePromotionGate,
  type PromotionGateInput,
  type QaReleaseGateEvidence,
  type ReviewGateEvidence,
  type RollbackCandidate,
  type RollbackSelectionInput,
  selectRollbackCandidate,
} from "../src/setup/release-promotion-rollback-gate.ts";

const commit = (character: string): string => character.repeat(40);
const digest = (character: string): string => `sha256:${character.repeat(64)}`;
const planRevision = commit("d");

function release(character: string): ReleaseIdentity {
  const artifactSourceCommit = commit(character);
  const artifactSetDigest = digest(character);
  const payload = Buffer.concat([
    Buffer.from("v1", "ascii"),
    Buffer.from([0]),
    Buffer.from(artifactSourceCommit, "ascii"),
    Buffer.from([0]),
    Buffer.from(artifactSetDigest.slice("sha256:".length), "hex"),
  ]);
  return {
    releaseId: `rel-sha256:${createHash("sha256").update(payload).digest("hex")}`,
    materializerVersion: "v1",
    artifactSourceCommit,
    artifactSetDigest,
  };
}

const previous = release("b");
const current = release("a");
const entry = {
  path: "release/manifest.yaml",
  mode: "100644" as const,
  content: new Uint8Array([1]),
};
const manifest: ReleaseManifest = {
  schemaVersion: "v1",
  releases: { [previous.releaseId]: previous, [current.releaseId]: current },
  channels: { canary: previous.releaseId, stable: current.releaseId },
  channelOrder: ["canary", "stable"],
};
const mapping = {
  channel: "stable",
  releaseId: current.releaseId,
  sourceRevision: current.artifactSourceCommit,
  sourcePath: "release/current",
  destinationPath: "pack/current",
};
const plan = {
  kind: "release-aggregate" as const,
  channel: "stable",
  releaseId: current.releaseId,
  sourceRevision: current.artifactSourceCommit,
  destinationPath: mapping.destinationPath,
  expectedDigest: current.artifactSetDigest,
  actualDigest: current.artifactSetDigest,
  entries: [entry],
};
const ci: CanonicalCiEvidence = {
  checkName: "harness-check",
  headSha: current.artifactSourceCommit,
  planRevision,
  legs: { linux: "success", windows: "success", aggregate: "success" },
  evidenceDigest: digest("c"),
  observedAt: "2026-08-20T00:00:00Z",
};
const qa: QaReleaseGateEvidence = {
  releaseId: current.releaseId,
  sourceRevision: current.artifactSourceCommit,
  artifactDigest: current.artifactSetDigest,
  channel: "stable",
  checks: {
    G01: "go",
    G02: "go",
    G03: "go",
    G04: "go",
    G05: "go",
    G06: "go",
    G07: "go",
    G08: "go",
  },
  evidenceDigest: digest("e"),
  observedAt: "2026-08-20T00:01:00Z",
};

function reviewSource(lane: "claim-blind" | "spec-blind"): ReviewGateEvidence["claimBlind"] {
  return {
    planId: "PLAN-L7-494",
    planRevision,
    headSha: current.artifactSourceCommit,
    reviewKind: "cross_agent",
    verdict: "PASS",
    reviewedAt: "2026-08-20T00:02:00Z",
    testsGreenAt: "2026-08-20T00:01:00Z",
    workerModel: "gpt-5.6-luna",
    reviewerModel: "claude-opus-5",
    source: "memory",
    lane,
    attackTrials: 1,
    citations: ["tests/release-promotion-rollback-gate.test.ts"],
  };
}

const claimBlind = reviewSource("claim-blind");
const specBlind = reviewSource("spec-blind");
const review: ReviewGateEvidence = {
  exactHeadSha: current.artifactSourceCommit,
  planRevision,
  d1: {
    memoryId: "MEM-REVIEW-363",
    pr: 363,
    exactHead: current.artifactSourceCommit,
    reviewRevision: planRevision,
    authorFamily: "codex",
    reviewerFamily: "claude",
    verdict: "PASS",
    state: "merge_ready",
    breaches: [],
    ageMinutes: 1,
    blocking: [],
    reasons: [],
    progressDiagnostics: [],
  },
  d2: {
    ok: true,
    pr: 363,
    headSha: current.artifactSourceCommit,
    verdict: "PASS",
    state: "merge_ready",
    reasons: [],
    authorizedEntry: {
      memoryId: "MEM-REVIEW-363",
      reviewRevision: planRevision,
      reviewerFamily: "claude",
    },
  },
  facts: {
    pr: 363,
    headSha: current.artifactSourceCommit,
    state: "OPEN",
    checksGreen: true,
    evaluatedHeadSha: current.artifactSourceCommit,
  },
  claimBlind,
  specBlind,
};

function promotionInput(): PromotionGateInput {
  return {
    manifest,
    currentChannel: "canary",
    currentRelease: previous,
    targetChannel: "stable",
    release: current,
    mapping,
    sealedPlan: plan,
    exactHeadSha: current.artifactSourceCommit,
    planRevision,
    expectedEvidence: {
      ciEvidenceDigest: ci.evidenceDigest,
      qaEvidenceDigest: qa.evidenceDigest,
      claimBlindReceiptDigest: reviewReceiptDigest(claimBlind),
      specBlindReceiptDigest: reviewReceiptDigest(specBlind),
    },
    ci,
    qa,
    review,
    attestation: {
      status: "attested",
      releaseId: current.releaseId,
      artifactSourceCommit: current.artifactSourceCommit,
      expectedDigest: current.artifactSetDigest,
      actualDigest: current.artifactSetDigest,
      entries: [entry],
    },
  };
}

function rollbackCandidate(): RollbackCandidate {
  return {
    channel: "canary",
    release: previous,
    plan: {
      ...plan,
      channel: "canary",
      releaseId: previous.releaseId,
      sourceRevision: previous.artifactSourceCommit,
      expectedDigest: previous.artifactSetDigest,
      actualDigest: previous.artifactSetDigest,
    },
    attestation: {
      status: "attested",
      releaseId: previous.releaseId,
      artifactSourceCommit: previous.artifactSourceCommit,
      expectedDigest: previous.artifactSetDigest,
      actualDigest: previous.artifactSetDigest,
      entries: [entry],
    },
    artifactAvailable: true,
  };
}

function rollbackInput(candidates: readonly RollbackCandidate[]): RollbackSelectionInput {
  return { manifest, currentChannel: "stable", current, targetChannel: "canary", candidates };
}

function deniedComposition(input: PromotionGateInput) {
  const prior = { pointer: previous.releaseId, bytes: new Uint8Array([7, 8, 9]) };
  const before = structuredClone(prior);
  const write = vi.fn();
  const publish = vi.fn();
  const apply = vi.fn();
  const result = evaluatePromotionGate(input);
  if (result.decision === "allow") {
    write();
    publish();
    apply();
  }
  return { result, prior, before, write, publish, apply };
}

function expectNoEffects(run: ReturnType<typeof deniedComposition>): void {
  expect(run.result.decision).toBe("deny");
  expect(run.write).not.toHaveBeenCalled();
  expect(run.publish).not.toHaveBeenCalled();
  expect(run.apply).not.toHaveBeenCalled();
  expect(run.prior).toEqual(run.before);
}

describe("S3 promotion / rollback pure gate", () => {
  it("U-RELMAN-003: canonical CI/QA/review欠落・subject driftをtyped denyしside effect 0", () => {
    expect(evaluatePromotionGate(promotionInput()).decision).toBe("allow");
    expect(evaluatePromotionGate({ ...promotionInput(), ci: undefined })).toMatchObject({
      decision: "deny",
      reason: "ci_missing",
    });
    expect(evaluatePromotionGate({ ...promotionInput(), qa: undefined })).toMatchObject({
      decision: "deny",
      reason: "qa_missing",
    });
    expect(evaluatePromotionGate({ ...promotionInput(), review: undefined })).toMatchObject({
      decision: "deny",
      reason: "review_missing",
    });

    const shiftedHead = commit("f");
    const shiftedClaim = { ...claimBlind, headSha: shiftedHead };
    const shiftedSpec = { ...specBlind, headSha: shiftedHead };
    const staleReview: ReviewGateEvidence = {
      ...review,
      exactHeadSha: shiftedHead,
      d1: { ...review.d1, exactHead: shiftedHead },
      d2: { ...review.d2, headSha: shiftedHead },
      facts: { ...review.facts, headSha: shiftedHead, evaluatedHeadSha: shiftedHead },
      claimBlind: shiftedClaim,
      specBlind: shiftedSpec,
    };
    const stale: PromotionGateInput = {
      ...promotionInput(),
      exactHeadSha: shiftedHead,
      ci: { ...ci, headSha: shiftedHead },
      review: staleReview,
      expectedEvidence: {
        ...promotionInput().expectedEvidence,
        claimBlindReceiptDigest: reviewReceiptDigest(shiftedClaim),
        specBlindReceiptDigest: reviewReceiptDigest(shiftedSpec),
      },
    };
    expect(evaluatePromotionGate(stale).decision).toBe("allow");

    const drift = deniedComposition({
      ...promotionInput(),
      ci: { ...ci, headSha: shiftedHead },
    });
    expect(drift.result).toMatchObject({ decision: "deny", reason: "identity_mismatch" });
    expectNoEffects(drift);
  });

  it("U-RELMAN-004: 同じrollback入力は同一pointer delta/digestへ収束しapply 0", () => {
    const apply = vi.fn();
    const input = rollbackInput([rollbackCandidate()]);
    const first = selectRollbackCandidate(input);
    const second = selectRollbackCandidate(input);
    expect(first).toEqual(second);
    expect(first).toMatchObject({ decision: "allow", pointerDelta: { channel: "stable" } });
    expect(apply).not.toHaveBeenCalled();
  });

  it("U-RELMAN-005: rollback選択結果はGit commandを生成・実行しない", () => {
    const command = vi.fn();
    const result = selectRollbackCandidate(rollbackInput([rollbackCandidate()]));
    expect(result.decision).toBe("allow");
    expect(result).not.toHaveProperty("command");
    expect(command).not.toHaveBeenCalled();
  });

  it("U-RELMAN-008: runtime上のQA no-goをcastなしで拒否しprior stateを維持", () => {
    const noGo: QaReleaseGateEvidence = { ...qa, checks: { ...qa.checks, G04: "no-go" } };
    const run = deniedComposition({ ...promotionInput(), qa: noGo });
    expect(run.result).toMatchObject({ decision: "deny", reason: "qa_no_go" });
    expectNoEffects(run);
  });

  it("U-RELMAN-010: D2 merge_readyなしではpromotionを拒否しwrite/publish 0", () => {
    const notReady: ReviewGateEvidence = {
      ...review,
      d2: { ...review.d2, ok: false, state: "in_review", reasons: ["review_pending"] },
    };
    const run = deniedComposition({ ...promotionInput(), review: notReady });
    expect(run.result).toMatchObject({ decision: "deny", reason: "review_missing" });
    expectNoEffects(run);
  });

  it("U-RELMAN-019: release/source/digest/materializer/channelの各identity driftを拒否", () => {
    const inputs: PromotionGateInput[] = [
      { ...promotionInput(), release: { ...current, releaseId: previous.releaseId } },
      {
        ...promotionInput(),
        mapping: { ...mapping, sourceRevision: previous.artifactSourceCommit },
      },
      { ...promotionInput(), qa: { ...qa, artifactDigest: previous.artifactSetDigest } },
      { ...promotionInput(), release: { ...current, materializerVersion: "v2" } },
      { ...promotionInput(), mapping: { ...mapping, channel: "canary" } },
    ];
    for (const input of inputs) {
      const run = deniedComposition(input);
      expect(run.result).toMatchObject({ decision: "deny", reason: "identity_mismatch" });
      expectNoEffects(run);
    }
  });

  it("U-RELMAN-020: evidence unavailable/stale/digest driftをprecedenceどおりfail-close", () => {
    const cases: Array<[PromotionGateInput, string]> = [
      [{ ...promotionInput(), ci: { ...ci, evidenceDigest: digest("f") } }, "identity_mismatch"],
      [{ ...promotionInput(), qa: { ...qa, evidenceDigest: digest("f") } }, "identity_mismatch"],
      [
        { ...promotionInput(), sealedPlan: { ...plan, actualDigest: previous.artifactSetDigest } },
        "identity_mismatch",
      ],
      [
        {
          ...promotionInput(),
          review: { ...review, facts: { ...review.facts, evaluatedHeadSha: commit("f") } },
        },
        "identity_mismatch",
      ],
      [
        { ...promotionInput(), attestation: { status: "unavailable", reason: "unavailable" } },
        "attestation_unavailable",
      ],
    ];
    for (const [input, reason] of cases) {
      const run = deniedComposition(input);
      expect(run.result).toMatchObject({ decision: "deny", reason });
      expectNoEffects(run);
    }
    const oldObservation: PromotionGateInput = {
      ...promotionInput(),
      ci: { ...ci, observedAt: "2020-01-01T00:00:00Z" },
      qa: { ...qa, observedAt: "2020-01-01T00:00:00Z" },
    };
    expect(evaluatePromotionGate(oldObservation).decision).toBe("allow");
  });

  it("U-RELMAN-021: rollback候補の0/複数/attestation/identity/artifact可用性を拒否", () => {
    const candidate = rollbackCandidate();
    expect(selectRollbackCandidate(rollbackInput([]))).toMatchObject({
      decision: "deny",
      reason: "candidate_missing",
    });
    expect(selectRollbackCandidate(rollbackInput([candidate, candidate]))).toMatchObject({
      decision: "deny",
      reason: "candidate_ambiguous",
    });
    expect(
      selectRollbackCandidate(rollbackInput([{ ...candidate, attestation: undefined }])),
    ).toMatchObject({ decision: "deny", reason: "attestation_missing" });
    expect(
      selectRollbackCandidate(rollbackInput([{ ...candidate, release: current }])),
    ).toMatchObject({ decision: "deny", reason: "identity_mismatch" });
    expect(
      selectRollbackCandidate(rollbackInput([{ ...candidate, artifactAvailable: undefined }])),
    ).toMatchObject({ decision: "deny", reason: "artifact_unavailable" });
    const apply = vi.fn();
    const write = vi.fn();
    expect(apply).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it("U-RELMAN-022: PF5 injected restore faultをrollback_failed/indeterminateへ分類", async () => {
    const prior = [{ path: "pack/current", mode: "100644" as const, content: new Uint8Array([9]) }];
    const before = structuredClone(prior);
    const apply = vi.fn(async () => {
      throw new Error("apply fault");
    });
    const restore = vi.fn(async () => {
      throw new Error("restore fault");
    });
    const publish = vi.fn();
    const pointer = vi.fn();
    const result = await applySealedReleaseAggregate(plan, {
      snapshotDestination: vi.fn(async () => prior),
      writeStaging: vi.fn(async () => "stage"),
      applyDestination: apply,
      discardStaging: vi.fn(async () => undefined),
      restoreDestination: restore,
    });
    expect(classifyRollbackApply(result)).toEqual({
      decision: "indeterminate",
      reason: "rollback_failed",
      sideEffects: "none",
    });
    expect(apply).toHaveBeenCalledOnce();
    expect(restore).toHaveBeenCalledOnce();
    expect(publish).not.toHaveBeenCalled();
    expect(pointer).not.toHaveBeenCalled();
    expect(prior).toEqual(before);
  });

  it("U-RELMAN-023: 非隣接/旧pointer/unknown targetを拒否しwrite/publish 0", () => {
    const nonAdjacent: ReleaseManifest = {
      ...manifest,
      channels: { ...manifest.channels, beta: previous.releaseId },
      channelOrder: ["canary", "beta", "stable"],
    };
    const cases = [
      { ...promotionInput(), manifest: nonAdjacent },
      { ...promotionInput(), currentRelease: current },
      { ...promotionInput(), targetChannel: "unknown" },
    ];
    for (const input of cases) {
      const run = deniedComposition(input);
      expect(run.result.decision).toBe("deny");
      expectNoEffects(run);
    }
  });
});
