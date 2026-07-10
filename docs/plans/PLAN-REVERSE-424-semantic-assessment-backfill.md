---
plan_id: PLAN-REVERSE-424-semantic-assessment-backfill
title: "PLAN-REVERSE-424: semantic assessment実装の設計backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
status: draft
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-424-semantic-assessment-debt-router.md
agent_slots:
  - role: tl
    slot_label: "TL - assessment/debt実装事実をL5/L6へbackfill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-424-semantic-assessment-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-424-semantic-assessment-debt-router.md
  requires: []
---

# PLAN-REVERSE-424

R0でevaluator/projectionを観測し、R1でverdict/evidence差、R2でU-ASSESS、R3で163 item/debt coverage、R4でL4-27/L5-21/L6-76へ合流する。
