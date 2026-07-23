import { createHash } from "node:crypto";

export type Sha256Digest = `sha256:${string}`;

export interface PlanAssetRebaseIdentity {
  readonly algorithm: "ut-tdd-plan-rebase-v1";
  readonly repositoryIdentity: string;
  readonly planId: string;
  readonly historicalAssetId: string;
  readonly historicalTerminalRevision: number;
  readonly historicalTerminalRecordDigest: Sha256Digest;
  readonly sourceCommit: string;
  readonly sourceBlobOid: string;
}

export interface SourceBlobAuthority {
  readonly repositoryIdentity: string;
  readonly commitOid: string;
  readonly sourcePath: string;
  readonly blobOid: string;
  readonly contentDigest: Sha256Digest;
  readonly canonicalFrontmatterDigest: Sha256Digest;
  readonly bodyDigest: Sha256Digest;
  readonly trustedStatus: "draft";
}

export interface ReviewedImplementationAuthority {
  readonly repositoryIdentity: string;
  readonly implementationHead: string;
  readonly reviewKind: "cross_agent";
  readonly verdict: "pass";
  readonly testsGreenAt: string;
  readonly reviewedAt: string;
  readonly greenCommandDigest: Sha256Digest;
  readonly workerModel: string;
  readonly reviewerModel: string;
}

export interface PlanAssetMigrationCertificateInput {
  readonly commandId: string;
  readonly identity: PlanAssetRebaseIdentity;
  readonly predecessorRevisionRange: readonly [number, number];
  readonly successorAssetId: string;
  readonly successorRevision: 1;
  readonly issue102BodyDigest: Sha256Digest;
  readonly custodyIssueNumber: number;
  readonly custodyIssueBodyDigest: Sha256Digest;
  readonly custodyProjectionDigest: Sha256Digest;
  readonly projectionPreimageDigest: Sha256Digest;
  readonly decision: "PO_A_seal_history_and_rebase";
  readonly sourceBlobAuthority: SourceBlobAuthority;
  readonly reviewedImplementationAuthority: ReviewedImplementationAuthority;
}

export interface PlanAssetMigrationCertificate extends PlanAssetMigrationCertificateInput {
  readonly schemaVersion: "ut-tdd.plan-asset-migration-certificate/v1";
  readonly certificateId: `migration:${string}`;
  readonly certificateDigest: Sha256Digest;
  readonly migrationKind: "historical_seal_rebase";
  readonly inferenceForbidden: true;
  readonly sourceAuthorityDigest: Sha256Digest;
  readonly reviewedImplementationAuthorityDigest: Sha256Digest;
  readonly trustedStatus: "draft";
}

export function deriveRebaseAssetId(identity: PlanAssetRebaseIdentity): `plan:rebase:${string}` {
  return `plan:rebase:${sha(stableJson(identity))}`;
}

export function deriveMigrationCertificate(
  input: PlanAssetMigrationCertificateInput,
): Readonly<PlanAssetMigrationCertificate> {
  const body = {
    ...input,
    schemaVersion: "ut-tdd.plan-asset-migration-certificate/v1" as const,
    certificateId:
      `migration:${sha(`rebase:${input.identity.historicalAssetId}:${input.successorAssetId}`).slice(0, 32)}` as const,
    migrationKind: "historical_seal_rebase" as const,
    inferenceForbidden: true as const,
    sourceAuthorityDigest: authorityDigest(input.sourceBlobAuthority),
    reviewedImplementationAuthorityDigest: authorityDigest(input.reviewedImplementationAuthority),
    trustedStatus: input.sourceBlobAuthority.trustedStatus,
  };
  return Object.freeze({
    ...body,
    certificateDigest: `sha256:${sha(stableJson(body))}`,
  });
}

export function migrationCertificateValid(certificate: PlanAssetMigrationCertificate): boolean {
  if (
    !validIdentity(certificate.identity) ||
    certificate.successorAssetId !== deriveRebaseAssetId(certificate.identity) ||
    certificate.predecessorRevisionRange[0] !== 1 ||
    certificate.predecessorRevisionRange[1] !== certificate.identity.historicalTerminalRevision ||
    certificate.successorRevision !== 1 ||
    certificate.inferenceForbidden !== true ||
    !sourceAuthorityValid(certificate.sourceBlobAuthority, certificate.identity) ||
    !reviewedAuthorityValid(
      certificate.reviewedImplementationAuthority,
      certificate.identity.repositoryIdentity,
    ) ||
    certificate.sourceAuthorityDigest !== authorityDigest(certificate.sourceBlobAuthority) ||
    certificate.reviewedImplementationAuthorityDigest !==
      authorityDigest(certificate.reviewedImplementationAuthority) ||
    certificate.trustedStatus !== certificate.sourceBlobAuthority.trustedStatus
  )
    return false;
  const { certificateDigest: _digest, ...input } = certificate;
  const {
    schemaVersion: _schema,
    certificateId: _id,
    migrationKind: _kind,
    inferenceForbidden: _inference,
    sourceAuthorityDigest: _sourceAuthorityDigest,
    reviewedImplementationAuthorityDigest: _reviewedAuthorityDigest,
    trustedStatus: _trustedStatus,
    ...source
  } = input;
  return deriveMigrationCertificate(source).certificateDigest === certificate.certificateDigest;
}

export function authorityDigest(authority: SourceBlobAuthority | ReviewedImplementationAuthority) {
  return `sha256:${sha(stableJson(authority))}` as Sha256Digest;
}

function sourceAuthorityValid(
  authority: SourceBlobAuthority,
  identity: PlanAssetRebaseIdentity,
): boolean {
  return (
    Boolean(authority) &&
    authority.repositoryIdentity === identity.repositoryIdentity &&
    authority.commitOid === identity.sourceCommit &&
    authority.blobOid === identity.sourceBlobOid &&
    authority.sourcePath.startsWith("docs/plans/") &&
    digestValid(authority.contentDigest) &&
    digestValid(authority.canonicalFrontmatterDigest) &&
    digestValid(authority.bodyDigest) &&
    authority.trustedStatus === "draft"
  );
}

function reviewedAuthorityValid(
  authority: ReviewedImplementationAuthority,
  repositoryIdentity: string,
): boolean {
  return (
    Boolean(authority) &&
    authority.repositoryIdentity === repositoryIdentity &&
    /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/.test(authority.implementationHead) &&
    authority.reviewKind === "cross_agent" &&
    authority.verdict === "pass" &&
    digestValid(authority.greenCommandDigest) &&
    Boolean(authority.workerModel.trim()) &&
    Boolean(authority.reviewerModel.trim()) &&
    authority.workerModel !== authority.reviewerModel &&
    Number.isFinite(Date.parse(authority.testsGreenAt)) &&
    Number.isFinite(Date.parse(authority.reviewedAt)) &&
    Date.parse(authority.testsGreenAt) <= Date.parse(authority.reviewedAt)
  );
}

function validIdentity(identity: PlanAssetRebaseIdentity): boolean {
  return (
    identity.algorithm === "ut-tdd-plan-rebase-v1" &&
    Boolean(identity.repositoryIdentity.trim()) &&
    Boolean(identity.planId.trim()) &&
    Boolean(identity.historicalAssetId.trim()) &&
    Number.isSafeInteger(identity.historicalTerminalRevision) &&
    identity.historicalTerminalRevision > 0 &&
    digestValid(identity.historicalTerminalRecordDigest) &&
    /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/.test(identity.sourceCommit) &&
    /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/.test(identity.sourceBlobOid)
  );
}

export function digestValid(value: string): value is Sha256Digest {
  return /^sha256:[0-9a-f]{64}$/.test(value);
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => Buffer.compare(Buffer.from(left), Buffer.from(right)))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
