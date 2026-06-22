---
plan_id: PLAN-REVERSE-106-backprop-classification-backlog-gate
title: "PLAN-REVERSE-106: Backprop classification backlog gate fullback"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: db
status: confirmed
created: 2026-06-22
updated: 2026-06-22
owner: Codex
forward_routing: L5
promotion_strategy: reuse-as-is
backprop_scope:
  - layer: requirements
    decision: updated
    evidence_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    reason: "Requirements define the backlog backprop classification gate."
  - layer: L4-basic-design
    decision: not_impacted
    reason: "The governance gate does not change external runtime function design."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The governance gate does not change detailed runtime data or module design."
agent_slots:
  - role: tl
    slot_label: "TL - backlog backprop classification fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-106-backprop-classification-backlog-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/improvement-backlog.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-106-backprop-classification-backlog-gate.md
  requires:
    - docs/plans/PLAN-L7-106-backprop-classification-backlog-gate.md
---

# PLAN-REVERSE-106: Backprop classification backlog gate fullback

## R0 Evidence

Requirements §6.8.8 defined the six fields required to classify lower-layer
Reverse back-propagation decisions, but `improvement-backlog` lint only checked
row shape and enum values.

## R1 Observed Gap

A backlog row could mention lower-layer back-propagation while omitting the
machine-readable decision. That preserves exactly the failure mode the database
red/yellow/green work is meant to expose: an item is visible, but its recovery or
upstream routing state is not queryable.

## R2 Alignment

The backlog lint now treats explicit lower-layer/backprop rows as requiring:
`backprop_decision`, `reverse_type`, `target_layer`, `upstream_docs`,
`evidence_path`, and `closure_status`.

## R3 / R4 Outcome

Requirements no longer describe this check as future work. IMP-117 is backfilled
with the classification values, and doctor hard-fails any future matching row
that omits them.

## DoD

- [x] Requirements state the current doctor hard gate.
- [x] IMP-117 contains the required machine-readable classification fields.
- [x] Regression tests cover missing and complete lower-layer backprop rows.
