import type {
  PlanAssetMigrationCertificate,
  Sha256Digest,
} from "./plan-asset-migration-certificate.js";

export interface HistoricalRevisionSeal {
  revision: number;
  commandId: string;
  receiptId: string;
  receiptDigest: Sha256Digest;
  contentDigest: Sha256Digest;
  recordDigest: Sha256Digest;
  previousRecordDigest: Sha256Digest | null;
  bodyDigest: Sha256Digest;
  sourcePath: string;
  sourceCommit: string;
}

export interface HistoricalPlanAssetSeal {
  assetId: string;
  disposition: "historical_sealed_unrehydratable";
  appendForbidden: boolean;
  inferredRowsForbidden: boolean;
  revisions: HistoricalRevisionSeal[];
}

export interface CustodyIssueEvidence {
  number: number;
  state: "OPEN" | "CLOSED";
  bodyDigest: Sha256Digest;
  projectionDigest: Sha256Digest;
  terminal: boolean;
  driveModel: "recovery";
  nodeId?: string;
  updatedAt?: string;
}

export interface ConfirmationReviewEvidence {
  reviewKind: "cross_agent";
  verdict: "pass" | "fail";
  exactHead: string;
  workerModel: string;
  reviewerModel: string;
  reviewedAt: string;
  testsGreenAt: string;
  greenCommandCount: number;
}

export interface GenesisRebaseMigrationProposal {
  commandId: string;
  repositoryIdentity: string;
  sourceCommit: string;
  issue102: {
    number: 102;
    state: "OPEN";
    bodyDigest: Sha256Digest;
    mutationForbidden: boolean;
  };
  custodyIssue: CustodyIssueEvidence | null;
  historical: HistoricalPlanAssetSeal;
  successor: {
    assetId: string;
    revision: 1;
    planId: string;
    sourceBlobOid: string;
    contentDigest: Sha256Digest;
    status: "confirmed";
    canonicalPayloadDigest: Sha256Digest;
    bodyDigest: Sha256Digest;
    sourcePath: string;
  };
  projection: {
    sourcePath: string;
    blobOid: string;
    contentDigest: Sha256Digest;
    expectedTailDigest: Sha256Digest;
    currentTailDigest: Sha256Digest;
    preserveThroughSequence: number;
    appendOnly: boolean;
  };
  confirmationReview: ConfirmationReviewEvidence | null;
  certificate: PlanAssetMigrationCertificate;
}

export interface ValidatedGenesisRebaseMigration {
  readonly commandId: string;
  readonly historicalAssetId: string;
  readonly historicalTerminalRevision: number;
  readonly successorAssetId: string;
  readonly successorRevision: 1;
  readonly certificate: PlanAssetMigrationCertificate;
}
