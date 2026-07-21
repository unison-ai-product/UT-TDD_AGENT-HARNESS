import type { PlanRevisionManifest } from "./plan-revision-command-assembler.js";
import type { AdmissionDecision, PlanAdmissionRequest } from "./policy.js";

export type ExpectedPlanPreimage =
  | { readonly kind: "absent" }
  | { readonly kind: "sha256"; readonly digest: string };

export interface PlanPublicationArtifactManifest {
  readonly path: string;
  readonly content: string;
  readonly expected_preimage: ExpectedPlanPreimage;
}

export interface PlanRedesignRevisionManifest {
  readonly command_id: string;
  readonly asset_id: string;
  readonly plan_id: string;
  readonly base_revision: number;
  readonly base_payload_digest: string;
  readonly canonical_payload_json: string;
  readonly content_digest: string;
  readonly body_digest: string;
  readonly source_path: string;
  readonly source_commit: string;
  readonly actor: string;
  readonly reason: string;
  readonly route_tuple_digest: string;
  readonly certificate_id: string;
  readonly occurred_at: string;
  readonly source_content: string;
  readonly expected_preimage: ExpectedPlanPreimage;
}

export interface PlanRedesignBundleManifest {
  readonly version: 2;
  readonly operation: "redesign_bundle";
  readonly command_id: string;
  readonly repository_identity: string;
  readonly replacement: PlanRedesignRevisionManifest;
  readonly origin: PlanRedesignRevisionManifest;
  readonly reentry: {
    readonly target_plan_id: string;
    readonly target_revision: number;
    readonly phase: "forward_merge";
  };
  readonly projection: PlanPublicationArtifactManifest;
  readonly pairs: readonly PlanPublicationArtifactManifest[];
  readonly upstream: readonly PlanPublicationArtifactManifest[];
}

export type PlanAuthoringCommandInput =
  | {
      readonly manifest: PlanRevisionManifest;
      readonly admission: PlanAdmissionRequest;
      readonly decision: Extract<AdmissionDecision, { ok: true }>;
    }
  | { readonly manifest: PlanRedesignBundleManifest };

export interface PlanAuthoringCommandRunner<TResult> {
  run(input: PlanAuthoringCommandInput): TResult;
}
