---
plan_id: PLAN-REVERSE-444-engine-swap-g8-evidence-backfill
title: "PLAN-REVERSE-444: engine-swap G8 evidence実装のgap-only backfill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: fullstack
status: draft
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-16
updated: 2026-07-16
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-444-engine-swap-g8-evidence-contract.md
agent_slots:
  - role: tl
    slot_label: "TL - evidence/program gate実装とL4-L8差分判定"
  - role: qa
    slot_label: "QA - stale/partial/偽Green攻撃の独立再導出"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-444-engine-swap-g8-evidence-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-444-engine-swap-g8-evidence-contract.md
  requires: []
---

# PLAN-REVERSE-444: engine-swap G8 evidence実装backfill

R0でtyped manifest、contract compiler binding、program gate、doctor adapter、実行receiptを観測する。R1でL4-24/L5-18/L8-01/L8 test-designとの差を分類し、R2で`U/I-G8ES-*`を作者主張なしに再実行する。R3は旧manifest偽Green、anchor stale、IT欠落、defer偽装、digest改変、doctor failureを攻撃する。R4では一般化可能なgapだけを上流へ戻し、実装不足や未実証を設計・検出器の緩和で隠さない。
