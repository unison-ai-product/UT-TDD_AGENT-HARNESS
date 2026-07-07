---
plan_id: PLAN-L7-315-scope-integrity-gate
title: "PLAN-L7-315 (impl): scope integrity gate — スコープの無宣言縮小を fail-close し waiver を正規化する"
kind: impl
layer: L7
drive: be
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - waiver 承認権限の設計確認と v2 活性化時期"
  - role: tl
    slot_label: "TL - scope digest の対象範囲 (DoD/スコープ節) と freeze 接続のレビュー"
  - role: se
    slot_label: "SE - digest 照合 lint + 変更宣言 + waiver 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-315-scope-integrity-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/governance/scope-integrity-and-evasion-taxonomy.md
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/plans/PLAN-L7-242-mode-exit-enforcement-batch.md
    - docs/plans/PLAN-L7-304-plan-pending-decision-gate.md
---

# PLAN-L7-315 (impl): scope integrity gate

## Status

**version-up parked (v2)**。PO 指示 (2026-07-03)「勝手にスコープを下げさせない・矮小化を防ぐ」。分類正本 = `docs/governance/scope-integrity-and-evasion-taxonomy.md` (同日着地) の B4 (穴 #1) と A3 (waiver 不在 = 穴 #5) を塞ぐ。(採番注記: 当初 L7-314 で起票したが同日 Codex が PLAN-L7-314-plan-reference-freshness-advisory を先に使用したため 315 へ改番 — 同日 2 度目の番号衝突であり、L7-256 スコープ(d) 番号一意性 fail-close の優先度を裏付ける実例。)

## 背景

工程の 7 つの瞬間 (taxonomy §1) のうち「#3 実装中のスコープ無宣言変更」だけ検出器が無い。DoD 項目の削除・スコープ節の縮小・「非対象」の後付け拡大は git diff にしか現れず、review が見落とせば素通りする。さらに正規の免除手段 (waiver) が存在しないため、「やらない判断」が DoD 削除 (= 非許容回避 B4) として現れる構造誘因がある — **逃し弁の不在が違反を生む**。

## スコープ (1 要件: 起票確定後のスコープ変更を「宣言 + 承認 + 記録」なしに通さない)

1. **scope digest**: PLAN が draft を離脱する時点 (= 実装開始の確定点) で、DoD checkbox 群 + スコープ節本文の正規化 hash を frontmatter `scope_digest` に刻印 (`ut-tdd plan freeze-scope <plan_id>`、状態遷移フローに組み込み)。
2. **縮小検出 lint** (`src/plan/lint.ts` に checkScopeIntegrity): scope_digest を持つ PLAN で (a) DoD checkbox の**削除・文言変更** (b) スコープ節の hash 不一致 を検出。不一致時は `scope_change:` 宣言が無ければ **fail-close** (`scope_integrity_violation`)。追加 (DoD 増・スコープ拡大) は宣言推奨だが fail にしない (縮小方向のみ硬く — 矮小化対策の非対称設計)。
3. **scope_change 宣言**: `{ date, kind: reduce|expand|reword, reason, approved_by }` を frontmatter に追記し、digest を再刻印。approved_by は縮小時 PO または TL 必須。宣言は append-only (過去宣言の削除も digest 不一致で検出される)。
4. **waiver 機構 (A3 の新設)**: DoD 項目を消さずに `- [~] <本文> (waived: <reason> / <approver> / <date>)` と刻む記法を導入。plan-dod は waived を「消化済み扱いだが完了実体なし」として集計に区別表示 (完了率の粉飾を防ぐ)。空 reason は lint fail。
5. **mode exit 接続**: 駆動モデル exit contract (L7-242 系) の共通検査項目に「scope_digest 照合 pass」を追加 (L7-242 未消化 mode には activation 順序の依存を明記)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | digest 正規化仕様 (改行/空白/checkbox 状態の扱い) + waiver 記法の設計レビュー (TL) | 直列 |
| 2 | freeze-scope + 縮小検出 lint | 直列 |
| 3 | scope_change 宣言 + waiver + plan-dod 集計区別 | 直列 |
| 4 | mode exit contract への接続 | 直列 |
| 5 | regression test (下記) + enforcement cutoff (既存 PLAN 遡及なし) | 直列 |

## DoD

- [ ] scope_digest 刻印後の DoD 削除が宣言なしで plan lint fail する (test 固定)
- [ ] checkbox の check ([ ]→[x]) は digest 不一致にならない (test 固定 — 進捗と縮小を区別)
- [ ] scope_change (approved_by 付き) で digest 再刻印後は pass する (test 固定)
- [ ] waiver 付き DoD が「完了実体なし」として plan-dod 集計に区別表示される (test 固定)
- [ ] 空 reason の waiver / scope_change が fail する (test 固定)
- [ ] cutoff 以前の既存 PLAN が red にならない (real-repo で `ut-tdd plan lint` exit 0)

## 実装ノート (後続モデル向け)

- 触るファイル: `src/plan/lint.ts`、`src/plan/lint-types.ts`、`src/plan/lint-policy.ts` (cutoff)、`src/schema/frontmatter.ts`、plan-dod 系 lint、`src/cli.ts` (freeze-scope)。L7-304/305 と同じファイル群のため、複数活性化時は直列 (file_conflict)。
- digest の正規化は「意味の変更だけを検出する」方向に倒す: 空白/改行の揺れで偽陽性を出すと宣言が形骸化する。checkbox 状態 ([ ]/[x]/[~]) は digest から除外し、**項目の存在と文言**だけを対象にする。
- 本 gate 自身が回避対象になる (scope_digest 行の削除)。taxonomy B2 と同型に「digest 刻印済み台帳からの削除は fail-close」を必ず入れる (bypass attempt fails closed のパターンを踏襲)。
- 「実装そのものだけでなく資産として残す」(PO): 本 gate の設計判断は taxonomy doc へ back-fill し、新たな回避を発見したら台帳 (§2) に分類を先に追記する運用を README 化する。
