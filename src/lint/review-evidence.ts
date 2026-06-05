/**
 * review-evidence lint — review 前置 (cross-agent / intra_runtime_subagent / human) の機械強制 (IMP-071)。
 *
 * 背景: review 前置 MUST (CLAUDE.md / requirements §7.8.7 / concept §2.1.2.1) は doc-only で、
 * src に機械強制が無く plan lint=stub・doctor 非検査のため、freeze (status→confirmed) / commit が
 * review 証跡ゼロで素通りできた (harness 自身が柱 2「doc×機械厳格化」を自分のレビュー規律で破る
 * under-design を実証 = §3.6 追補を review スキップで freeze した事故)。concept §2.1.2.1 は
 * 「review 記録が無ければ gate を exit 1」と機械ゲート設計済だが未実装だった穴を塞ぐ。
 *
 * 設計: design/impl/add-* PLAN が confirmed (gate/freeze 到達) なのに frontmatter `review_evidence` を
 * 持たない場合に surface する (既定 warn-first、fail-close 化は実 repo back-fill 完了後)。
 * 純関数 (analyze) + I/O loader を分離 (backfill-pairing / vmodel-pair と同方針)。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * review 前置 MUST の対象 kind (§1.8 / requirements §7.8.7)。
 * 設計・実装系は gate/freeze (confirmed) 前に review 前置が必須 (cross-agent or intra_runtime_subagent)。
 * charter/poc/reverse/recovery/troubleshoot/refactor/retrofit/research は本 lint の hard 対象外
 * (review 推奨だが confirmed=gate 到達の MUST 対象は設計/実装の凍結に限定、過検知を避ける)。
 */
export const KIND_REVIEW_REQUIRED = new Set<string>(["design", "add-design", "impl", "add-impl"]);

/** review_evidence を要求する status (gate/freeze 到達点)。draft は未確定なので対象外。 */
export const STATUS_REVIEW_REQUIRED = new Set<string>(["confirmed", "completed"]);

export interface ParsedReviewPlan {
  file: string;
  plan_id: string;
  kind: string;
  status: string;
  /** frontmatter に review_evidence の entry が 1 件以上あるか。 */
  hasEvidence: boolean;
}

export interface ReviewEvidenceResult {
  /** confirmed/completed の design/impl 系なのに review_evidence が無い PLAN。 */
  missing: { plan_id: string; kind: string }[];
  ok: boolean;
}

const fmValue = (content: string, key: string): string | undefined =>
  content.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]?.trim();

/**
 * frontmatter に `review_evidence:` ブロックが存在し ≥1 entry (`- reviewer:`) を持つか判定。
 * presence 検出のみ (shape 検証は zod frontmatterSchema が担う)。
 */
export function hasReviewEvidence(content: string): boolean {
  return /^review_evidence:\s*\n\s+-\s+reviewer:/m.test(content);
}

export function parseReviewPlan(file: string, content: string): ParsedReviewPlan {
  return {
    file,
    plan_id: fmValue(content, "plan_id") ?? file.replace(/\.md$/, ""),
    kind: fmValue(content, "kind") ?? "unknown",
    status: fmValue(content, "status") ?? "unknown",
    hasEvidence: hasReviewEvidence(content),
  };
}

/**
 * review 前置証跡の完全性を分析。
 * @param plans 全 PLAN (archived は内部で除外)
 */
export function analyzeReviewEvidence(plans: ParsedReviewPlan[]): ReviewEvidenceResult {
  const missing: { plan_id: string; kind: string }[] = [];
  for (const p of plans) {
    if (p.status === "archived") continue;
    if (!KIND_REVIEW_REQUIRED.has(p.kind)) continue;
    if (!STATUS_REVIEW_REQUIRED.has(p.status)) continue;
    if (p.hasEvidence) continue;
    missing.push({ plan_id: p.plan_id, kind: p.kind });
  }
  return { missing, ok: missing.length === 0 };
}

/** docs/plans/*.md (archive/template 除く) を読み込む。 */
export function loadReviewPlans(repoRoot: string = process.cwd()): ParsedReviewPlan[] {
  const plansDir = join(repoRoot, "docs", "plans");
  const plans: ParsedReviewPlan[] = [];
  for (const f of readdirSync(plansDir)) {
    // PLAN-*.md のみ対象。サブディレクトリ (archive/_template) は readdirSync が拡張子なし
    // エントリで返すため `.md` 判定で除外されるが、念のため `PLAN-` prefix も明示ガードする
    // (archive 等に PLAN-*.md を直接置いた場合の誤 pickup 防止、backfill-pairing と同等の堅牢性)。
    if (!f.endsWith(".md") || !f.startsWith("PLAN-")) continue;
    plans.push(parseReviewPlan(f, readFileSync(join(plansDir, f), "utf8")));
  }
  return plans;
}

/** doctor / CLI 向けの 1 行サマリ群を返す (warn-first、ok は呼び出し側で参照)。 */
export function reviewEvidenceMessages(result: ReviewEvidenceResult): string[] {
  if (result.missing.length === 0) {
    return ["review-evidence — OK (confirmed design/impl PLAN は全件 review_evidence あり)"];
  }
  const ids = result.missing.map((m) => m.plan_id).join(", ");
  return [
    `review-evidence — ⚠ review 前置証跡なしで confirmed の design/impl PLAN ${result.missing.length} 件 (${ids}): frontmatter review_evidence に reviewer/review_kind/verdict を記録 (review 前置 MUST、IMP-071)`,
  ];
}
