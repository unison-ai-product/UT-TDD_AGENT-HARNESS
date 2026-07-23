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
}

export interface PlanAssetMigrationCertificate extends PlanAssetMigrationCertificateInput {
  readonly schemaVersion: "ut-tdd.plan-asset-migration-certificate/v1";
  readonly certificateId: `migration:${string}`;
  readonly certificateDigest: Sha256Digest;
  readonly migrationKind: "historical_seal_rebase";
  readonly inferenceForbidden: true;
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
    certificate.inferenceForbidden !== true
  )
    return false;
  const { certificateDigest: _digest, ...input } = certificate;
  const {
    schemaVersion: _schema,
    certificateId: _id,
    migrationKind: _kind,
    inferenceForbidden: _inference,
    ...source
  } = input;
  return deriveMigrationCertificate(source).certificateDigest === certificate.certificateDigest;
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
