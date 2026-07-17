import { createHash } from "node:crypto";
import type { PlanRevisionManifest } from "../cli/plan-revise.js";
import { parseLegacyPlanSource } from "../plan-asset/adapters/legacy-plan-inventory.js";
import type { BootstrapLegacyPlanRevisionInput } from "../plan-asset/ledger/plan-revision-bootstrap.js";
import type { AppendPlanRevisionInput } from "../plan-asset/ledger/plan-revision-ledger.js";
import type { PlanDraftCommand } from "./plan-draft-service.js";
import type { PlanAdmissionRequest } from "./policy.js";

export interface PlanRevisionEnvironment {
  repositoryIdentity: string;
  sourceCommit: string;
  sourceBlobOid: string;
  headSource: string;
  actor: string;
}

export interface PlanRevisionExecutionPayload {
  admission: PlanAdmissionRequest;
  ledgerInput: AppendPlanRevisionInput | BootstrapLegacyPlanRevisionInput;
  legacy: boolean;
}

/** Revision commandを外部状態から分離してcanonical ledger inputへ組み立てる。 */
export function assemblePlanRevisionCommand(input: {
  manifest: PlanRevisionManifest;
  admission: PlanAdmissionRequest;
  environment: PlanRevisionEnvironment;
  legacy: boolean;
}): PlanDraftCommand<PlanRevisionExecutionPayload> {
  const { manifest, admission, environment } = input;
  const current = canonicalPlanPayload(manifest.source.content);
  const base = canonicalPlanPayload(environment.headSource);
  if (input.legacy && unprefix(manifest.base.revision_digest) !== sha(base.payload))
    throw new Error("plan-revision-base-canonical-drift");
  const common: AppendPlanRevisionInput = {
    commandId: manifest.command_id,
    assetId: manifest.base.asset_id,
    planId: manifest.plan_id,
    baseRevision: manifest.base.revision,
    basePayloadDigest: unprefix(manifest.base.revision_digest),
    canonicalPayloadJson: current.payload,
    bodyDigest: sha(current.body),
    sourcePath: manifest.source.path,
    sourceCommit: environment.sourceCommit,
    actor: environment.actor,
    reason: admission.escapeReason ?? `route:${admission.routeSignal}`,
    routeTupleDigest: sha(stableJson(admission)),
    certificateId: `certificate:${sha(manifest.command_id).slice(0, 32)}`,
    occurredAt: manifest.recorded_at,
  };
  const ledgerInput: AppendPlanRevisionInput | BootstrapLegacyPlanRevisionInput = input.legacy
    ? {
        ...common,
        repositoryIdentity: environment.repositoryIdentity,
        identityAlgorithm: "ut-tdd-plan-legacy-v1",
        identityInputJson: JSON.stringify([environment.repositoryIdentity, manifest.plan_id]),
        identityDigest: sha(JSON.stringify([environment.repositoryIdentity, manifest.plan_id])),
        baseCanonicalPayloadJson: base.payload,
        baseCanonicalPayloadDigest: sha(base.payload),
        baseBodyDigest: sha(base.body),
        baseSourcePath: manifest.source.path,
        baseSourceCommit: environment.sourceCommit,
        baseSourceBlobOid: environment.sourceBlobOid,
        baseSourceContent: environment.headSource,
        baseSourceContentDigest: sha(environment.headSource),
      }
    : common;
  const commandPayloadDigest = input.legacy
    ? bootstrapDigest(ledgerInput as BootstrapLegacyPlanRevisionInput)
    : revisionDigest(common);
  return {
    commandId: manifest.command_id,
    commandPayloadDigest,
    planId: manifest.plan_id,
    recordedAt: manifest.recorded_at,
    payload: { admission, ledgerInput, legacy: input.legacy },
    source: { path: manifest.source.path, content: manifest.source.content },
    projectionPath: manifest.projection.path,
  };
}

export function canonicalPlanPayload(source: string): { payload: string; body: string } {
  const parsed = parseLegacyPlanSource(source);
  if (!parsed) throw new Error("plan-revision-source-invalid");
  return { payload: stableJson(parsed.frontmatter), body: parsed.body };
}

function revisionDigest(input: AppendPlanRevisionInput): string {
  const canonicalPayloadDigest = sha(input.canonicalPayloadJson);
  return sha(JSON.stringify({ ...input, canonicalPayloadDigest }));
}

function bootstrapDigest(input: BootstrapLegacyPlanRevisionInput): string {
  const { assetId: _ignored, ...withoutInherited } = input as BootstrapLegacyPlanRevisionInput & {
    assetId?: string;
  };
  const assetId = legacyAssetId(input.repositoryIdentity, input.planId);
  return sha(stableJson({ ...withoutInherited, assetId }));
}

function legacyAssetId(repositoryIdentity: string, planId: string): string {
  const hash = createHash("sha256");
  for (const value of ["ut-tdd-plan-legacy-v1", repositoryIdentity, planId]) {
    const bytes = Buffer.from(value);
    const length = Buffer.allocUnsafe(4);
    length.writeUInt32BE(bytes.length);
    hash.update(length).update(bytes);
  }
  return `plan:legacy:${hash.digest("hex")}`;
}

function unprefix(value: string): string {
  return value.startsWith("sha256:") ? value.slice(7) : value;
}

export function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => Buffer.compare(Buffer.from(left), Buffer.from(right)))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
