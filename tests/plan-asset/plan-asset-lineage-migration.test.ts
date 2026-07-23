import { describe, expect, it } from "vitest";
import {
  type GenesisRebaseMigrationProposal,
  validateGenesisRebaseMigration,
} from "../../src/plan-asset/application/genesis-rebase-migrate.js";
import {
  deriveMigrationCertificate,
  deriveRebaseAssetId,
  type PlanAssetMigrationCertificateInput,
} from "../../src/plan-asset/domain/plan-asset-migration-certificate.js";

describe("plan asset historical seal + rebase genesis", () => {
  it("U-PA-REBASE-001: exact historical chain and new custody evidence validate", () => {
    const proposal = fixture();
    const result = validateGenesisRebaseMigration(proposal);
    expect(result).toMatchObject({
      ok: true,
      value: {
        historicalAssetId: proposal.historical.assetId,
        successorAssetId: proposal.successor.assetId,
        successorRevision: 1,
      },
    });
  });

  it.each([
    [
      "#102 mutation",
      (value: GenesisRebaseMigrationProposal): void => {
        value.issue102.mutationForbidden = false;
      },
      "issue102-not-sealed",
    ],
    [
      "custody missing",
      (value: GenesisRebaseMigrationProposal): void => {
        value.custodyIssue = null;
      },
      "custody-issue-missing",
    ],
    [
      "custody nonterminal",
      (value: GenesisRebaseMigrationProposal): void => {
        requireCustody(value).terminal = false;
      },
      "custody-issue-nonterminal",
    ],
    [
      "revision gap",
      (value: GenesisRebaseMigrationProposal): void => {
        requireRevision(value, 2).revision = 9;
      },
      "historical-revision-chain-invalid",
    ],
    [
      "receipt fork",
      (value: GenesisRebaseMigrationProposal): void => {
        requireRevision(value, 2).previousRecordDigest = digest("fork");
      },
      "historical-receipt-chain-invalid",
    ],
    [
      "tail drift",
      (value: GenesisRebaseMigrationProposal): void => {
        value.projection.currentTailDigest = digest("drift");
      },
      "projection-tail-drift",
    ],
    [
      "same asset",
      (value: GenesisRebaseMigrationProposal): void => {
        value.successor.assetId = value.historical.assetId;
      },
      "successor-identity-invalid",
    ],
    [
      "inference",
      (value: GenesisRebaseMigrationProposal): void => {
        value.historical.inferredRowsForbidden = false;
      },
      "historical-inference-forbidden",
    ],
    [
      "review absent",
      (value: GenesisRebaseMigrationProposal): void => {
        value.confirmationReview = null;
      },
      "confirmation-review-missing",
    ],
    [
      "same model",
      (value: GenesisRebaseMigrationProposal): void => {
        const review = requireReview(value);
        review.reviewerModel = review.workerModel;
      },
      "confirmation-review-invalid",
    ],
    [
      "certificate tamper",
      (value: GenesisRebaseMigrationProposal): void => {
        value.certificate = { ...value.certificate, certificateDigest: digest("tampered") };
      },
      "migration-certificate-invalid",
    ],
  ] as const)("U-PA-REBASE-002: %s fails closed", (_name, mutate, ruleId) => {
    const proposal = fixture();
    mutate(proposal);
    expect(validateGenesisRebaseMigration(proposal)).toEqual({ ok: false, ruleId });
  });

  it("U-PA-REBASE-003: identity and certificate derivation are canonical and deterministic", () => {
    const proposal = fixture();
    const input = certificateInput(proposal);
    expect(deriveRebaseAssetId(input.identity)).toBe(proposal.successor.assetId);
    expect(deriveMigrationCertificate(input)).toEqual(proposal.certificate);
    expect(deriveMigrationCertificate(input)).toEqual(deriveMigrationCertificate(input));
  });

  it("U-PA-REBASE-004: trusted source blob commitとreview済implementation exactHeadを別authorityとして検証する", () => {
    const proposal = fixture();
    const reviewedImplementationHead = "d".repeat(40);
    Object.assign(proposal.successor, { status: "draft" });
    Object.assign(proposal, { reviewedImplementationCommit: reviewedImplementationHead });
    const review = requireReview(proposal);
    review.exactHead = reviewedImplementationHead;
    proposal.certificate = deriveMigrationCertificate(certificateInput(proposal));

    expect(validateGenesisRebaseMigration(proposal)).toMatchObject({ ok: true });
    expect(proposal.sourceCommit).not.toBe(review.exactHead);
  });

  it("U-PA-REBASE-005: migration rev1でconfirmedを自己申告するproposalを拒否する", () => {
    const proposal = fixture();
    Object.assign(proposal.successor, { status: "confirmed" });
    Object.assign(proposal, { reviewedImplementationCommit: proposal.sourceCommit });

    expect(validateGenesisRebaseMigration(proposal)).toEqual({
      ok: false,
      ruleId: "successor-migration-status-invalid",
    });
  });

  it("U-PA-REBASE-006: review exactHeadはsourceCommitでなくreviewedImplementationCommitへ束縛する", () => {
    const proposal = fixture();
    Object.assign(proposal.successor, { status: "draft" });
    Object.assign(proposal, { reviewedImplementationCommit: "d".repeat(40) });

    expect(validateGenesisRebaseMigration(proposal)).toEqual({
      ok: false,
      ruleId: "confirmation-review-invalid",
    });
  });
});

function fixture(): GenesisRebaseMigrationProposal {
  const identity = {
    algorithm: "ut-tdd-plan-rebase-v1" as const,
    repositoryIdentity: "owner/repository",
    planId: "PLAN-RECOVERY-16-plan-revision-authoring",
    historicalAssetId: "plan:historical",
    historicalTerminalRevision: 5,
    historicalTerminalRecordDigest: digest("record-5"),
    sourceCommit: "a".repeat(40),
    sourceBlobOid: "b".repeat(40),
  };
  const successorAssetId = deriveRebaseAssetId(identity);
  const proposal: GenesisRebaseMigrationProposal = {
    commandId: "genesis-rebase:recovery-16",
    repositoryIdentity: identity.repositoryIdentity,
    sourceCommit: identity.sourceCommit,
    reviewedImplementationCommit: identity.sourceCommit,
    issue102: {
      number: 102,
      state: "OPEN",
      bodyDigest: digest("issue-102"),
      mutationForbidden: true,
    },
    custodyIssue: {
      number: 143,
      state: "OPEN",
      bodyDigest: digest("custody"),
      projectionDigest: digest("custody-terminal"),
      terminal: true,
      driveModel: "recovery",
    },
    historical: {
      assetId: identity.historicalAssetId,
      disposition: "historical_sealed_unrehydratable",
      appendForbidden: true,
      inferredRowsForbidden: true,
      revisions: revisions(),
    },
    successor: {
      assetId: successorAssetId,
      revision: 1,
      planId: identity.planId,
      sourceBlobOid: identity.sourceBlobOid,
      status: "draft",
      canonicalPayloadDigest: digest("successor-canonical"),
      bodyDigest: digest("successor-body"),
      sourcePath: "docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md",
      contentDigest: digest("successor-source"),
    },
    projection: {
      sourcePath: "docs/governance/plan-admission-receipts.json",
      blobOid: "c".repeat(40),
      contentDigest: digest("projection-source"),
      expectedTailDigest: digest("projection-tail"),
      currentTailDigest: digest("projection-tail"),
      preserveThroughSequence: 9,
      appendOnly: true,
    },
    confirmationReview: {
      reviewKind: "cross_agent",
      verdict: "pass",
      exactHead: identity.sourceCommit,
      workerModel: "gpt-worker",
      reviewerModel: "claude-reviewer",
      reviewedAt: "2026-07-23T07:00:00.000Z",
      testsGreenAt: "2026-07-23T06:59:00.000Z",
      greenCommandCount: 2,
    },
    certificate: undefined as never,
  };
  proposal.certificate = deriveMigrationCertificate(certificateInput(proposal));
  return proposal;
}

function certificateInput(
  proposal: GenesisRebaseMigrationProposal,
): PlanAssetMigrationCertificateInput {
  return {
    commandId: proposal.commandId,
    identity: {
      algorithm: "ut-tdd-plan-rebase-v1",
      repositoryIdentity: proposal.repositoryIdentity,
      planId: proposal.successor.planId,
      historicalAssetId: proposal.historical.assetId,
      historicalTerminalRevision: 5,
      historicalTerminalRecordDigest: requireRevision(proposal, 4).recordDigest,
      sourceCommit: proposal.sourceCommit,
      sourceBlobOid: proposal.successor.sourceBlobOid,
    },
    predecessorRevisionRange: [1, 5],
    successorAssetId: proposal.successor.assetId,
    successorRevision: 1,
    issue102BodyDigest: proposal.issue102.bodyDigest,
    custodyIssueNumber: requireCustody(proposal).number,
    custodyIssueBodyDigest: requireCustody(proposal).bodyDigest,
    custodyProjectionDigest: requireCustody(proposal).projectionDigest,
    projectionPreimageDigest: proposal.projection.expectedTailDigest,
    decision: "PO_A_seal_history_and_rebase",
    sourceBlobAuthority: {
      repositoryIdentity: proposal.repositoryIdentity,
      commitOid: proposal.sourceCommit,
      sourcePath: proposal.successor.sourcePath,
      blobOid: proposal.successor.sourceBlobOid,
      contentDigest: proposal.successor.contentDigest,
      canonicalFrontmatterDigest: proposal.successor.canonicalPayloadDigest,
      bodyDigest: proposal.successor.bodyDigest,
      trustedStatus: "draft",
    },
    reviewedImplementationAuthority: {
      repositoryIdentity: proposal.repositoryIdentity,
      implementationHead: proposal.reviewedImplementationCommit,
      reviewKind: "cross_agent",
      verdict: "pass",
      testsGreenAt: requireReview(proposal).testsGreenAt,
      reviewedAt: requireReview(proposal).reviewedAt,
      greenCommandDigest: digest("green-commands"),
      workerModel: requireReview(proposal).workerModel,
      reviewerModel: requireReview(proposal).reviewerModel,
    },
  };
}

function revisions() {
  return Array.from({ length: 5 }, (_, index) => ({
    revision: index + 1,
    commandId: `old:${index + 1}`,
    receiptId: `receipt:${index + 1}`,
    receiptDigest: digest(`receipt-${index + 1}`),
    contentDigest: digest(`content-${index + 1}`),
    recordDigest: digest(`record-${index + 1}`),
    previousRecordDigest: index === 0 ? null : digest(`record-${index}`),
    bodyDigest: digest(`body-${index + 1}`),
    sourcePath: `docs/plans/revision-${index + 1}.md`,
    sourceCommit: "a".repeat(40),
  }));
}

function requireCustody(proposal: GenesisRebaseMigrationProposal) {
  if (!proposal.custodyIssue) throw new Error("test fixture custody missing");
  return proposal.custodyIssue;
}

function requireReview(proposal: GenesisRebaseMigrationProposal) {
  if (!proposal.confirmationReview) throw new Error("test fixture review missing");
  return proposal.confirmationReview;
}

function requireRevision(proposal: GenesisRebaseMigrationProposal, index: number) {
  const revision = proposal.historical.revisions[index];
  if (!revision) throw new Error(`test fixture revision ${index + 1} missing`);
  return revision;
}

function digest(value: string): `sha256:${string}` {
  const { createHash } = require("node:crypto") as typeof import("node:crypto");
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
