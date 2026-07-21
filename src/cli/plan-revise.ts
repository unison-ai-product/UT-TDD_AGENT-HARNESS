import { readFileSync } from "node:fs";
import type { Command } from "commander";
import { z } from "zod";
import type {
  PlanAuthoringCommandRunner,
  PlanRedesignBundleManifest as PlanRedesignBundleManifestPort,
} from "../plan-admission/plan-authoring-command-port.js";
import type { PlanRevisionManifest as PlanRevisionManifestPort } from "../plan-admission/plan-revision-command-assembler.js";
import { evaluatePlanAdmission, type PlanAdmissionRequest } from "../plan-admission/policy";
import {
  driveSchema,
  kindSchema,
  layerSchema,
  statusSchema,
  subDocSchema,
  workflowPhaseSchema,
} from "../schema/index";

const digestSchema = z.string().regex(/^(?:sha256:)?[0-9a-f]{64}$/);
const gitOidSchema = z.string().regex(/^[0-9a-f]{40}(?:[0-9a-f]{24})?$/);
const repositoryPathSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      value.startsWith("docs/") &&
      !value.includes("\\") &&
      !value.split("/").includes("..") &&
      !value.startsWith("/"),
    "artifact pathはdocs/配下の正規化済み相対pathでなければなりません",
  );

const targetSchema = z
  .object({ target_plan_id: z.string().min(1), target_revision: z.number().int().positive() })
  .strict();

const admissionSchema = z
  .object({
    route_signal: z.string().min(1),
    route_mode: z.enum([
      "forward",
      "discovery",
      "scrum",
      "reverse",
      "redesign",
      "recovery",
      "incident",
      "refactor",
      "retrofit",
      "add-feature",
      "research",
      "design-bottomup",
      "version-up",
      "verify",
    ]),
    kind: kindSchema,
    layer: layerSchema,
    workflow_phase: workflowPhaseSchema.optional(),
    drive: driveSchema,
    branch: z.string().min(1),
    status: statusSchema.optional(),
    sub_doc: subDocSchema.optional(),
    issue: z
      .object({
        provider: z.literal("github"),
        issue_id: z.number().int().positive(),
        episode_id: z.string().min(1),
        projection_digest: digestSchema,
      })
      .strict()
      .optional(),
    origin: z
      .object({
        plan_id: z.string().min(1),
        revision: z.number().int().positive(),
        digest: digestSchema,
      })
      .strict()
      .optional(),
    transition_direction: z
      .enum(["implementation_to_design", "design_to_implementation"])
      .optional(),
    implementation_disposition: z.enum(["preserved", "discarded", "none"]).optional(),
    reentry: targetSchema
      .extend({ phase: z.literal("forward_merge") })
      .strict()
      .optional(),
    implementation_target: targetSchema.optional(),
    escape_reason: z.string().min(1).optional(),
    supersedes: z.array(z.string().min(1)).optional(),
  })
  .strict();

const revisionManifestSchema = z
  .object({
    version: z.literal(1),
    command_id: z.string().min(1),
    plan_id: z.string().min(1),
    actor: z.string().trim().min(1),
    recorded_at: z.string().datetime({ offset: true }),
    base: z
      .object({
        asset_id: z.string().min(1),
        revision: z.number().int().positive(),
        revision_digest: digestSchema,
        source_commit: gitOidSchema,
        source_blob_oid: gitOidSchema,
        source_content_digest: digestSchema,
        projection_tail_digest: digestSchema,
      })
      .strict(),
    admission: admissionSchema,
    source: z.object({ path: repositoryPathSchema, content: z.string().min(1) }).strict(),
    projection: z
      .object({ path: z.literal("docs/governance/plan-admission-receipts.json") })
      .strict(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.admission.route_mode === "redesign" || value.admission.route_signal === "redesign") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["admission", "route_mode"],
        message: "redesign bundleはversion 2 operation:redesign_bundleが必須です",
      });
    }
  });

export type PlanRevisionManifest = z.infer<typeof revisionManifestSchema> &
  PlanRevisionManifestPort;

const expectedPreimageSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("absent") }).strict(),
  z.object({ kind: z.literal("sha256"), digest: digestSchema }).strict(),
]);
const publicationArtifactSchema = z
  .object({
    path: repositoryPathSchema,
    content: z.string().min(1),
    expected_preimage: expectedPreimageSchema,
  })
  .strict();
const appendRevisionSchema = z
  .object({
    command_id: z.string().min(1),
    asset_id: z.string().min(1),
    plan_id: z.string().min(1),
    base_revision: z.number().int().positive(),
    base_payload_digest: digestSchema,
    canonical_payload_json: z.string().min(2),
    content_digest: digestSchema,
    body_digest: digestSchema,
    source_path: repositoryPathSchema,
    source_commit: gitOidSchema,
    actor: z.string().trim().min(1),
    reason: z.string().min(1),
    route_tuple_digest: digestSchema,
    certificate_id: z.string().min(1),
    occurred_at: z.string().datetime({ offset: true }),
    source_content: z.string().min(1),
    expected_preimage: expectedPreimageSchema,
  })
  .strict();
const redesignManifestSchema = z
  .object({
    version: z.literal(2),
    operation: z.literal("redesign_bundle"),
    command_id: z.string().min(1),
    repository_identity: z.string().min(1),
    replacement: appendRevisionSchema,
    origin: appendRevisionSchema,
    reentry: targetSchema.extend({ phase: z.literal("forward_merge") }).strict(),
    projection: publicationArtifactSchema,
    pairs: z.array(publicationArtifactSchema).min(1),
    upstream: z.array(publicationArtifactSchema).default([]),
  })
  .strict();

export type PlanRedesignBundleManifest = z.infer<typeof redesignManifestSchema> &
  PlanRedesignBundleManifestPort;
export type PlanAuthoringManifest = PlanRevisionManifest | PlanRedesignBundleManifest;

export type { PlanAuthoringCommandRunner } from "../plan-admission/plan-authoring-command-port.js";

export type PlanRevisionCommandRunner<TResult> = PlanAuthoringCommandRunner<TResult>;

export interface PlanRevisionCliDeps<TResult> {
  runner: PlanAuthoringCommandRunner<TResult>;
  readText?: (path: string) => string;
  writeOutput?: (text: string) => void;
}

export function registerPlanRevisionCommand<TResult>(
  plan: Command,
  deps: PlanRevisionCliDeps<TResult>,
): void {
  plan
    .command("revise")
    .description("strict manifestを検証して既存PLANのrevision N+1を発行")
    .requiredOption("--manifest <path>", "revision manifest JSON")
    .action((options: { manifest: string }) => {
      const write = deps.writeOutput ?? ((text: string) => process.stdout.write(text));
      try {
        const manifest = parsePlanRevisionManifest(
          (deps.readText ?? ((path: string) => readFileSync(path, "utf8")))(options.manifest),
        );
        if (manifest.version === 2) {
          const result = deps.runner.run({ manifest });
          write(`${JSON.stringify({ ok: true, result })}\n`);
          process.exitCode = 0;
          return;
        }
        const admission = toAdmissionRequest(manifest.admission);
        const decision = evaluatePlanAdmission(admission);
        if (!decision.ok) {
          write(`${JSON.stringify({ ok: false, violations: decision.violations })}\n`);
          process.exitCode = 1;
          return;
        }
        const result = deps.runner.run({ manifest, admission, decision });
        write(`${JSON.stringify({ ok: true, result })}\n`);
        process.exitCode = 0;
      } catch (error) {
        write(`${JSON.stringify({ ok: false, error: errorText(error) })}\n`);
        process.exitCode = 1;
      }
    });
}

export function parsePlanRevisionManifest(text: string): PlanAuthoringManifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    // convert: JSON parser detailをrevision manifest境界の安定したErrorへ変換する。
    const detail = errorText(error);
    throw new Error(`manifest JSONを解析できません: ${detail}`);
  }
  return z
    .union([revisionManifestSchema, redesignManifestSchema])
    .parse(parsed) as PlanAuthoringManifest;
}

function toAdmissionRequest(input: PlanRevisionManifest["admission"]): PlanAdmissionRequest {
  return {
    routeSignal: input.route_signal,
    routeMode: input.route_mode,
    kind: input.kind,
    layer: input.layer,
    ...(input.workflow_phase ? { workflowPhase: input.workflow_phase } : {}),
    drive: input.drive,
    branch: input.branch,
    ...(input.status ? { status: input.status } : {}),
    ...(input.sub_doc ? { subDoc: input.sub_doc } : {}),
    ...(input.issue
      ? {
          issue: {
            provider: input.issue.provider,
            issueId: input.issue.issue_id,
            episodeId: input.issue.episode_id,
            projectionDigest: input.issue.projection_digest,
          },
        }
      : {}),
    ...(input.origin
      ? {
          origin: {
            planId: input.origin.plan_id,
            revision: input.origin.revision,
            digest: input.origin.digest,
          },
        }
      : {}),
    ...(input.transition_direction ? { transitionDirection: input.transition_direction } : {}),
    ...(input.implementation_disposition
      ? { implementationDisposition: input.implementation_disposition }
      : {}),
    ...(input.reentry
      ? {
          reentry: {
            targetPlanId: input.reentry.target_plan_id,
            targetRevision: input.reentry.target_revision,
            phase: input.reentry.phase,
          },
        }
      : {}),
    ...(input.implementation_target
      ? {
          implementationTarget: {
            targetPlanId: input.implementation_target.target_plan_id,
            targetRevision: input.implementation_target.target_revision,
          },
        }
      : {}),
    ...(input.escape_reason ? { escapeReason: input.escape_reason } : {}),
    ...(input.supersedes ? { supersedes: input.supersedes } : {}),
  };
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
