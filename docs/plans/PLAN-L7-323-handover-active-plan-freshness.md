---
plan_id: PLAN-L7-323-handover-active-plan-freshness
title: "PLAN-L7-323 (impl): handover active_plan の鮮度保証 — stale 値を信頼できる顔で出さない"
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
parent_design: docs/design/harness/L6-function-design/handover-mechanism.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期"
  - role: tl
    slot_label: "TL - stale 判定条件と表示契約のレビュー"
  - role: se
    slot_label: "SE - 鮮度判定 + 自動更新経路の実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-323-handover-active-plan-freshness.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L6-06-handover-mechanism.md
    - docs/plans/PLAN-L6-03-session-log.md
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
---

# PLAN-L7-323 (impl): handover active_plan の鮮度保証

## Status

**version-up parked (v2)**。PO 質問 (2026-07-03「ハンドオーバー機構って問題ない?」) への実測回答で特定した唯一の残欠陥の是正。

## 背景 (実測 2026-07-03)

handover 機構の骨格は健全 (正本 = harness.db feedback surface (L7-110)、CURRENT.json の outstanding 機械集計は正確、絶対パス混入は解消済み)。ただし **active_plan が事実上死んでいる**:

- 実測: CURRENT.json `active_plan: PLAN-L7-26`、`.ut-tdd/state/current-plan` は `PLAN-L7-31` — 両方とも当日の実作業 (A-181/v2 起票、Codex CLI 抽出) と無関係の stale 値。
- 設計上の原因 (L6-06 に明記済みの制約): 更新経路は `ut-tdd plan use <id>` (実運用で誰も打たない) と commit message からの推定 `inferPlanFromCommit` (**`-m` 形式のみ、heredoc `-F -` 非対応**)。Claude は heredoc commit、Codex は PLAN ID を含まない refactor commit が主で、どちらの経路も発火しない。
- 帰結: stale 値が「active=PLAN-L7-26 status=in_progress」という**信頼できる顔**で表示され、引き継ぎ手を誤誘導する。欠測と stale の混同 (LENS-DR の欠測≠0 原則違反)。

## スコープ (1 要件: active_plan の表示が「新鮮」「stale」「不明」を正直に区別する)

1. **鮮度判定**: current-plan state に書込時刻は既に併記されている (実測で確認済)。handover 生成時に (a) 書込みから閾値 (既定 48h) 超過 (b) 該当 PLAN が terminal (confirmed/completed/archived) — のいずれかで `active_plan_freshness: stale` を CURRENT.json / prose 両方に明示し、表示を `active=PLAN-X (stale, YYYY-MM-DD 時点)` に変える。判定不能 (state 不在) は `unknown`。**null/stale を隠して直近値を出す現行動作を廃止**。
2. **自動更新経路の補修**: `inferPlanFromCommit` を heredoc commit (`-F -`) でも効くよう、hook post-tool-use の Bash 監視ではなく **commit-msg hook 側で commit message 本文から PLAN ID を抽出して current-plan を更新** (実行点が message 全文を確実に持つ場所)。PLAN ID の無い commit は更新しない (誤爆より欠測)。
3. **SessionStart との整合**: SessionStart surface に active_plan を出す場合も同じ鮮度表示を通す (経路で表示が食い違わないこと)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 鮮度判定条件 + 表示契約の設計 (TL) | 直列 |
| 2 | freshness 判定 + CURRENT.json / prose 表示 | 直列 |
| 3 | commit-msg hook での current-plan 更新 | Step 2 と並列 |
| 4 | regression test (stale 表示 / terminal 検出 / heredoc commit で更新 / PLAN ID なし commit で不変) | 直列 |

## DoD

- [ ] 48h 超過または terminal PLAN の active_plan が stale 表示になる (test 固定)
- [ ] heredoc commit (PLAN ID 含む) が current-plan を更新する (test 固定)
- [ ] PLAN ID を含まない commit では current-plan が変化しない (test 固定)
- [ ] 実リポジトリで `ut-tdd handover` の表示が実状態と矛盾しない (実走 evidence)

## 実装ノート (後続モデル向け)

- 触るファイル: handover 生成 (`resolveHandoverScope`/`buildPointer` 系 — L6-06 の関数表が正確な地図)、commit-msg hook、SessionStart surface。`resolveActivePlan` の読取ロジック (L6-03 U-SLOG-001) は変えない — 鮮度メタデータを足すだけ。
- L6-06 の設計制約 (`inferPlanFromCommit` は `-m` のみ) は「起票時点の割切り」として文書化済み — 本 PLAN はその割切りの解除であり、L6-06 への back-merge (設計 doc 更新) を忘れない (KIND_BACKFILL: 活性化時に add-impl 昇格 + Reverse pairing)。
