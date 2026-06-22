---
plan_id: PLAN-REVERSE-107-reverse-fullback-scope-gate
title: "PLAN-REVERSE-107: Reverse fullback scope gate fullback"
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
    reason: "Requirements define the explicit Reverse fullback scope gate."
  - layer: L4-basic-design
    decision: not_impacted
    reason: "The governance gate does not change external runtime function design."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The governance gate does not change detailed runtime data or module design."
agent_slots:
  - role: tl
    slot_label: "TL - Reverse fullback scope rule review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-107-reverse-fullback-scope-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-107-reverse-fullback-scope-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-107-reverse-fullback-scope-gate.md
  requires:
    - docs/plans/PLAN-L7-107-reverse-fullback-scope-gate.md
---

# PLAN-REVERSE-107: Reverse fullback scope gate fullback

## R0 Evidence

The progress-color fullback correctly updated requirements and design layers, but
the generic gate only checked that a fullback generated at least one upstream
artifact. That left a hole: future fullbacks could update requirements while
silently skipping L4 basic design or L5 detailed design impact classification.

## R1 Observed Gap

Existing 2026-06-22 fullback PLANs after PLAN-REVERSE-56 generated requirements
evidence but did not state whether L4/L5 were updated, not impacted, or deferred.
The work was mostly governance-only, so L4/L5 changes were not necessarily
required, but the no-impact decision was not machine-readable.

## R2 Alignment

The fix belongs in `plan-governance` because the invariant is about PLAN
admissibility, not about runtime behavior. Fullback R4 must be queryable at the
same layer granularity that the user asked about: requirements, basic design, and
detailed design.

## R3 / R4 Outcome

`plan-governance` now requires `backprop_scope` for R4 fullbacks. Each fullback
must classify `requirements`, `L4-basic-design`, and `L5-detailed-design` as
`updated`, `not_impacted`, or `deferred`; `updated` entries must cite a generated
evidence path. Current 2026-06-22 fullbacks have been backfilled with explicit
scope decisions.

## DoD

- [x] Requirements record the new gate.
- [x] Current fullback PLANs expose requirements/L4/L5 scope decisions.
- [x] Missing scope and stale evidence fixtures fail.
- [x] Green fixture passes.
