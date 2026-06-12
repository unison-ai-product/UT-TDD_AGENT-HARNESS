/**
 * backfill-pairing lint — 駆動モデルが「設計ドキュメントまで戻す (back-fill)」ことの完全性検証 (IMP-051)。
 *
 * 背景: Add-feature 等の bottom-up 駆動で実装 (②) した後、上位設計/governance への Reverse 合流 +
 * §6 用語更新の L0 §10 用語集 back-merge を agent 記憶に頼ると漏れる (本 harness 開発で実証)。
 * V-model pair 完全性 ([[feedback_vmodel_state_db_completeness]]) を impl⇔Reverse / impl⇔glossary へ拡張し、
 * 「Reverse 無き impl」「glossary 未 merge な PLAN」を機械が surface する (既定 fail-close、fail-close 化は段階)。
 *
 * 純関数 (analyze*) + I/O loader を分離 (fr-registry-audit / doc-consistency と同方針)。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fmValue } from "./shared";

/** 駆動モデル (kind) → back-fill (設計ドキュメントへ戻す) 要否。 */
export type BackfillReq = "required" | "conditional" | "none";

/**
 * kind → back-fill 要否マトリクス (駆動モデル整理の正本)。
 * - required: bottom-up build。対応 Reverse 合流が無いと孤児 (add-impl = Add-feature)。
 * - conditional: 契約/挙動を変えたときのみ Reverse 要 (人間判断、warn にとどめる)。
 * - none: 上流で①設計凍結済 (forward impl/design) / back-fill そのもの (reverse/recovery) / 探索 (poc)。
 */
export const KIND_BACKFILL: Record<string, BackfillReq> = {
  "add-impl": "required",
  refactor: "conditional",
  retrofit: "conditional",
  troubleshoot: "conditional",
  impl: "none",
  design: "none",
  "add-design": "none",
  charter: "none",
  poc: "none",
  reverse: "none",
  recovery: "none",
};

export interface ParsedPlan {
  file: string;
  plan_id: string;
  kind: string;
  status: string;
  /** dependencies.requires の path 群 (Reverse が impl を requires する向きを辿る)。 */
  requires: string[];
  /** §6 用語更新 で宣言された用語 (太字 **term** の先頭)。 */
  glossaryTerms: string[];
}

export interface BackfillResult {
  /** back-fill required (add-impl 等) なのに requires する Reverse PLAN が無い (status≠archived)。 */
  reverseOrphans: { plan_id: string; kind: string }[];
  /** conditional kind で Reverse 未リンク (人間判断推奨、warn)。 */
  conditionalPending: { plan_id: string; kind: string }[];
  /** §6 用語更新 で宣言したが L0 §10 用語集に未 merge な (plan_id, term)。 */
  glossaryGaps: { plan_id: string; term: string }[];
  ok: boolean;
}

/** 複合ラベルの先頭コア語を取り出す (" / " / " (" / "（" 手前まで)。glossary 照合の表記ゆれ吸収。 */
export function normalizeTerm(term: string): string {
  return term.split(/\s*\/\s*|\s*[(（]/)[0].trim();
}

/** dependencies.requires の YAML list (各行 `    - <path>`) を抽出。 */
export function parseRequires(content: string): string[] {
  const m = content.match(/^\s*requires:\s*\n((?:\s+-\s+.+\n?)*)/m);
  if (!m) return [];
  return [...m[1].matchAll(/-\s+(.+?)\s*$/gm)].map((x) => x[1]).filter((s) => s && s !== "[]");
}

/** §6 用語更新 section の太字用語 (`- **term**: ...` の term) を抽出。 */
export function parseGlossaryTerms(content: string): string[] {
  // §6 用語更新 見出し以降〜次の見出し or EOF を section とする。
  // 注: /m を付けず `$` を文字列末尾の意味で使う (/m だと `$` が行末になり section が空になる)。
  const sec = content.match(/(?:^|\n)#{2,}\s*§?6[^\n]*用語更新[^\n]*\n([\s\S]*?)(?=\n#{1,6}\s|$)/);
  if (!sec) return [];
  return [...sec[1].matchAll(/^\s*-\s*\*\*(.+?)\*\*/gm)].map((x) => x[1].trim());
}

export function parsePlan(file: string, content: string): ParsedPlan {
  return {
    file,
    plan_id: fmValue(content, "plan_id") ?? file.replace(/\.md$/, ""),
    kind: fmValue(content, "kind") ?? "unknown",
    status: fmValue(content, "status") ?? "unknown",
    requires: parseRequires(content),
    glossaryTerms: parseGlossaryTerms(content),
  };
}

/**
 * back-fill 完全性を分析。
 * @param plans 全 PLAN (archived/template は呼び出し側で除外済を想定)
 * @param glossaryText L0 §10 用語集本文 (term 実在の照合先)
 */
export function analyzeBackfill(plans: ParsedPlan[], glossaryText: string): BackfillResult {
  const active = plans.filter((p) => p.status !== "archived");
  // Reverse PLAN が requires する path 集合 (この impl は誰かに back-fill されているか)。
  const reverseRequires = new Set<string>();
  for (const p of active) {
    if (p.kind !== "reverse") continue;
    for (const r of p.requires) reverseRequires.add(r);
  }
  // path 末尾一致は「/」境界 or 完全一致のみ許す (別 plan_id の suffix 誤マッチを防ぐ。
  // 例 `PLAN-L7-1` が `.../PLAN-X-L7-1.md` に部分一致しないよう `/`+id+`.md` で固定)。
  const isBackfilled = (plan: ParsedPlan): boolean =>
    [...reverseRequires].some(
      (r) => r.endsWith(`/${plan.plan_id}.md`) || r === `${plan.plan_id}.md` || r === plan.plan_id,
    );

  const reverseOrphans: { plan_id: string; kind: string }[] = [];
  const conditionalPending: { plan_id: string; kind: string }[] = [];
  for (const p of active) {
    const req = KIND_BACKFILL[p.kind] ?? "none";
    if (req === "none") continue;
    if (isBackfilled(p)) continue;
    if (req === "required") reverseOrphans.push({ plan_id: p.plan_id, kind: p.kind });
    else conditionalPending.push({ plan_id: p.plan_id, kind: p.kind });
  }

  const glossaryGaps: { plan_id: string; term: string }[] = [];
  for (const p of active) {
    for (const term of p.glossaryTerms) {
      // 複合ラベル ("agent-slot / peak_parallel"、"handover discipline (規律) surface") は
      // 区切り (" / " / "(" / "（") 前のコア語で照合し表記ゆれを吸収する。
      const core = normalizeTerm(term);
      if (!glossaryText.includes(core)) glossaryGaps.push({ plan_id: p.plan_id, term });
    }
  }

  // ok = required orphan と glossary gap が無いこと (conditional は warn のみで ok を落とさない)。
  return {
    reverseOrphans,
    conditionalPending,
    glossaryGaps,
    ok: reverseOrphans.length === 0 && glossaryGaps.length === 0,
  };
}

export interface BackfillDocs {
  plans: ParsedPlan[];
  glossaryText: string;
}

/** docs/plans/*.md (archive/template 除く) + concept §10 用語集 を読み込む。 */
export function loadBackfillDocs(repoRoot: string = process.cwd()): BackfillDocs {
  const plansDir = join(repoRoot, "docs", "plans");
  const plans: ParsedPlan[] = [];
  for (const f of readdirSync(plansDir)) {
    if (!f.endsWith(".md")) continue;
    plans.push(parsePlan(f, readFileSync(join(plansDir, f), "utf8")));
  }
  const concept = readFileSync(
    join(repoRoot, "docs", "governance", "ut-tdd-agent-harness-concept_v3.1.md"),
    "utf8",
  );
  const glossaryText = concept.match(/#\s*§10[\s\S]*?(?=\n#\s*§11|$)/)?.[0] ?? concept;
  return { plans, glossaryText };
}

/** doctor / CLI 向けの 1 行サマリ群を返す (fail-close、ok は呼び出し側で参照)。 */
export function backfillMessages(result: BackfillResult): string[] {
  const msgs: string[] = [];
  if (result.reverseOrphans.length > 0) {
    const ids = result.reverseOrphans.map((o) => o.plan_id).join(", ");
    msgs.push(
      `backfill — ⚠ Reverse 無き impl ${result.reverseOrphans.length} 件 (${ids}): Add-feature は L7 実装後 Reverse 合流が必須 (IMP-051)`,
    );
  }
  if (result.glossaryGaps.length > 0) {
    const gaps = result.glossaryGaps.map((g) => `${g.term}(${g.plan_id})`).join(", ");
    msgs.push(
      `backfill — ⚠ §6 用語更新 が L0 §10 へ未 merge ${result.glossaryGaps.length} 件 (${gaps}): living glossary back-merge を実施`,
    );
  }
  if (result.conditionalPending.length > 0) {
    const ids = result.conditionalPending.map((o) => o.plan_id).join(", ");
    msgs.push(
      `backfill — note: 契約変更があれば Reverse 要の conditional kind ${result.conditionalPending.length} 件 (${ids}) を確認`,
    );
  }
  if (msgs.length === 0) msgs.push("backfill — OK (Reverse 孤児 0 / glossary merge 済)");
  return msgs;
}
