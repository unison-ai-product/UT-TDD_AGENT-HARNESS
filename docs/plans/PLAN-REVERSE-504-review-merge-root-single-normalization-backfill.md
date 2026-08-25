---
plan_id: PLAN-REVERSE-504-review-merge-root-single-normalization-backfill
title: "review merge gate root normalization Reverse backfill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: be
status: draft
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-08-25
updated: 2026-08-25
owner: Codex
parent_design: docs/plans/PLAN-L7-504-review-merge-root-single-normalization.md
pair_artifact: docs/test-design/harness/L7-review-merge-root-single-normalization-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - L6-101 containment backprop"
  - role: qa
    slot_label: "QA - single-mutation and nested-root evidence"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-504-review-merge-root-single-normalization-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-504-review-merge-root-single-normalization.md
  requires:
    - docs/plans/PLAN-L7-465-cross-review-author-binding.md
  blocks: []
review_evidence: []
---

# PLAN-REVERSE-504

R1でnested invocationのroot収束を実測し、R2でL6-101の「canonical containmentは単一点」の
受入契約へ反映する。R3で単点mutation、Linux/Windows/aggregate、exact-head reviewを再検収し、
R4でL7-465のmerge gate運用へbackpropする。二重防御を復活させる変更は受け入れない。
