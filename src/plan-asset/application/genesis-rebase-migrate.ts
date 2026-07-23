import type {
  GenesisRebaseMigrationProposal,
  ValidatedGenesisRebaseMigration,
} from "../domain/plan-asset-lineage-migration.js";
import {
  deriveMigrationCertificate,
  deriveRebaseAssetId,
  digestValid,
  migrationCertificateValid,
  type PlanAssetMigrationCertificateInput,
} from "../domain/plan-asset-migration-certificate.js";

export type { GenesisRebaseMigrationProposal } from "../domain/plan-asset-lineage-migration.js";

export type GenesisRebaseMigrationValidation =
  | { readonly ok: true; readonly value: Readonly<ValidatedGenesisRebaseMigration> }
  | { readonly ok: false; readonly ruleId: string };

/** No-I/O admission boundary for historical seal + successor genesis. */
export function validateGenesisRebaseMigration(
  proposal: GenesisRebaseMigrationProposal,
): GenesisRebaseMigrationValidation {
  if (
    proposal.issue102.number !== 102 ||
    proposal.issue102.state !== "OPEN" ||
    proposal.issue102.mutationForbidden !== true ||
    !digestValid(proposal.issue102.bodyDigest)
  )
    return failed("issue102-not-sealed");
  if (!proposal.custodyIssue) return failed("custody-issue-missing");
  if (
    proposal.custodyIssue.terminal !== true ||
    proposal.custodyIssue.driveModel !== "recovery" ||
    !Number.isSafeInteger(proposal.custodyIssue.number) ||
    proposal.custodyIssue.number <= 0 ||
    !digestValid(proposal.custodyIssue.bodyDigest) ||
    !digestValid(proposal.custodyIssue.projectionDigest)
  )
    return failed("custody-issue-nonterminal");
  const revisions = proposal.historical.revisions;
  if (
    proposal.historical.disposition !== "historical_sealed_unrehydratable" ||
    proposal.historical.appendForbidden !== true ||
    revisions.length === 0 ||
    revisions.some((revision, index) => revision.revision !== index + 1)
  )
    return failed("historical-revision-chain-invalid");
  if (
    revisions.some(
      (revision, index) =>
        !digestValid(revision.contentDigest) ||
        !digestValid(revision.recordDigest) ||
        revision.previousRecordDigest !== (index === 0 ? null : revisions[index - 1]?.recordDigest),
    )
  )
    return failed("historical-receipt-chain-invalid");
  if (proposal.historical.inferredRowsForbidden !== true)
    return failed("historical-inference-forbidden");
  if (
    proposal.projection.appendOnly !== true ||
    proposal.projection.preserveThroughSequence < revisions.length ||
    proposal.projection.currentTailDigest !== proposal.projection.expectedTailDigest
  )
    return failed("projection-tail-drift");
  const identity = proposal.certificate.identity;
  if (
    proposal.successor.revision !== 1 ||
    proposal.successor.status !== "confirmed" ||
    proposal.successor.assetId === proposal.historical.assetId ||
    proposal.successor.assetId !== deriveRebaseAssetId(identity) ||
    identity.repositoryIdentity !== proposal.repositoryIdentity ||
    identity.planId !== proposal.successor.planId ||
    identity.historicalAssetId !== proposal.historical.assetId ||
    identity.historicalTerminalRevision !== revisions.length ||
    identity.historicalTerminalRecordDigest !== revisions.at(-1)?.recordDigest ||
    identity.sourceCommit !== proposal.sourceCommit ||
    identity.sourceBlobOid !== proposal.successor.sourceBlobOid
  )
    return failed("successor-identity-invalid");
  const review = proposal.confirmationReview;
  if (!review) return failed("confirmation-review-missing");
  if (
    review.reviewKind !== "cross_agent" ||
    review.verdict !== "pass" ||
    review.exactHead !== proposal.sourceCommit ||
    !review.workerModel.trim() ||
    !review.reviewerModel.trim() ||
    review.workerModel === review.reviewerModel ||
    !Number.isSafeInteger(review.greenCommandCount) ||
    review.greenCommandCount < 1 ||
    !Number.isFinite(Date.parse(review.testsGreenAt)) ||
    !Number.isFinite(Date.parse(review.reviewedAt)) ||
    Date.parse(review.testsGreenAt) > Date.parse(review.reviewedAt)
  )
    return failed("confirmation-review-invalid");
  if (
    !migrationCertificateValid(proposal.certificate) ||
    proposal.certificate.certificateDigest !==
      deriveMigrationCertificate(certificateInput(proposal)).certificateDigest
  )
    return failed("migration-certificate-invalid");
  return {
    ok: true,
    value: Object.freeze({
      commandId: proposal.commandId,
      historicalAssetId: proposal.historical.assetId,
      historicalTerminalRevision: revisions.length,
      successorAssetId: proposal.successor.assetId,
      successorRevision: 1,
      certificate: proposal.certificate,
    }),
  };
}

function certificateInput(
  proposal: GenesisRebaseMigrationProposal,
): PlanAssetMigrationCertificateInput {
  const custody = proposal.custodyIssue;
  if (!custody) throw new Error("custody-issue-missing");
  return {
    commandId: proposal.commandId,
    identity: proposal.certificate.identity,
    predecessorRevisionRange: [1, proposal.historical.revisions.length],
    successorAssetId: proposal.successor.assetId,
    successorRevision: 1,
    issue102BodyDigest: proposal.issue102.bodyDigest,
    custodyIssueNumber: custody.number,
    custodyIssueBodyDigest: custody.bodyDigest,
    custodyProjectionDigest: custody.projectionDigest,
    projectionPreimageDigest: proposal.projection.expectedTailDigest,
    decision: "PO_A_seal_history_and_rebase",
  };
}

function failed(ruleId: string): GenesisRebaseMigrationValidation {
  return { ok: false, ruleId };
}
