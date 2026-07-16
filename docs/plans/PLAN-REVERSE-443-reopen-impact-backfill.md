---
plan_id: PLAN-REVERSE-443-reopen-impact-backfill
title: "PLAN-REVERSE-443: 再開放影響・再検証実装のgap-only backfill"
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
parent_design: docs/plans/PLAN-L7-443-reopen-impact-reverification-gate.md
agent_slots:
  - role: tl
    slot_label: "TL - closure/reentry/merge実装差分判定"
  - role: qa
    slot_label: "QA - invalidated gate負系の再導出"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-443-reopen-impact-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-443-reopen-impact-reverification-gate.md
  requires: []
---

# PLAN-REVERSE-443: 再開放影響・再検証実装backfill

R0でimpact closure、reverify、certificate/PR/merge遮断を観測する。R1-R3で最上流reopen、no-impact、古いevidence、実装保持Reverseと実装破棄Redesignの分岐を攻撃する。R4は設計gapだけをL4-L6/L7 test-designへ戻し、検出を実装へ合わせて緩めない。
