import type { HarnessDb } from "../state-db/index";
import { upsertRow } from "../state-db/index";

export interface PlanSkillContext {
  plan_id: string;
  layer: string;
  drive: string;
  kind: string;
  status: string;
}

export interface SkillRecommendation {
  skill_recommendation_id: string;
  session_id: string;
  plan_id: string;
  skill_id: string;
  rank: number;
  score: number;
  reason: string;
  recommended_at: string;
}

export interface SkillInvocation {
  skill_invocation_id: string;
  session_id: string;
  plan_id: string;
  skill_id: string;
  layer: string;
  drive: string;
  fired_at: string;
  source: string;
  accepted: number;
}

function stableId(prefix: string, value: string): string {
  return `${prefix}:${value.replace(/[^A-Za-z0-9._:-]+/g, "-")}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function workflowModeForPlan(planId: string): string {
  if (planId.startsWith("PLAN-DISCOVERY-")) return "Discovery";
  if (planId.startsWith("PLAN-REVERSE-") || /REVERSE/i.test(planId)) return "Reverse";
  if (planId.startsWith("PLAN-RECOVERY-") || /RECOVERY/i.test(planId)) return "Recovery";
  if (/SCRUM/i.test(planId)) return "Scrum";
  if (/INCIDENT/i.test(planId)) return "Incident";
  if (/REFACTOR/i.test(planId)) return "Refactor";
  if (/RETROFIT/i.test(planId)) return "Retrofit";
  if (/RESEARCH/i.test(planId)) return "Research";
  return "Forward";
}

function scoreSkill(plan: PlanSkillContext, asset: Record<string, unknown>): number {
  const text = [
    asset.asset_id,
    asset.path,
    asset.trigger,
    asset.role,
    asset.capability,
    asset.skill_type,
    asset.applies_layers,
    asset.applies_drive_models,
  ]
    .join(" ")
    .toLowerCase();
  const appliesLayers = String(asset.applies_layers ?? "")
    .split(",")
    .filter(Boolean);
  const appliesDriveModels = String(asset.applies_drive_models ?? "")
    .split(",")
    .filter(Boolean);
  const workflowMode = workflowModeForPlan(plan.plan_id);
  let score = 0.2;
  if (appliesLayers.includes(plan.layer)) score += 0.35;
  if (appliesDriveModels.includes(workflowMode)) score += 0.35;
  if (text.includes(plan.drive.toLowerCase())) score += 0.1;
  if (/review|checklist|quality|test|lint/.test(text)) score += 0.25;
  if (/skill/.test(String(asset.asset_type ?? ""))) score += 0.1;
  return Math.min(1, Number(score.toFixed(2)));
}

export function recommendSkillsForPlan(
  db: HarnessDb,
  planId: string,
  options: { limit?: number; recordedAt?: string } = {},
): SkillRecommendation[] {
  const plan = db
    .prepare("SELECT plan_id, layer, drive, kind, status FROM plan_registry WHERE plan_id = ?")
    .get(planId) as PlanSkillContext | undefined;
  if (!plan) return [];
  const assets = db
    .prepare("SELECT * FROM automation_assets WHERE asset_type = ? ORDER BY asset_id")
    .all("skill");
  const recommendedAt = options.recordedAt ?? nowIso();
  return assets
    .map((asset) => ({
      asset,
      score: scoreSkill(plan, asset),
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        String(a.asset.asset_id ?? "").localeCompare(String(b.asset.asset_id ?? "")),
    )
    .slice(0, options.limit ?? 5)
    .map((entry, index) => {
      const skillId = String(entry.asset.asset_id ?? "");
      return {
        skill_recommendation_id: stableId("skill-rec", `${planId}:${skillId}`),
        session_id: "",
        plan_id: planId,
        skill_id: skillId,
        rank: index + 1,
        score: entry.score,
        reason: `layer=${plan.layer}; technical_drive=${plan.drive}; drive_model=${workflowModeForPlan(plan.plan_id)}; kind=${plan.kind}`,
        recommended_at: recommendedAt,
      };
    });
}

export function recordSkillRecommendations(
  db: HarnessDb,
  recommendations: SkillRecommendation[],
): void {
  for (const recommendation of recommendations) {
    upsertRow(db, {
      table: "skill_recommendations",
      primaryKey: "skill_recommendation_id",
      row: { ...recommendation },
    });
  }
}

export function inferSkillInvocations(
  db: HarnessDb,
  recommendations: SkillRecommendation[],
  options: { firedAt?: string } = {},
): SkillInvocation[] {
  const firedAt = options.firedAt ?? nowIso();
  const invocations: SkillInvocation[] = [];
  for (const rec of recommendations) {
    const plan = db
      .prepare("SELECT layer, drive FROM plan_registry WHERE plan_id = ?")
      .get(rec.plan_id) as { layer?: string; drive?: string } | undefined;
    const review = db
      .prepare("SELECT has_evidence FROM review_evidence_registry WHERE plan_id = ?")
      .get(rec.plan_id) as { has_evidence?: number } | undefined;
    const accepted = Number(review?.has_evidence ?? 0) === 1 ? 1 : 0;
    if (!accepted) continue;
    invocations.push({
      skill_invocation_id: stableId("skill-inv", `${rec.plan_id}:${rec.skill_id}:review`),
      session_id: rec.session_id,
      plan_id: rec.plan_id,
      skill_id: rec.skill_id,
      layer: String(plan?.layer ?? ""),
      drive: String(plan?.drive ?? ""),
      fired_at: firedAt,
      source: "auto-projection:review-evidence",
      accepted,
    });
  }
  return invocations;
}

export function recordSkillInvocations(db: HarnessDb, invocations: SkillInvocation[]): void {
  for (const invocation of invocations) {
    upsertRow(db, {
      table: "skill_invocations",
      primaryKey: "skill_invocation_id",
      row: { ...invocation },
    });
  }
}
