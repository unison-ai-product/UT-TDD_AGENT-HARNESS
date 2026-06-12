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
 * 持たない場合に surface する。**hard 判定** (ok=false → doctor fail-close、IMP-071 hard 化 2026-06-05。
 * 実 repo 履歴 15 件 back-fill 完了 = missing 0 安定を確認後に hard 昇格)。
 * 純関数 (analyze) + I/O loader を分離 (backfill-pairing / vmodel-pair と同方針)。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { fmValue } from "./shared";

/**
 * review 前置 MUST の対象 kind (§1.8 / requirements §7.8.7)。
 * 設計・実装系は gate/freeze (confirmed) 前に review 前置が必須 (cross-agent or intra_runtime_subagent)。
 * charter/poc/reverse/recovery/troubleshoot/refactor/retrofit/research は本 lint の hard 対象外
 * (review 推奨だが confirmed=gate 到達の MUST 対象は設計/実装の凍結に限定、過検知を避ける)。
 */
export const KIND_REVIEW_REQUIRED = new Set<string>(["design", "add-design", "impl", "add-impl"]);

/** review_evidence を要求する status (gate/freeze 到達点)。draft は未確定なので対象外。 */
export const STATUS_REVIEW_REQUIRED = new Set<string>(["confirmed", "completed"]);

/** review_evidence の 1 entry (cross-review semantic IMP-076 + test→review 順序 IMP-077 検査に必要な部分)。 */
export interface ReviewEntry {
  review_kind: string;
  verdict?: string;
  reviewed_at?: string;
  /** 定量検証 (vitest/doctor/lint) green 時刻。tests_green_at ≤ reviewed_at が不変条件 (IMP-077)。 */
  tests_green_at?: string;
  worker_model?: string;
  reviewer_model?: string;
}

export interface ParsedReviewPlan {
  file: string;
  plan_id: string;
  kind: string;
  status: string;
  /** frontmatter に review_evidence の entry が 1 件以上あるか。 */
  hasEvidence: boolean;
  /** review_evidence entry 群 (cross_agent distinctness 検査用、IMP-076)。 */
  crossEntries: ReviewEntry[];
}

export interface ReviewEvidenceResult {
  /** confirmed/completed の design/impl 系なのに review_evidence が無い PLAN。 */
  missing: { plan_id: string; kind: string }[];
  /** cross_agent を称するが worker と reviewer の model が同一/欠落の entry (same_model_approval 違反、IMP-076)。 */
  crossReviewViolations: { plan_id: string; reason: string }[];
  /** 定量テスト→定性レビュー順序違反 (tests_green_at 欠落 or > reviewed_at、全駆動モデル普遍、IMP-077)。 */
  testBeforeReviewViolations: { plan_id: string; reason: string }[];
  staleApprovalViolations: { plan_id: string; reason: string }[];
  ok: boolean;
}

/**
 * frontmatter に `review_evidence:` ブロックが存在し ≥1 entry (`- reviewer:`) を持つか判定。
 * presence 検出のみ (shape 検証は zod frontmatterSchema が担う)。
 */
export function hasReviewEvidence(content: string): boolean {
  return /^review_evidence:\s*\n\s+-\s+reviewer:/m.test(content);
}

/**
 * frontmatter (最初の `---` ブロック) を yaml で解析し review_evidence entry を抽出 (IMP-076)。
 * presence 検出の正規表現とは別に、cross_agent distinctness 検査のため entry レベルで読む。
 * parse 失敗 / review_evidence 不在は entry なしとして扱う。
 * 必須PLANの evidence 欠落は analyzeReviewEvidence 側で violation 化する。
 */
export function extractReviewEntries(content: string): ReviewEntry[] {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return [];
  try {
    const fm = parseYaml(m[1]) as { review_evidence?: unknown };
    const ev = fm?.review_evidence;
    if (!Array.isArray(ev)) return [];
    return ev
      .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
      .map((e) => {
        const entry: ReviewEntry = {
          review_kind: typeof e.review_kind === "string" ? e.review_kind : "",
        };
        if (typeof e.verdict === "string") entry.verdict = e.verdict;
        if (typeof e.reviewed_at === "string") entry.reviewed_at = e.reviewed_at;
        if (typeof e.tests_green_at === "string") entry.tests_green_at = e.tests_green_at;
        if (typeof e.worker_model === "string") entry.worker_model = e.worker_model;
        if (typeof e.reviewer_model === "string") entry.reviewer_model = e.reviewer_model;
        return entry;
      });
  } catch {
    return [];
  }
}

export function parseReviewPlan(file: string, content: string): ParsedReviewPlan {
  return {
    file,
    plan_id: fmValue(content, "plan_id") ?? file.replace(/\.md$/, ""),
    kind: fmValue(content, "kind") ?? "unknown",
    status: fmValue(content, "status") ?? "unknown",
    hasEvidence: hasReviewEvidence(content),
    crossEntries: extractReviewEntries(content),
  };
}

/**
 * review 前置証跡の完全性を分析。
 * - missing: confirmed/completed の design/impl 系で review_evidence 不在 (presence、IMP-071)
 * - crossReviewViolations: cross_agent を称すが worker≡reviewer の同一 model / 欠落 (same_model_approval、IMP-076)。
 *   単体 runtime は相異 model を供給できないため cross_agent を僭称できない (concept §2.1.2.1 核心ルール 1/2 を静的担保)。
 * @param plans 全 PLAN (archived は内部で除外)
 */
export function analyzeReviewEvidence(plans: ParsedReviewPlan[]): ReviewEvidenceResult {
  const missing: { plan_id: string; kind: string }[] = [];
  const crossReviewViolations: { plan_id: string; reason: string }[] = [];
  const testBeforeReviewViolations: { plan_id: string; reason: string }[] = [];
  const staleApprovalViolations: { plan_id: string; reason: string }[] = [];
  for (const p of plans) {
    if (p.status === "archived") continue;
    // presence (IMP-071)
    if (
      KIND_REVIEW_REQUIRED.has(p.kind) &&
      STATUS_REVIEW_REQUIRED.has(p.status) &&
      !p.hasEvidence
    ) {
      missing.push({ plan_id: p.plan_id, kind: p.kind });
    }
    // cross_agent distinctness (IMP-076、kind/status 非依存 = cross_agent を称する全 entry が対象)
    for (const e of p.crossEntries ?? []) {
      if (e.review_kind !== "cross_agent") continue;
      if (!e.worker_model || !e.reviewer_model || e.worker_model === e.reviewer_model) {
        crossReviewViolations.push({ plan_id: p.plan_id, reason: "same_model_or_missing" });
        break; // 1 PLAN 1 violation で十分 (surface 目的)
      }
    }
    if (!STATUS_REVIEW_REQUIRED.has(p.status)) {
      const hasApproval = (p.crossEntries ?? []).some((e) =>
        /^(approve|approve_after_fixes|pass)$/i.test(e.verdict ?? ""),
      );
      if (hasApproval) {
        staleApprovalViolations.push({ plan_id: p.plan_id, reason: "draft_with_approval" });
      }
    }
    // test→review 順序 (IMP-077、全駆動モデル普遍 = review_evidence を持つ全 entry が対象)。
    // confirmed/completed の review_evidence entry は定量テスト green 後にレビューされたこと (tests_green_at ≤ reviewed_at) を要求。
    if (STATUS_REVIEW_REQUIRED.has(p.status)) {
      for (const e of p.crossEntries ?? []) {
        if (!e.tests_green_at) {
          testBeforeReviewViolations.push({ plan_id: p.plan_id, reason: "missing_tests_green_at" });
          break;
        }
        if (e.reviewed_at && e.tests_green_at > e.reviewed_at) {
          testBeforeReviewViolations.push({ plan_id: p.plan_id, reason: "review_before_test" });
          break;
        }
      }
    }
  }
  return {
    missing,
    crossReviewViolations,
    testBeforeReviewViolations,
    staleApprovalViolations,
    ok:
      missing.length === 0 &&
      crossReviewViolations.length === 0 &&
      testBeforeReviewViolations.length === 0 &&
      staleApprovalViolations.length === 0,
  };
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

/** doctor / CLI 向けの 1 行サマリ群を返す (ok は呼び出し側で参照、hard 判定)。 */
export function reviewEvidenceMessages(result: ReviewEvidenceResult): string[] {
  if (
    result.missing.length === 0 &&
    result.crossReviewViolations.length === 0 &&
    result.testBeforeReviewViolations.length === 0 &&
    result.staleApprovalViolations.length === 0
  ) {
    return [
      "review-evidence — OK (review_evidence あり / cross_agent は worker≠reviewer / 定量テスト→定性レビュー順序 tests_green_at≤reviewed_at)",
    ];
  }
  const out: string[] = [];
  if (result.missing.length > 0) {
    const ids = result.missing.map((m) => m.plan_id).join(", ");
    out.push(
      `review-evidence — ⚠ review 前置証跡なしで confirmed の design/impl PLAN ${result.missing.length} 件 (${ids}): frontmatter review_evidence に reviewer/review_kind/verdict を記録 (review 前置 MUST、IMP-071)`,
    );
  }
  if (result.crossReviewViolations.length > 0) {
    const ids = result.crossReviewViolations.map((v) => v.plan_id).join(", ");
    out.push(
      `review-evidence — ⚠ cross_agent review なのに worker≡reviewer の同一 model / model 欠落 ${result.crossReviewViolations.length} 件 (${ids}): same_model_approval 違反 (concept §2.1.2.1)。worker_model ≠ reviewer_model を記録 (IMP-076)`,
    );
  }
  if (result.testBeforeReviewViolations.length > 0) {
    const ids = result.testBeforeReviewViolations.map((v) => v.plan_id).join(", ");
    out.push(
      `review-evidence — ⚠ 定量テスト→定性レビュー順序違反 ${result.testBeforeReviewViolations.length} 件 (${ids}): tests_green_at 欠落 or > reviewed_at。定量テスト green 後にレビュー (全駆動モデル普遍、IMP-077)`,
    );
  }
  if (result.staleApprovalViolations.length > 0) {
    const ids = result.staleApprovalViolations.map((v) => v.plan_id).join(", ");
    out.push(
      `review-evidence — ⚠ draft/降格 PLAN に approve/pass 系 review_evidence が残存 ${result.staleApprovalViolations.length} 件 (${ids}): un-freeze 残骸を削除 (IMP-080)`,
    );
  }
  return out;
}
