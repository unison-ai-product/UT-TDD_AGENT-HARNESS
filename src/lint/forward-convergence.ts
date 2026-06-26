/**
 * forward-convergence lint — PLAN-DISCOVERY-08 (poc spike、report-only)。
 *
 * 不変条件 (PO 2026-06-26): Forward (L0-L14 spine) = きれいな最終正本。別フローの最終実態は必ず
 * Forward へ集約 (backprop_decision 経由の合流 / Reverse back-fill) される。未集約の別フローが宙に浮いた
 * まま「Forward freeze = 最終正本成立」と主張してはならない (docs/process/modes/README.md §1/§5/§6.8.8)。
 *
 * SSoT 非重複 (AC-5): 集約義務の既存統制は以下が担う —
 *  - poc (Discovery/Scrum) confirmed   → scrum-reverse.ts (IMP-064)
 *  - add-impl / refactor / retrofit / troubleshoot → backfill-pairing.ts (KIND_BACKFILL)
 * 本 analyzer はそのどちらも見ていない**残ギャップ = kind=impl の spine-外 landed 未集約**のみを担う。
 *
 * report-only (PoC): doctor では surface するが doctor.ok を gate しない。fail-close 昇格と
 * KIND_BACKFILL/freeze gate への接続は S4 ADOPT 後 (規範変更 = concept/requirements 先行、modes README)。
 *
 * 純関数 (analyzeForwardConvergence) + I/O loader (loadConvergenceDocs) を分離 (lint 共通様式)。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseRequires } from "./backfill-pairing";
import { loadRoadmaps } from "./roadmap-registry";
import { parseLinks } from "./scrum-reverse";
import { fmValue } from "./shared";

/** 本 analyzer が収束義務を判定する kind。poc/add-impl 等は別 SSoT が担うため対象外 (二重計上防止)。 */
export const CONVERGENCE_SCOPE_KINDS = new Set<string>(["impl"]);

/** landed = 実装が着地した最終実態 (status 終端のうち実装側)。 */
const LANDED_STATUSES = new Set<string>(["confirmed", "completed"]);

/** backprop_decision のうち「Forward 集約不要」を明示的に成立させる disposition (§6.8.8)。 */
const LOCAL_IMPL_ONLY_DECISIONS = new Set<string>(["local_impl_only", "not_required"]);

export type ConvergenceBucket =
  | "spine-internal"
  | "draft-deferred"
  | "local-impl-only"
  | "converged"
  | "unconverged-landed";

export interface ConvergencePlan {
  plan_id: string;
  kind: string;
  status: string;
  parentDesign: string | null;
  requires: string[];
  backpropDecision: string;
  backpropDecisionReason: string;
}

export interface ConvergenceClassification {
  plan_id: string;
  bucket: ConvergenceBucket;
  reason: string;
}

export interface ForwardConvergenceResult {
  classifications: ConvergenceClassification[];
  /** landed × spine-外 × 未集約 = freeze を塞ぐべき違反候補 (本 spike の baseline)。 */
  unconvergedLanded: string[];
  /** spine-外だが未 landing = 将来作業。違反でなく outstanding として surface する。 */
  draftDeferred: string[];
  /** 明示理由付きで Forward 集約不要と判定された landed (§6.8.8 local_impl_only)。 */
  localImplOnly: string[];
  /** Reverse 合流で Forward へ集約済の landed。 */
  converged: string[];
  /** spine に接続済 (= 既に Forward 降下済) で集約義務なし。 */
  spineInternal: string[];
  /** report-only: ok = 未集約 landed が 0。doctor.ok とは連動させない (PoC)。 */
  ok: boolean;
}

/** parent_design / requires / roadmap span のいずれかで Forward に接続しているか。 */
export function isSpineConnected(plan: ConvergencePlan, roadmapSpanIds: Set<string>): boolean {
  if (roadmapSpanIds.has(plan.plan_id)) return true;
  const pd = plan.parentDesign;
  if (pd && pd !== "null" && pd.includes("docs/design/")) return true;
  // requires が上流設計 PLAN (L1-L6) / design doc を指せば降下接続とみなす。
  return plan.requires.some((r) => /PLAN-L[1-6]-/.test(r) || r.includes("docs/design/"));
}

export function isLanded(plan: ConvergencePlan): boolean {
  return LANDED_STATUSES.has(plan.status);
}

/** 明示 disposition (local_impl_only / 理由付き not_required) で集約不要が成立しているか。 */
export function hasLocalImplOnlyDisposition(plan: ConvergencePlan): boolean {
  if (!LOCAL_IMPL_ONLY_DECISIONS.has(plan.backpropDecision)) return false;
  // not_required は理由必須 (prose 空での免除を許さない、§6.8.8 audit)。
  if (plan.backpropDecision === "not_required") {
    return plan.backpropDecisionReason.trim().length >= 10;
  }
  return true;
}

/**
 * spine-外 impl の Forward 集約状態を分類 (純関数、I/O なし)。
 * @param plans 全 active PLAN
 * @param roadmapSpanIds 登録工程表の span plan_id 集合 (spine 接続判定)
 * @param reverseReferencedIds reverse PLAN が requires/references で指す plan_id 集合 (Reverse 合流判定)
 */
export function analyzeForwardConvergence(
  plans: ConvergencePlan[],
  roadmapSpanIds: Set<string>,
  reverseReferencedIds: Set<string>,
): ForwardConvergenceResult {
  const classifications: ConvergenceClassification[] = [];

  for (const p of plans) {
    if (!CONVERGENCE_SCOPE_KINDS.has(p.kind)) continue;
    if (isSpineConnected(p, roadmapSpanIds)) {
      classifications.push({
        plan_id: p.plan_id,
        bucket: "spine-internal",
        reason: "parent_design / requires / roadmap span で Forward に接続済",
      });
      continue;
    }
    if (!isLanded(p)) {
      classifications.push({
        plan_id: p.plan_id,
        bucket: "draft-deferred",
        reason: `spine-外だが未 landing (status=${p.status})。将来作業 = outstanding`,
      });
      continue;
    }
    if (hasLocalImplOnlyDisposition(p)) {
      classifications.push({
        plan_id: p.plan_id,
        bucket: "local-impl-only",
        reason: `backprop_decision=${p.backpropDecision} で Forward 集約不要を明示`,
      });
      continue;
    }
    if (reverseReferencedIds.has(p.plan_id)) {
      classifications.push({
        plan_id: p.plan_id,
        bucket: "converged",
        reason: "Reverse PLAN が requires/references で参照 = Forward 合流済",
      });
      continue;
    }
    classifications.push({
      plan_id: p.plan_id,
      bucket: "unconverged-landed",
      reason: "landed × spine-外 × backprop_decision/Reverse 合流なし = Forward 未集約",
    });
  }

  const pick = (b: ConvergenceBucket): string[] =>
    classifications.filter((c) => c.bucket === b).map((c) => c.plan_id);
  const unconvergedLanded = pick("unconverged-landed");
  return {
    classifications,
    unconvergedLanded,
    draftDeferred: pick("draft-deferred"),
    localImplOnly: pick("local-impl-only"),
    converged: pick("converged"),
    spineInternal: pick("spine-internal"),
    ok: unconvergedLanded.length === 0,
  };
}

export interface ConvergenceDocs {
  plans: ConvergencePlan[];
  roadmapSpanIds: Set<string>;
  reverseReferencedIds: Set<string>;
}

/** PLAN を ConvergencePlan へ parse (SSoT: requires は backfill-pairing.parseRequires を再利用)。 */
export function parseConvergencePlan(file: string, content: string): ConvergencePlan {
  return {
    plan_id: fmValue(content, "plan_id") ?? file.replace(/\.md$/, ""),
    kind: fmValue(content, "kind") ?? "unknown",
    status: fmValue(content, "status") ?? "unknown",
    parentDesign: fmValue(content, "parent_design") ?? null,
    requires: parseRequires(content),
    backpropDecision: fmValue(content, "backprop_decision") ?? "",
    backpropDecisionReason: fmValue(content, "backprop_decision_reason") ?? "",
  };
}

/** 末尾 `/id.md` / `id.md` / `id` を plan_id へ正規化。 */
function normalizeRef(ref: string): string {
  const base = ref.replaceAll("\\", "/").split("/").at(-1) ?? ref;
  return base.endsWith(".md") ? base.slice(0, -3) : base;
}

export function loadConvergenceDocs(repoRoot: string = process.cwd()): ConvergenceDocs {
  const plansDir = join(repoRoot, "docs", "plans");
  const plans: ConvergencePlan[] = [];
  const reverseReferencedIds = new Set<string>();
  for (const f of readdirSync(plansDir)) {
    if (!f.endsWith(".md")) continue;
    const content = readFileSync(join(plansDir, f), "utf8");
    const plan = parseConvergencePlan(f, content);
    if (plan.status === "archived") continue;
    plans.push(plan);
    // reverse PLAN が requires/references で指す plan_id を集約 (SSoT: scrum-reverse.parseLinks)。
    if (plan.kind === "reverse") {
      for (const link of parseLinks(content)) reverseReferencedIds.add(normalizeRef(link));
    }
  }
  const roadmapSpanIds = new Set<string>();
  for (const rec of loadRoadmaps(repoRoot)) {
    for (const span of rec.roadmap.spans) roadmapSpanIds.add(span.plan_id);
  }
  return { plans, roadmapSpanIds, reverseReferencedIds };
}

/** doctor / CLI 向け surface (report-only。doctor.ok は gate しない、PoC)。 */
export function forwardConvergenceMessages(result: ForwardConvergenceResult): string[] {
  const tail =
    `spine-internal ${result.spineInternal.length} / converged ${result.converged.length} / ` +
    `local-impl-only ${result.localImplOnly.length} / draft-deferred ${result.draftDeferred.length}`;
  if (result.ok) {
    return [`forward-convergence — OK (未集約 landed impl 0; ${tail}) [report-only, PoC]`];
  }
  return [
    `forward-convergence — ⚠ 未集約 landed impl ${result.unconvergedLanded.length} 件 ` +
      `(${result.unconvergedLanded.join(", ")}): spine-外で Forward 集約 (backprop_decision / Reverse 合流) 未。` +
      `${tail} [report-only — S4 ADOPT で fail-close 接続、PLAN-DISCOVERY-08]`,
  ];
}
