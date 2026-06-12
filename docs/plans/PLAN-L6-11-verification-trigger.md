---
plan_id: PLAN-L6-11-verification-trigger
title: "PLAN-L6-11 (add-design): 検証タイミングの機械発火の機能設計 — V-model 層群 freeze 集計 (vmodel-pair-freeze §7、IMP-068)"
kind: add-design
layer: L6
drive: agent
status: confirmed
created: 2026-06-05
updated: 2026-06-05
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 層群定義 (L0-L3/L4-L6/L0-L6) の妥当性 / freeze 判定 (draft 0 + 孤児0 + confirmed≥1、placeholder=park 許容) が A-100 と整合するか / 機械発火 = surface まで (起票は人間) の境界のレビュー (claude-only は code-reviewer 代替)"
generates:
  - artifact_path: docs/design/harness/L6-function-design/vmodel-pair-freeze.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires: []
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: cross_agent
    worker_model: codex:gpt-5.4
    reviewer_model: claude:pmo-sonnet
    tests_green_at: "2026-06-09T13:00:00+09:00"
    reviewed_at: "2026-06-09T13:10:23+09:00"
    verdict: approve
    scope: "G6 L6 completion final recheck; lint/typecheck/vitest/doctor green; L6 FR coverage and guardrail coverage reviewed"
---

# PLAN-L6-11 (add-design): 検証タイミングの機械発火の機能設計

## §0 位置づけ

PO 是正「検証ロードマップ = 検証タイミングを **V-model 単位で機械発火**させる、崩れ防止の全体調整」を受け、pair-freeze lint (PLAN-L6-10) の status 集計を **V-model 層群**単位に拡張する機能を設計する。検証ロードマップの「いつ検証するか」を人の記憶でなく V-model 構造 (層群の Forward freeze 完了) に従わせる。設計本体 = `vmodel-pair-freeze.md §7`、③ ペア = L7-unit §1.14 U-VTRIG。

## §工程表

### Step 1: [直列] 機能設計 §7 追記
- 直列理由 = **file_conflict** (vmodel-pair-freeze.md §7 を追記)。層群定義 + freeze 判定 (placeholder=park 許容) + 関数仕様 + 「機械発火 = surface まで」の境界を記述。

### Step 2: [直列] L7-unit §1.14 U-VTRIG 追記
- 直列理由 = **downstream_dependency** (Step 1 関数仕様に対応する U-ID)。U-VTRIG-001〜005 を追記。

### Step 3: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。code-reviewer で freeze 判定の A-100 整合 / 層群定義の妥当性をレビュー。

## §実装計画

- **vmodel-pair-freeze.md §7** (情報源: PLAN-L6-10 pair-freeze 基盤 + PO 是正 + A-100 freeze 状態): 層群 freeze 集計の純関数仕様。
- **L7-unit §1.14** (情報源: Step 1 関数仕様): U-VTRIG の oracle を DbC で記述。
- 設計粒度 = L7 単体テスト設計粒度 (各検査軸 1 U-ID + 実 repo ガード)。

## §6 用語更新

- **検証発火 (verification trigger)**: V-model 層群 (L0-L3 / L4-L6 / L0-L6) の Forward freeze 完了を検知して検証サイクル発火タイミングを surface する機構 (IMP-068)。検証ロードマップの「いつ検証するか」の機械化。→ concept §10 へ back-merge (REVERSE-11)。
- **検証層群 (verification group)**: 検証発火の単位となる設計層群 (placeholder=park 許容、draft 0 で freeze 完了)。→ concept §10 へ back-merge。

## §7 DoD
- [ ] vmodel-pair-freeze.md §7 + L7-unit §1.14 (③ ペア U-VTRIG)
- [ ] §6 用語を concept §10 へ back-merge (REVERSE-11)
- [x] review 前置 (pmo-sonnet を code-reviewer 代替で実施、2026-06-05 APPROVE。P-1 layers 注記 / P-3 DoD 反映済)
