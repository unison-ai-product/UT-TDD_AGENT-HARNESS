import { z } from "zod";

export const nodeBanAuditSchemaVersion = "node-ban-audit.v1" as const;
export const nodeBanCandidateIdSchema = z.enum([
  "CAND-NODEBOOT-020",
  "CAND-NODEBOOT-201",
  "CAND-NODEBOOT-202",
  "CAND-NODEBOOT-203",
  "CAND-NODEBOOT-204",
]);
export const nodeBanDigestSchema = z.string().regex(/^sha256:[0-9a-f]{64}$/);
export const nodeBanRevisionSchema = z.string().regex(/^[0-9a-f]{40}$/);

/** Serialized output of scripts/node-generation-ci-aggregate.mjs (F0c). */
export const nodeBanF0cAggregateSchema = z
  .object({
    ok: z.literal(true),
    schema_version: z.literal("node-generation-aggregate.v1"),
    generation_id: z.string().min(1),
    artifact_digest: nodeBanDigestSchema,
    subject_revision: nodeBanRevisionSchema,
  })
  .passthrough();

export const nodeBanFindingSchema = z
  .object({
    detector: z.enum([
      "runtime-portability",
      "github-ci-policy",
      "rule-drift",
      "toolchain-pin",
      "process-observer",
    ]),
    path: z.string().min(1),
    rule: z.string().min(1),
    detail: z.string().min(1),
  })
  .strict();

export const nodeBanProcessObservationSchema = z
  .object({
    command: z.string().min(1),
    args: z.array(z.string()),
    shell: z.boolean(),
    outcome: z.enum(["allowed", "blocked"]),
    spawned: z.boolean(),
    reason: z.string().min(1),
  })
  .strict();

export const nodeBanCoverageSchema = z
  .object({
    runtime_files: z.number().int().nonnegative(),
    workflow_files: z.number().int().nonnegative(),
    instruction_files: z.number().int().nonnegative(),
    toolchain_files: z.number().int().nonnegative(),
    process_observations: z.number().int().nonnegative(),
    gaps: z.array(z.string()),
  })
  .strict();

export const nodeBanAuditReceiptSchema = z
  .object({
    schema_version: z.literal(nodeBanAuditSchemaVersion),
    candidate_ids: z.array(nodeBanCandidateIdSchema).min(1),
    subject_revision: nodeBanRevisionSchema,
    f0c_generation_id: z.string().min(1),
    f0c_artifact_digest: nodeBanDigestSchema,
    node_generation_id: z.string().min(1),
    node_artifact_digest: nodeBanDigestSchema,
    runtime: z.literal("node"),
    coverage: nodeBanCoverageSchema,
    findings: z.array(nodeBanFindingSchema),
    process_observations: z.array(nodeBanProcessObservationSchema),
    qualification: z.enum(["qualified", "non_compliant", "indeterminate"]),
    evidence_digest: nodeBanDigestSchema,
    receipt_digest: nodeBanDigestSchema,
  })
  .strict();

export type NodeBanCandidateId = z.infer<typeof nodeBanCandidateIdSchema>;
export type NodeBanF0cAggregate = z.infer<typeof nodeBanF0cAggregateSchema>;
export type NodeBanFinding = z.infer<typeof nodeBanFindingSchema>;
export type NodeBanProcessObservation = z.infer<typeof nodeBanProcessObservationSchema>;
export type NodeBanCoverage = z.infer<typeof nodeBanCoverageSchema>;
export type NodeBanAuditReceipt = z.infer<typeof nodeBanAuditReceiptSchema>;
