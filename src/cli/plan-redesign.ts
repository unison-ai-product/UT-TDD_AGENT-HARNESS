import { readFileSync } from "node:fs";
import type { Command } from "commander";
import { z } from "zod";
import {
  assemblePlanRedesignBundleManifest,
  type PlanRedesignAssemblyInput,
} from "../plan-admission/plan-redesign-command-assembler.js";

const preimageSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("absent") }).strict(),
  z.object({ kind: z.literal("sha256"), digest: z.string().min(1) }).strict(),
]);
const artifactSchema = z
  .object({ path: z.string().min(1), content: z.string(), expected_preimage: preimageSchema })
  .strict();
const admissionSchema = z
  .object({
    routeSignal: z.string().min(1),
    routeMode: z.string().min(1),
    kind: z.string().min(1),
    layer: z.string().min(1),
    drive: z.string().min(1),
    branch: z.string().min(1),
  })
  .passthrough();
const bootstrapSchema = z
  .object({
    repository_identity: z.string().min(1),
    identity_algorithm: z.literal("ut-tdd-plan-legacy-v1"),
    identity_digest: z.string().min(1),
    source_blob_oid: z.string().min(1),
    source_content: z.string(),
    source_content_digest: z.string().min(1),
    source_commit: z.string().min(1),
  })
  .strict();
const revisionSeedSchema = z
  .object({
    revision_mode: z.enum(["append", "legacy_bootstrap"]).optional(),
    asset_id: z.string().min(1),
    plan_id: z.string().min(1),
    base_revision: z.number().int().positive(),
    base_payload_digest: z.string().min(1),
    source_path: z.string().min(1),
    source_content: z.string().min(1),
    admission: admissionSchema,
    expected_preimage: preimageSchema,
    bootstrap: bootstrapSchema.optional(),
  })
  .strict();
const assemblySchema = z
  .object({
    command_id: z.string().min(1),
    repository_identity: z.string().min(1),
    source_commit: z.string().min(1),
    actor: z.string().trim().min(1),
    occurred_at: z.string().datetime({ offset: true }),
    origin: revisionSeedSchema,
    replacement: revisionSeedSchema,
    reentry: z
      .object({
        target_plan_id: z.string().min(1),
        target_revision: z.number().int().positive(),
        phase: z.literal("forward_merge"),
      })
      .strict(),
    projection: artifactSchema,
    pairs: z.array(artifactSchema).min(1),
    upstream: z.array(artifactSchema).default([]),
  })
  .strict();

export interface PlanRedesignCliDeps {
  readonly readText?: (path: string) => string;
  readonly writeOutput?: (text: string) => void;
}

export function registerPlanRedesignCommand(plan: Command, deps: PlanRedesignCliDeps = {}): void {
  plan
    .command("redesign")
    .description("redesign assembly inputから派生値を再計算したstrict v2 manifestを生成")
    .requiredOption("--input <path>", "redesign assembly input JSON")
    .action((options: { input: string }) => {
      const write = deps.writeOutput ?? ((text: string) => process.stdout.write(text));
      try {
        const input = parsePlanRedesignAssemblyInput(
          (deps.readText ?? ((path: string) => readFileSync(path, "utf8")))(options.input),
        );
        write(`${JSON.stringify(assemblePlanRedesignBundleManifest(input), null, 2)}\n`);
        process.exitCode = 0;
      } catch (error) {
        write(`${JSON.stringify({ ok: false, error: errorText(error) })}\n`);
        process.exitCode = 1;
      }
    });
}

export function parsePlanRedesignAssemblyInput(text: string): PlanRedesignAssemblyInput {
  const value = assemblySchema.parse(JSON.parse(text));
  return {
    commandId: value.command_id,
    repositoryIdentity: value.repository_identity,
    sourceCommit: value.source_commit,
    actor: value.actor,
    occurredAt: value.occurred_at,
    origin: seed(value.origin),
    replacement: seed(value.replacement),
    reentry: {
      targetPlanId: value.reentry.target_plan_id,
      targetRevision: value.reentry.target_revision,
      phase: value.reentry.phase,
    },
    projection: value.projection,
    pairs: value.pairs,
    upstream: value.upstream,
  } as PlanRedesignAssemblyInput;
}

function seed(value: z.infer<typeof revisionSeedSchema>) {
  return {
    ...(value.revision_mode ? { revisionMode: value.revision_mode } : {}),
    assetId: value.asset_id,
    planId: value.plan_id,
    baseRevision: value.base_revision,
    basePayloadDigest: value.base_payload_digest,
    sourcePath: value.source_path,
    sourceContent: value.source_content,
    admission: value.admission,
    expectedPreimage: value.expected_preimage,
    ...(value.bootstrap
      ? {
          bootstrap: {
            repositoryIdentity: value.bootstrap.repository_identity,
            identityAlgorithm: value.bootstrap.identity_algorithm,
            identityDigest: value.bootstrap.identity_digest,
            sourceBlobOid: value.bootstrap.source_blob_oid,
            sourceContent: value.bootstrap.source_content,
            sourceContentDigest: value.bootstrap.source_content_digest,
            sourceCommit: value.bootstrap.source_commit,
          },
        }
      : {}),
  };
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
