---
plan_id: PLAN-REVERSE-111-reverse-fullback-claimed-artifact-gate
title: "PLAN-REVERSE-111: Reverse fullback claimed artifact gate fullback"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: db
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
forward_routing: L5
promotion_strategy: reuse-as-is
backprop_scope:
  - layer: requirements
    decision: updated
    evidence_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    reason: "Requirements define the claimed backprop artifact path gate."
  - layer: L4-basic-design
    decision: not_impacted
    reason: "The governance gate does not change external basic design behavior."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The governance gate does not change detailed runtime data or module design."
agent_slots:
  - role: tl
    slot_label: "TL - claimed artifact fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-111-reverse-fullback-claimed-artifact-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-111-reverse-fullback-claimed-artifact-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-111-reverse-fullback-claimed-artifact-gate.md
  requires:
    - docs/plans/PLAN-L7-111-reverse-fullback-claimed-artifact-gate.md
---

# PLAN-REVERSE-111: Reverse fullback claimed artifact gate fullback

## R0 Evidence

The legacy fullback sweep found a path-class mismatch pattern: a PLAN can claim
an artifact in prose while frontmatter omits that artifact from `generates`.

## R1 Observed Gap

`PLAN-REVERSE-107` closed the scope-classification gap, but the machine still
trusted `generates` without checking literal artifact path claims in the body.
That leaves a trace hole whenever a reviewer reads the body and believes a
specific artifact was updated, while the database and plan-governance cannot see
that artifact.

## R2 Alignment

The correct enforcement point is `plan-governance`, because this is a PLAN
admissibility invariant. The rule is intentionally literal-path only to avoid
false positives from natural-language design discussions.

## R3 / R4 Outcome

New or updated R4 fullback PLANs fail with
`reverse_fullback_claimed_artifact_missing` when the body cites a backprop
artifact path that is absent from `generates`.

## DoD

- [x] Requirements record the claimed-artifact invariant.
- [x] `plan-governance` emits the new violation for a negative fixture.
- [x] Live PLAN governance lint passes.
