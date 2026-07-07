---
plan_id: PLAN-L7-364-reverse-stage-db-obligation
title: "PLAN-L7-364 (impl): reverse R0-R4 の DB stage 可視化 + 自動 obligation + staleness gate"
kind: impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-07
updated: 2026-07-07
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - reverse stage projection と obligation gate の設計レビュー"
  - role: se
    slot_label: "SE - workflow_phase projection + reverse_stage_events + obligation/staleness doctor"
generates:
  - artifact_path: docs/plans/PLAN-L7-364-reverse-stage-db-obligation.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/plans/PLAN-L7-240-reverse-right-arm-exit-gate.md
    - docs/plans/PLAN-L7-246-feedback-event-lifecycle.md
    - src/schema/frontmatter.ts
    - src/state-db/projection-writer.ts
    - src/state-db/feedback-projections.ts
---

# PLAN-L7-364 (impl): reverse R0-R4 の DB stage 可視化 + 自動 obligation

## Status

draft 起票 (2026-07-07 DB三ループ監査。PO focus「リバース駆動が弱い」への機械化強化)。
着手時 (draft→confirmed) は add-impl + Reverse pairing へ昇格する (route_mode=add-feature debt)。

## 背景

Reverse (R0-R4 → Forward merge) は PLAN document 層では厚く gate されているが、**駆動が完全に手動**で
harness.db に per-stage 状態を持たない:

- **stage 不可視**: `workflow_phase` (R0..R4) は `src/schema/frontmatter.ts` の schema/lint 検証にしか
  存在せず、`src/state-db` に投影 0 件 (plan_registry は kind/layer/drive/status のみ)。R2 と R3 は
  status 上区別できず、R-stage 進捗・各 stage 滞留時間が DB から見えない。
- **放置検出なし**: 開始した reverse が R1 で停滞しても無シグナル。R4 個別 gate
  (PLAN-REVERSE-107/111/112/115) は author が phase を進めた時のみ発火するため、**静かに放棄可能**。
- **obligation が prose のみ**: drift-check / errata / artifact_progress red は
  `feedback_events` に `trigger dependency/reverse recovery ...` という **prose next_action** を出すだけ
  (`src/state-db/feedback-projections.ts`)。open な red signal に対応する reverse PLAN を機械が要求しない。
- R4→Forward exit の強制は PLAN-L7-240 (draft) が別途担うため、本 PLAN は **stage 可視化 + obligation
  + staleness** に絞り、R4→Forward reciprocal は L7-240 を参照 (重複回避)。

## スコープ

1. **stage projection**: `workflow_phase` を plan_registry へ投影し、`reverse_stage_events` テーブル
   (plan_id, phase, entered_at, source_hash) で R0→R4 遷移と滞留時間を記録する。
2. **auto-obligation doctor**: open な drift / errata / foreign-commit / gate-failure `feedback_events` を
   「対応する reverse PLAN 参照 (ack)」へ写像し、未 ack の red で fail-close する `reverse-obligation`
   check を追加する (prose next_action を機械債務へ昇格)。
3. **staleness gate**: 非終端 (R0-R3) reverse PLAN の `updated_at` と phase を突き合わせ、規定期間を超えた
   滞留を検出する `reverse-staleness` check を追加する。
4. PLAN-L7-246 (feedback lifecycle close 経路) と接続し、ack/close された obligation が再燃しないこと。

## 非対象

- R4→Forward merge target の存在強制・route gate 未通過 forward merge 検出は **PLAN-L7-240** の scope。
- reverse 判定基準 (R3 po role / forward_routing 必須) 等の既存 R4 gate は変更しない。

## §3 工程表

### Step 1: reverse_stage_events schema + workflow_phase projection 設計 (TL) [直列]

テーブル列と projection 契約を確定。後続 obligation / staleness gate がこの投影に依存
(downstream_dependency)。

### Step 2: workflow_phase / reverse_stage_events projection 実装 [直列]

`projection-writer.ts` の rebuild パイプライン共有状態を編集するため直列 (shared_state)。

### Step 3: reverse-obligation doctor check [並列]

open red feedback_events → 要求 reverse PLAN 参照の fail-close 写像。独立 module のため並列可。

### Step 4: reverse-staleness doctor check [並列]

非終端 reverse PLAN の phase×updated_at 滞留検出。独立 module のため並列可。

### Step 5: obligation close 連携 regression test [直列]

Step 2/3 の投影と PLAN-L7-246 close 経路に依存する統合 test (downstream_dependency)。

### Step 6: cross-runtime レビュー (pmo-sonnet / codex) [直列]

stage schema・obligation の fail-close 境界・staleness 閾値を別ランタイムでレビュー
(downstream_dependency)。

## §3.1 実装計画

`src/schema/harness-db-tables-*.ts` に `reverse_stage_events` を追加 → `projection-writer.ts` に
`projectReverseStageEvents` + plan_registry への workflow_phase 反映 → `src/doctor/` に
`checkReverseObligation` / `checkReverseStaleness` を追加し check-registry へ登録 → `tests/` に
projection + 両 doctor + close 連携の regression を追加。concept §Reverse / L0 用語と整合。

## DoD / 受入基準

- [ ] `ut-tdd db rebuild` 後に reverse PLAN の R-stage が plan_registry / reverse_stage_events から
      queryable (`bun run src/cli.ts db rebuild`)。
- [ ] `ut-tdd doctor` の `reverse-obligation` が未 ack の open red signal を fail-close する。
- [ ] `ut-tdd doctor` の `reverse-staleness` が非終端 reverse PLAN の滞留を検出する。
- [ ] ack/close 済み obligation が次 rebuild で再燃しない (regression test green)。
- [ ] R4→Forward reciprocal は本 PLAN scope 外であることが明記され PLAN-L7-240 を参照している。
