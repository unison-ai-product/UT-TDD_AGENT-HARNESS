---
plan_id: PLAN-L7-246-feedback-event-lifecycle
title: "PLAN-L7-246 (impl): feedback_events の消化 lifecycle 完結 (close 経路 + actionable→routing 接続)"
kind: impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/handover-mechanism.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - reconcile (源条件解消で close) + stale event 整理"
  - role: tl
    slot_label: "TL - lifecycle 設計 (append-only 投影との整合、監査改ざん回避) レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-246-feedback-event-lifecycle.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-176-db-detection-systems-audit-2026-07-02.md
    - src/state-db/feedback-projections.ts
    - src/feedback/surface.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
---

# PLAN-L7-246 (impl): feedback_events の消化 lifecycle 完結

## Status

draft 起票 (PO 質問起点の A-176 焦点監査、2026-07-02)。

## 背景 (A-176 F-A / F-B)

feedback_events は全 2027 行が status='open' で close 経路が存在しない (書き込みは常に open、UPDATE 経路ゼロ)。artifact_progress_yellow は stableId key に state を含むため状態遷移ごとに新 open が積まれ旧行が永久残留し、open 件数が観測指標として機能しない (write-only log 化 = 柱3 の劣化)。また actionable bucket が surface 止まりで、A-156 型の起票 candidate へ接続する機械経路が無い (research 第二 exit の DB 側対応物)。

## スコープ (1 要件: 検出→消化の lifecycle 完結)

1. **reconcile**: projection 時に源条件 (finding/quality_signal/progress の現在値) を再評価し、解消済み event を `closed` (+ closed_at/closed_reason) へ遷移。stableId 世代交代 (state 変化) 時は旧世代を supersede で close。
2. **stale 一掃**: 既存 2027 行への初回 reconcile 適用 (履歴は保持、削除しない — 監査改ざん回避)。
3. **actionable→routing 接続**: actionable bucket の event に route candidate (finding_type/route_signal) を持たせ、`ut-tdd feedback pending` から A-156 ledger / route eval へ渡せる形へ (PLAN-L7-237 の audit-doc 側 gate と対になる DB 側動線)。
4. surface へ open/closed 推移 (今区間の新規/解消数) を出し、蓄積でなく流量を見える化。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | lifecycle 設計 (TL、append-only 投影との整合) | 直列 |
| 2 | reconcile 実装 + 初回一掃 | 直列 |
| 3 | actionable→routing 接続 + surface 流量表示 | 2 と並列 |
| 4 | regression test (源条件解消→close / 状態遷移→supersede) | 直列 |

## DoD

- [ ] 源条件が解消した event が次回 projection で closed になる (test 固定)
- [ ] open 件数が「現に立っている検出」だけを意味する (stale 0 を doctor で検証可能)
- [ ] actionable event から route candidate への機械経路が存在する
