---
plan_id: PLAN-L7-366-takeover-surface-warn-actionable
title: "PLAN-L7-366 (impl): takeover surface の warn 昇格 + feedback_events 読取り"
kind: impl
layer: L7
drive: be
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
    slot_label: "TL - severity マッピングと surface data source の設計レビュー"
  - role: se
    slot_label: "SE - surface severity 是正 + feedback_events 読取り配線"
generates:
  - artifact_path: docs/plans/PLAN-L7-366-takeover-surface-warn-actionable.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-110-takeover-feedback-surface.md
    - docs/plans/PLAN-L7-137-feedback-surface-taxonomy.md
    - docs/plans/PLAN-L7-246-feedback-event-lifecycle.md
    - src/feedback/surface.ts
    - src/state-db/feedback-projections.ts
---

# PLAN-L7-366 (impl): takeover surface の warn 昇格 + feedback_events 読取り

## Status

draft 起票 (2026-07-07 DB三ループ監査。Major/Minor 所見: 下流 feedback pipeline が自動 surfacing に対し
write-only、warn が telemetry へ降格)。着手時は add-impl + Reverse pairing へ昇格 (route_mode=add-feature debt)。

## 背景

SessionStart takeover surface はオーケストレータへ DB fact を届ける唯一の自動面だが、次の欠落がある:

- **feedback_events を読まない**: `selectTakeoverFeedback` (`src/feedback/surface.ts`) は `findings` と
  `quality_signals` のみを読み、`feedback_events` テーブルを一切 query しない。下流 pipeline
  (feedback_events / trouble / retry / issue / guardrail / improvement) は手動 list コマンドでしか出ず
  **自動 surfacing に対し write-only**。
- **warn 降格**: `surface.ts` は `status='warn'` の quality_signal を `severity='info'` に写像し
  (`fail?'warn':'info'`)、`classifyFeedbackBucket` が info を `telemetry` bucket へ落とす。結果として
  refactor 候補を含む全 warn signal が **actionable に出ず要約カウントのみ**になり、
  「high-confidence を open feedback に昇格」という設計意図が severity マッピングで打ち消される。

## スコープ

1. **feedback_events 読取り**: takeover surface が `feedback_events` の open/actionable 行を読み、
   PLAN-L7-137 の bucket 分類 (gate/actionable/telemetry) に載せる。PLAN-L7-246 の close 経路と整合し
   close 済みは出さない。
2. **warn 是正**: warn-status signal を無条件で info→telemetry に落とす写像を見直し、actionable 相当の
   warn (例 high-confidence refactor 候補) を actionable bucket に載せる severity 基準を導入する。
3. 過剰 surfacing を防ぐため display limit / dedup は PLAN-L7-137 taxonomy を踏襲する。

## 非対象

- feedback_events の close/lifecycle 実装は **PLAN-L7-246** の scope (本 PLAN は読取り側)。
- 新規 feedback source の追加はしない (surfacing 経路のみ)。

## §3 工程表

### Step 1: severity マッピング + surface data source 設計 (TL) [直列]

どの warn を actionable に昇格するか、feedback_events をどう bucket 分類に載せるかを確定する。
後続実装がこの基準に依存 (downstream_dependency)。

### Step 2: surface severity 是正 + feedback_events 読取り配線 [直列]

`surface.ts` の `selectTakeoverFeedback` 共有ロジックを編集するため直列 (shared_state)。

### Step 3: surface regression test [並列]

warn actionable 昇格 / feedback_events 出力 / close 済み非表示 / display limit を固定。別 test file の
ため並列可。

### Step 4: cross-runtime レビュー (pmo-sonnet / codex) [直列]

severity 基準の過検出リスクと taxonomy 整合を別ランタイムでレビュー (downstream_dependency)。

## §3.1 実装計画

`src/feedback/surface.ts` の `selectTakeoverFeedback` に feedback_events query を追加し severity 写像を
是正 → PLAN-L7-137 の bucket 分類 / limit を再利用 → `tests/` に surface regression を追加。
PLAN-L7-246 の close 状態と統合 test で整合を固定。

## DoD / 受入基準

- [ ] takeover surface が open な `feedback_events` の actionable 行を出す (test 固定)。
- [ ] high-confidence warn (refactor 候補等) が telemetry 要約でなく actionable として出る (test 固定)。
- [ ] close 済み feedback_events が surface に出ない (PLAN-L7-246 整合、test 固定)。
- [ ] `ut-tdd session start` 出力の bucket 分類が PLAN-L7-137 taxonomy と整合する。
- [ ] display limit / dedup による過剰 surfacing 抑制が効く (test 固定)。
