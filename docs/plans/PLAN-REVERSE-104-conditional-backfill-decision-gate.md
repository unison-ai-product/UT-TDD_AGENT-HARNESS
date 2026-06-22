---
plan_id: PLAN-REVERSE-104-conditional-backfill-decision-gate
title: "PLAN-REVERSE-104: Conditional backfill decision gate fullback"
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
    reason: "Requirements define the conditional backfill decision gate."
  - layer: L4-basic-design
    decision: not_impacted
    reason: "The governance gate does not change external runtime function design."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The governance gate does not change detailed runtime data or module design."
agent_slots:
  - role: tl
    slot_label: "TL - conditional backfill rule review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-104-conditional-backfill-decision-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/conditional-backfill-decision-audit-2026-06-22.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-104-conditional-backfill-decision-gate.md
  requires:
    - docs/plans/PLAN-L7-104-conditional-backfill-decision-gate.md
---

# PLAN-REVERSE-104: Conditional backfill decision gate fullback

## R0 Evidence

`backfill-pairing` already knew that `refactor`, `retrofit`, and `troubleshoot`
may require Reverse when they alter contracts or behavior, but it only emitted a
note and kept `ok=true`.

## R1 Observed Gap

The repository had 26 active conditional-kind PLANs without a Reverse link or
machine-readable no-backprop decision. That left the same class of design
backprop miss possible outside explicit `add-impl` and R4 fullback paths.

## R2 Alignment

Existing entries are treated as legacy debt and are recorded in a governance
audit table. New and updated conditional-kind PLANs must either be back-filled
by Reverse or declare a concrete no-backprop decision.

## R3 / R4 Outcome

Requirements now define the conditional backfill decision gate. `backfill-pairing`
enforces it with `conditionalDecisionMissing`, while preserving the legacy debt
baseline for remediation.

## DoD

- [x] Requirements define the conditional-kind no-backprop decision contract.
- [x] Legacy conditional gaps are listed in an audit artifact.
- [x] Regression tests fail a new conditional PLAN without Reverse or no-backprop
      decision.
- [x] Regression tests accept an explicit no-backprop decision.
