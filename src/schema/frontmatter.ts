/**
 * UT-TDD PLAN frontmatter schema (requirements_v1.2 §1.1 / §1.9 / §1.10 A).
 * §1 enum を単一正本 (./index) から合成し、§1.1 排他制約 / §1.1.parent_design /
 * charter(L0) を superRefine で fail-close 検証する。
 * 最終同期: requirements v1.2 §1.1-§1.1.排他制約 / §1.2.2 / §3.3 / §3.4
 *
 * 注: kind×drive matrix (§1.6) / 必須 role (§1.8) / dependencies.requires の
 * status=completed 検証 (§1.10 C-E) は cross-record / matrix lookup を伴うため
 * plan lint エンジン側 (将来 PLAN) で実装する。本 schema は単一 PLAN 内
 * (intra-record) の §1.1 制約に限定する。
 */
import { z } from "zod";
import {
  artifactTypeSchema,
  decisionOutcomeSchema,
  driveSchema,
  forwardRoutingSchema,
  kindSchema,
  layerSchema,
  promotionStrategySchema,
  reverseTypeSchema,
  roleSchema,
  statusSchema,
  workflowPhaseSchema,
} from "./index";

/**
 * §1.10 A plan_id 形式 (phase-aware): `PLAN-<layer>-<NN>-slug`。
 * layer token = `L0`〜`L14` (該当工程) / `X` (cross = poc・reverse・recovery 等の横断) / `M` (master plan)。
 * NN = layer 内 2 桁連番、slug = kebab。**旧 flat `PLAN-001..004` は archived 別名前空間** (衝突しない)。
 * 狙い: ID 単体で phase 判別 → state(DB) が phase↔PLAN を拾える。
 */
export const planIdSchema = z.string().regex(/^PLAN-(L(?:[0-9]|1[0-4])|X|M)-\d{2}(-[a-z0-9-]+)?$/, {
  message: "plan_id は PLAN-<layer>-<NN>-slug 形式 (layer = L0〜L14 / X(cross) / M(master)、§1.10 A)",
});

/** §1.8 agent_slots エントリ */
export const agentSlotSchema = z.object({
  role: roleSchema,
  slot_label: z.string().min(1),
});

/** §1.1 generates エントリ (双方向 trace の起点) */
export const generatesEntrySchema = z.object({
  artifact_path: z.string().min(1),
  artifact_type: artifactTypeSchema,
});

/** §1.9 dependencies */
export const dependenciesSchema = z.object({
  parent: z.string().nullable().default(null),
  requires: z.array(z.string()).default([]),
  blocks: z.array(z.string()).default([]),
  references: z.array(z.string()).default([]),
});

/** §1.1 全 variant 共通フィールド (variant 固有制約は superRefine で fail-close) */
const frontmatterBaseSchema = z.object({
  plan_id: planIdSchema,
  title: z.string().min(1),
  kind: kindSchema,
  drive: driveSchema,
  status: statusSchema,
  layer: layerSchema.optional(),
  workflow_phase: workflowPhaseSchema.optional(),
  parent_design: z.string().optional(),
  decision_outcome: decisionOutcomeSchema.nullable().optional(),
  confirmed_reverse_type: reverseTypeSchema.optional(),
  forward_routing: forwardRoutingSchema.nullable().optional(),
  promotion_strategy: promotionStrategySchema.nullable().optional(),
  agent_slots: z.array(agentSlotSchema).min(1, "agent_slots は 1 件以上 (§1.8)"),
  generates: z.array(generatesEntrySchema).default([]),
  dependencies: dependenciesSchema,
  /** v2 HELIX-workflows 取り込み軌跡への参照 (任意、migration ledger path) */
  v2_import: z.string().optional(),
});

/** workflow_phase / layer=cross を取る kind (経路 2) */
const WORKFLOW_KINDS = new Set<string>(["poc", "reverse"]);

const custom = z.ZodIssueCode.custom;

/**
 * §1.1 排他制約 + §1.1.parent_design + charter(L0) + §1.10 E を fail-close 検証する frontmatter schema。
 */
export const frontmatterSchema = frontmatterBaseSchema.superRefine((fm, ctx) => {
  const isWorkflowKind = WORKFLOW_KINDS.has(fm.kind);

  if (isWorkflowKind) {
    // §1.1: kind in [poc,reverse] → workflow_phase 必須 / layer は cross のみ
    if (!fm.workflow_phase) {
      ctx.addIssue({
        code: custom,
        path: ["workflow_phase"],
        message: `kind=${fm.kind} は workflow_phase 必須 (§1.1)`,
      });
    }
    if (fm.layer !== "cross") {
      ctx.addIssue({
        code: custom,
        path: ["layer"],
        message: `kind=${fm.kind} は layer=cross のみ許可 (§1.1)`,
      });
    }
  } else {
    // §1.1: kind not in [poc,reverse] → layer 必須 / workflow_phase 禁止
    if (!fm.layer) {
      ctx.addIssue({
        code: custom,
        path: ["layer"],
        message: `kind=${fm.kind} は layer 必須 (§1.1)`,
      });
    }
    if (fm.workflow_phase) {
      ctx.addIssue({
        code: custom,
        path: ["workflow_phase"],
        message: `kind=${fm.kind} に workflow_phase は禁止 (§1.1)`,
      });
    }
  }

  // §1.1: kind=poc → workflow_phase ∈ {S0..S4}
  if (fm.kind === "poc" && fm.workflow_phase && !fm.workflow_phase.startsWith("S")) {
    ctx.addIssue({
      code: custom,
      path: ["workflow_phase"],
      message: "kind=poc は workflow_phase ∈ {S0..S4} (§1.1)",
    });
  }
  // §1.1: kind=reverse → workflow_phase ∈ {R0..R4}
  if (fm.kind === "reverse" && fm.workflow_phase && !fm.workflow_phase.startsWith("R")) {
    ctx.addIssue({
      code: custom,
      path: ["workflow_phase"],
      message: "kind=reverse は workflow_phase ∈ {R0..R4} (§1.1)",
    });
  }

  // §1.1: kind=poc + S4 → decision_outcome 必須
  if (fm.kind === "poc" && fm.workflow_phase === "S4" && !fm.decision_outcome) {
    ctx.addIssue({
      code: custom,
      path: ["decision_outcome"],
      message: "kind=poc + S4 は decision_outcome 必須 (§1.1 / §1.2.2)",
    });
  }

  // §3.3: kind=reverse → confirmed_reverse_type 必須
  if (fm.kind === "reverse" && !fm.confirmed_reverse_type) {
    ctx.addIssue({
      code: custom,
      path: ["confirmed_reverse_type"],
      message: "kind=reverse は confirmed_reverse_type 必須 (§3.3)",
    });
  }
  // §3.4: kind=reverse + R4 → forward_routing / promotion_strategy 必須
  if (fm.kind === "reverse" && fm.workflow_phase === "R4") {
    if (!fm.forward_routing) {
      ctx.addIssue({
        code: custom,
        path: ["forward_routing"],
        message: "kind=reverse + R4 は forward_routing 必須 (§3.4)",
      });
    }
    if (!fm.promotion_strategy) {
      ctx.addIssue({
        code: custom,
        path: ["promotion_strategy"],
        message: "kind=reverse + R4 は promotion_strategy 必須 (§3.4)",
      });
    }
  }

  // §1.1.parent_design: kind=impl (L7) は parent_design 必須
  if (fm.kind === "impl" && !fm.parent_design) {
    ctx.addIssue({
      code: custom,
      path: ["parent_design"],
      message: "kind=impl (L7) は parent_design 必須 (§1.1.parent_design)",
    });
  }

  // charter(L0): kind=charter は layer=L0 のみ (root, parent_design 不要)
  if (fm.kind === "charter" && fm.layer !== "L0") {
    ctx.addIssue({
      code: custom,
      path: ["layer"],
      message: "kind=charter は layer=L0 のみ (§1.3 / §2.1.1)",
    });
  }

  // §1.10 E: kind=add-* は dependencies.parent 必須 (null 不可)
  if ((fm.kind === "add-design" || fm.kind === "add-impl") && !fm.dependencies.parent) {
    ctx.addIssue({
      code: custom,
      path: ["dependencies", "parent"],
      message: "kind=add-* は dependencies.parent 必須 (§1.10 E)",
    });
  }
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;
