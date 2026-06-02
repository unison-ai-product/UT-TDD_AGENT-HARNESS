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
  scrumTypeSchema,
  statusSchema,
  workflowPhaseSchema,
} from "./index";

/**
 * §1.10 A plan_id 形式 (phase-aware + 駆動モデル legible): `PLAN-<token>-<NN>-slug`。
 * token = ① Forward 工程 = `L0`〜`L14` (該当工程、token↔layer 一致) / ② 横断駆動モデル = `DISCOVERY`(kind=poc) / `REVERSE`(kind=reverse) / `RECOVERY`(kind=recovery) (token↔kind 一致、layer=cross) / ③ `M` (master plan)。
 * 旧 `X`(cross) は駆動モデルを潰し ID から読めなかったため、駆動モデル名トークンへ置換 (option 1、PO 2026-06-01)。
 * NN = token 内 2 桁連番、slug = kebab。**旧 flat `PLAN-001..004` は archived 別名前空間** (衝突しない)。
 * 狙い: ID 単体で 工程/駆動モデル + phase を判別 → state(DB) が phase↔PLAN を拾える。
 */
export const planIdSchema = z
  .string()
  .regex(/^PLAN-(L(?:[0-9]|1[0-4])|DISCOVERY|REVERSE|RECOVERY|M)-\d{2}(-[a-z0-9-]+)?$/, {
    message:
      "plan_id は PLAN-<token>-<NN>-slug 形式 (token = L0〜L14 / DISCOVERY / REVERSE / RECOVERY / M、§1.10 A)",
  });

/** §1.10 A 駆動モデルトークン ↔ kind 対応 (横断駆動プランの ID legibility 正本) */
export const DRIVE_TOKEN_TO_KIND: Record<string, string> = {
  DISCOVERY: "poc",
  REVERSE: "reverse",
  RECOVERY: "recovery",
};

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
  scrum_type: scrumTypeSchema.nullable().optional(),
  forward_routing: forwardRoutingSchema.nullable().optional(),
  promotion_strategy: promotionStrategySchema.nullable().optional(),
  agent_slots: z.array(agentSlotSchema).min(1, "agent_slots は 1 件以上 (§1.8)"),
  generates: z.array(generatesEntrySchema).default([]),
  dependencies: dependenciesSchema,
  /** v2 HELIX-workflows 取り込み軌跡への参照 (任意、migration ledger path) */
  v2_import: z.string().optional(),
});

/** layer=cross を取る横断駆動 kind (Discovery=poc / Reverse=reverse / Recovery=recovery) */
const CROSS_KINDS = new Set<string>(["poc", "reverse", "recovery"]);
/** workflow_phase (S/R) を取る kind (Scrum=poc S0-S4 / Reverse R0-R4)。recovery は phase を持たない */
const WORKFLOW_KINDS = new Set<string>(["poc", "reverse"]);

const custom = z.ZodIssueCode.custom;

/**
 * §1.1 排他制約 + §1.1.parent_design + charter(L0) + §1.10 E を fail-close 検証する frontmatter schema。
 */
export const frontmatterSchema = frontmatterBaseSchema.superRefine((fm, ctx) => {
  const isCrossKind = CROSS_KINDS.has(fm.kind);
  const isWorkflowKind = WORKFLOW_KINDS.has(fm.kind);

  if (isCrossKind) {
    // §1.1: 横断駆動 (poc/reverse/recovery) → layer は cross のみ
    if (fm.layer !== "cross") {
      ctx.addIssue({
        code: custom,
        path: ["layer"],
        message: `kind=${fm.kind} は layer=cross のみ許可 (§1.1)`,
      });
    }
    // §1.1: poc/reverse は workflow_phase 必須 / recovery は phase を持たない (禁止)
    if (isWorkflowKind && !fm.workflow_phase) {
      ctx.addIssue({
        code: custom,
        path: ["workflow_phase"],
        message: `kind=${fm.kind} は workflow_phase 必須 (§1.1)`,
      });
    }
    if (!isWorkflowKind && fm.workflow_phase) {
      ctx.addIssue({
        code: custom,
        path: ["workflow_phase"],
        message: `kind=${fm.kind} に workflow_phase は禁止 (§1.1)`,
      });
    }
  } else {
    // §1.1: 横断駆動以外 → 実 layer 必須 / workflow_phase 禁止
    if (!fm.layer || fm.layer === "cross") {
      ctx.addIssue({
        code: custom,
        path: ["layer"],
        message: `kind=${fm.kind} は実 layer 必須 (cross 不可、§1.1)`,
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

  // §1.10 A: plan_id の駆動トークン ↔ kind 一致 (横断駆動プランの ID legibility、fail-close)
  const driveTok = fm.plan_id.match(/^PLAN-(DISCOVERY|REVERSE|RECOVERY)-/)?.[1];
  if (driveTok && DRIVE_TOKEN_TO_KIND[driveTok] !== fm.kind) {
    ctx.addIssue({
      code: custom,
      path: ["plan_id"],
      message: `plan_id token=${driveTok} は kind=${DRIVE_TOKEN_TO_KIND[driveTok]} のみ (現 kind=${fm.kind}、§1.10 A)`,
    });
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

  // §3.5: kind=poc は scrum_type を S3 以降必須 (S0-S2 は null 可、6 種 = §3.2)
  if (fm.kind === "poc" && (fm.workflow_phase === "S3" || fm.workflow_phase === "S4") && !fm.scrum_type) {
    ctx.addIssue({
      code: custom,
      path: ["scrum_type"],
      message: "kind=poc は workflow_phase S3 以降で scrum_type 必須 (6 種、§3.5 / §3.2)",
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

  // §1.1: kind=add-design は L3-L6 / kind=add-impl は L7 (§1.3 主な layer の fail-close 化、DISCOVERY 起票監査)
  if (fm.kind === "add-design" && fm.layer && !["L3", "L4", "L5", "L6"].includes(fm.layer)) {
    ctx.addIssue({
      code: custom,
      path: ["layer"],
      message: "kind=add-design は layer ∈ {L3,L4,L5,L6} (§1.3 設計追補、§1.1)",
    });
  }
  if (fm.kind === "add-impl" && fm.layer !== "L7") {
    ctx.addIssue({
      code: custom,
      path: ["layer"],
      message: "kind=add-impl は layer=L7 (§1.3 実装追補、§1.1)",
    });
  }
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;
