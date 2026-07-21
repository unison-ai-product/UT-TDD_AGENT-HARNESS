import { deriveLegacyAssetId } from "../plan-asset/adapters/legacy-plan-adapter.js";
import type {
  ExpectedPlanPreimage,
  PlanPublicationArtifactManifest,
  PlanRedesignBundleManifest,
  PlanRedesignRevisionManifest,
} from "./plan-authoring-command-port.js";
import { bindPlanSourceToAdmission } from "./plan-content-binding.js";
import { canonicalPlanPayload, sha, stableJson } from "./plan-revision-command-assembler.js";
import { evaluatePlanAdmission, type PlanAdmissionRequest } from "./policy.js";

export interface PlanRedesignRevisionSeed {
  readonly revisionMode?: "append" | "legacy_bootstrap";
  readonly assetId: string;
  readonly planId: string;
  readonly baseRevision: number;
  readonly basePayloadDigest: string;
  readonly sourcePath: string;
  readonly sourceContent: string;
  readonly admission: PlanAdmissionRequest;
  readonly expectedPreimage: ExpectedPlanPreimage;
  readonly bootstrap?: {
    readonly repositoryIdentity: string;
    readonly identityAlgorithm: "ut-tdd-plan-legacy-v1";
    readonly identityDigest: string;
    readonly sourceBlobOid: string;
    readonly sourceContent: string;
    readonly sourceContentDigest: string;
    readonly sourceCommit: string;
  };
}

export interface PlanRedesignAssemblyInput {
  readonly commandId: string;
  readonly repositoryIdentity: string;
  readonly sourceCommit: string;
  readonly actor: string;
  readonly occurredAt: string;
  readonly origin: PlanRedesignRevisionSeed;
  readonly replacement: PlanRedesignRevisionSeed;
  readonly reentry: {
    readonly targetPlanId: string;
    readonly targetRevision: number;
    readonly phase: "forward_merge";
  };
  readonly projection: PlanPublicationArtifactManifest;
  readonly pairs: readonly PlanPublicationArtifactManifest[];
  readonly upstream: readonly PlanPublicationArtifactManifest[];
}

/** 読取済みHEAD/identity/ledger/source/renderer snapshotだけからv2 manifestを生成する。 */
export function assemblePlanRedesignBundleManifest(
  input: PlanRedesignAssemblyInput,
): PlanRedesignBundleManifest {
  for (const seed of [input.origin, input.replacement])
    if (seed.bootstrap && seed.bootstrap.repositoryIdentity !== input.repositoryIdentity)
      fail("plan-redesign-bootstrap-repository-identity-mismatch");
  const common = {
    parentCommandId: input.commandId,
    sourceCommit: input.sourceCommit,
    actor: input.actor,
    occurredAt: input.occurredAt,
  };
  const replacement = {
    ...input.replacement,
    admission: bindReplacementAdmission(input),
  };
  return Object.freeze({
    version: 2,
    operation: "redesign_bundle",
    command_id: input.commandId,
    repository_identity: input.repositoryIdentity,
    replacement: revision({ ...common, role: "replacement", seed: replacement }),
    origin: revision({ ...common, role: "origin", seed: input.origin }),
    reentry: {
      target_plan_id: input.reentry.targetPlanId,
      target_revision: input.reentry.targetRevision,
      phase: input.reentry.phase,
    },
    projection: input.projection,
    pairs: [...input.pairs],
    upstream: [...input.upstream],
  });
}

/** 外部manifestの自己申告fieldをpublication前に同じpure計算へ照合する。 */
export function validatePlanRedesignBundleManifest(
  manifest: PlanRedesignBundleManifest,
): PlanRedesignBundleManifest {
  if (
    stableJson(manifest.replacement.admission) !==
    stableJson(
      bindReplacementAdmission({
        origin: {
          planId: manifest.origin.plan_id,
          baseRevision: manifest.origin.base_revision,
          basePayloadDigest: manifest.origin.base_payload_digest,
        },
        replacement: { admission: manifest.replacement.admission },
        reentry: {
          targetPlanId: manifest.reentry.target_plan_id,
          targetRevision: manifest.reentry.target_revision,
          phase: manifest.reentry.phase,
        },
      }),
    )
  )
    fail("plan-redesign-admission-cross-binding-invalid");
  for (const role of ["origin", "replacement"] as const) {
    const value = manifest[role];
    if (
      value.bootstrap?.repository_identity !== undefined &&
      value.bootstrap.repository_identity !== manifest.repository_identity
    )
      fail("plan-redesign-bootstrap-repository-identity-mismatch");
    const expected = revision({
      parentCommandId: manifest.command_id,
      role,
      sourceCommit: value.source_commit,
      actor: value.actor,
      occurredAt: value.occurred_at,
      seed: {
        assetId: value.asset_id,
        planId: value.plan_id,
        baseRevision: value.base_revision,
        basePayloadDigest: value.base_payload_digest,
        sourcePath: value.source_path,
        sourceContent: value.source_content,
        admission: value.admission,
        expectedPreimage: value.expected_preimage,
        revisionMode: value.revision_mode,
        bootstrap: value.bootstrap
          ? {
              repositoryIdentity: value.bootstrap.repository_identity,
              identityAlgorithm: value.bootstrap.identity_algorithm,
              identityDigest: value.bootstrap.identity_digest,
              sourceBlobOid: value.bootstrap.base_source_blob_oid,
              sourceContent: value.bootstrap.base_source_content,
              sourceContentDigest: value.bootstrap.base_source_content_digest,
              sourceCommit: value.bootstrap.base_source_commit,
            }
          : undefined,
      },
    });
    if (value.route_tuple_digest !== expected.route_tuple_digest)
      fail("plan-redesign-route-tuple-digest-mismatch");
    if (value.certificate_id !== expected.certificate_id)
      fail("plan-redesign-certificate-id-mismatch");
    if (stableJson(value) !== stableJson(expected)) fail("plan-redesign-derived-field-mismatch");
  }
  return manifest;
}

function bindReplacementAdmission(input: {
  readonly origin: Pick<PlanRedesignRevisionSeed, "planId" | "baseRevision" | "basePayloadDigest">;
  readonly replacement: Pick<PlanRedesignRevisionSeed, "admission">;
  readonly reentry: PlanRedesignAssemblyInput["reentry"];
}): PlanAdmissionRequest {
  const admission = input.replacement.admission;
  return {
    ...admission,
    origin: {
      planId: input.origin.planId,
      revision: input.origin.baseRevision,
      digest: prefixed(input.origin.basePayloadDigest),
    },
    reentry: input.reentry,
  };
}

function revision(input: {
  readonly parentCommandId: string;
  readonly role: "origin" | "replacement";
  readonly sourceCommit: string;
  readonly actor: string;
  readonly occurredAt: string;
  readonly seed: PlanRedesignRevisionSeed;
}): PlanRedesignRevisionManifest {
  const decision = evaluatePlanAdmission(input.seed.admission);
  if (!decision.ok) fail("plan-redesign-admission-invalid");
  const commandId = `${input.parentCommandId}:${input.role}`;
  const bound = bindPlanSourceToAdmission({
    source: input.seed.sourceContent,
    planId: input.seed.planId,
    admission: input.seed.admission,
  });
  const canonical = canonicalPlanPayload(bound.source);
  const revisionMode = input.seed.revisionMode ?? "append";
  const bootstrap = bootstrapManifest(input.seed, revisionMode);
  return Object.freeze({
    revision_mode: revisionMode,
    command_id: commandId,
    asset_id: input.seed.bootstrap
      ? deriveLegacyAssetId(input.seed.bootstrap.repositoryIdentity, input.seed.planId)
      : input.seed.assetId,
    plan_id: input.seed.planId,
    base_revision: input.seed.baseRevision,
    base_payload_digest: normalize(input.seed.basePayloadDigest),
    canonical_payload_json: canonical.payload,
    content_digest: normalize(bound.contentDigest),
    body_digest: sha(canonical.body),
    source_path: input.seed.sourcePath,
    source_commit: input.sourceCommit,
    actor: input.actor,
    reason: input.seed.admission.escapeReason ?? `route:${input.seed.admission.routeSignal}`,
    route_tuple_digest: sha(stableJson(input.seed.admission)),
    certificate_id: `certificate:${sha(commandId).slice(0, 32)}`,
    occurred_at: input.occurredAt,
    source_content: bound.source,
    expected_preimage: input.seed.expectedPreimage,
    admission: input.seed.admission,
    ...(bootstrap ? { bootstrap } : {}),
  });
}

function bootstrapManifest(
  seed: PlanRedesignRevisionSeed,
  revisionMode: "append" | "legacy_bootstrap",
): PlanRedesignRevisionManifest["bootstrap"] {
  if (revisionMode === "append") {
    if (seed.bootstrap) fail("plan-redesign-bootstrap-fields-unexpected");
    return undefined;
  }
  if (!seed.bootstrap) fail("plan-redesign-bootstrap-fields-missing");
  const base = canonicalPlanPayload(seed.bootstrap.sourceContent);
  const identityInputJson = JSON.stringify([seed.bootstrap.repositoryIdentity, seed.planId]);
  if (normalize(seed.bootstrap.identityDigest) !== sha(identityInputJson))
    fail("plan-redesign-bootstrap-identity-digest-mismatch");
  if (normalize(seed.bootstrap.sourceContentDigest) !== sha(seed.bootstrap.sourceContent))
    fail("plan-redesign-bootstrap-source-digest-mismatch");
  if (seed.bootstrap.identityAlgorithm !== "ut-tdd-plan-legacy-v1")
    fail("plan-redesign-bootstrap-identity-algorithm-invalid");
  return {
    repository_identity: seed.bootstrap.repositoryIdentity,
    identity_algorithm: seed.bootstrap.identityAlgorithm,
    identity_input_json: identityInputJson,
    identity_digest: normalize(seed.bootstrap.identityDigest),
    base_canonical_payload_json: base.payload,
    base_canonical_payload_digest: sha(base.payload),
    base_body_digest: sha(base.body),
    base_source_path: seed.sourcePath,
    base_source_commit: seed.bootstrap.sourceCommit,
    base_source_blob_oid: seed.bootstrap.sourceBlobOid,
    base_source_content: seed.bootstrap.sourceContent,
    base_source_content_digest: normalize(seed.bootstrap.sourceContentDigest),
  };
}

function normalize(value: string): string {
  return value.startsWith("sha256:") ? value.slice(7) : value;
}

function prefixed(value: string): `sha256:${string}` {
  return `sha256:${normalize(value)}`;
}

function fail(ruleId: string): never {
  throw new Error(ruleId);
}
