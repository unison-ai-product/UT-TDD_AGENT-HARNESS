---
plan_id: PLAN-REVERSE-11-verification-trigger
title: "PLAN-REVERSE-11 (reverse/fullback): 検証タイミングの機械発火を上位整合へ — 検証ロードマップ反映 + concept §10 用語 back-fill (IMP-068)"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: agent
status: confirmed
created: 2026-06-05
updated: 2026-06-12
owner: PM (Opus) / PO (人間)
forward_routing: L3
promotion_strategy: reuse-as-is
agent_slots:
  - role: tl
    slot_label: "TL — 機械発火が検証ロードマップ (検証タイミングの V-model 単位機械化) に正しく反映されるか / concept §10 用語追加の妥当性 / 検証ロードマップを driver にしない原則を崩さないかのレビュー (claude-only は code-reviewer 代替)"
  - role: po
    slot_label: "PO — R3 intent (検証タイミングを層群 freeze で機械発火させてよいか / placeholder=park 許容 / 機械は surface まで・起票は人間) 検証。PO 2026-06-05「検証のタイミングを機械的に発火、V-model 単位、崩れ防止の全体調整」で授権済"
generates: []
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-12-verification-trigger.md
  references:
    - docs/plans/PLAN-L6-11-verification-trigger.md
---

# PLAN-REVERSE-11 (reverse/fullback): 検証タイミングの機械発火の上位整合

## §0 位置づけ

PLAN-L6-11 (設計) / L7-12 (実装) で導入した **検証タイミングの機械発火** (V-model 層群 freeze → 検証サイクル発火 surface) を上位整合へ back-fill する。① 検証ロードマップ (roadmap.md) に「検証タイミングは層群 freeze で機械発火する」機構を反映、② concept §10 用語 (検証発火 / 検証層群) の back-merge。

## §工程表

### Step 1: [直列] 検証ロードマップへ機械発火を反映
- 直列理由 = **file_conflict** (roadmap.md を編集)。検証タイミングが doctor の層群 freeze surface で機械発火することを §X に明記 (roadmap を driver にせず、機械発火の anchor として)。

### Step 2: [直列] concept §10 用語 back-merge
- 直列理由 = **file_conflict** (concept §10 を編集)。「検証発火」「検証層群」を §10 用語集へ追加 (backfill lint の glossary gap 解消)。

### Step 3: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。code-reviewer で上位整合の正しさをレビュー。

## §実装計画

- **roadmap.md / concept §10** (情報源: PLAN-L6-11 設計 + PO 是正): 検証ロードマップへの機械発火反映 + §10 用語。
- back-fill の向き = 「Reverse (本 PLAN) が impl (L7-12) を requires」。

## §6 用語更新

- **検証発火 (verification trigger)**: V-model 層群の Forward freeze 完了を検知して検証サイクル発火を surface する機構 (IMP-068)。検証ロードマップの「いつ検証するか」の機械化。→ concept §10 へ back-merge (本 PLAN Step 2)。
- **検証層群 (verification group)**: 検証発火の単位となる設計層群 (L0-L3 / L4-L6 / L0-L6、placeholder=park 許容)。→ concept §10 へ back-merge。

## §7 DoD
- [x] 検証ロードマップ (roadmap.md) に機械発火を反映
- [x] concept §10 に「検証発火」「検証層群」を back-merge (glossary gap 解消)
- [x] doctor backfill 行で本 cycle の Reverse 孤児 0 / glossary gap 0 を確認
- [x] review 前置 (pmo-sonnet を code-reviewer 代替で実施、2026-06-05 APPROVE。concept §10 back-merge / roadmap 反映を確認)
