---
plan_id: PLAN-REVERSE-112-reverse-r4-claimed-artifact-gate
title: "PLAN-REVERSE-112: Reverse R4 claimed artifact gate fullback"
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
    reason: "Requirements define the non-fullback Reverse R4 claimed artifact gate."
  - layer: L4-basic-design
    decision: not_impacted
    reason: "The governance gate does not change external basic design behavior."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The governance gate does not change detailed runtime data or module design."
agent_slots:
  - role: tl
    slot_label: "TL - Reverse R4 claimed artifact fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-112-reverse-r4-claimed-artifact-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-112-reverse-r4-claimed-artifact-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/reverse-fullback-backprop-audit-2026-06-22.md
    artifact_type: markdown_doc
  - artifact_path: docs/improvement-backlog.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-112-reverse-r4-claimed-artifact-gate.md
  requires:
    - docs/plans/PLAN-L7-112-reverse-r4-claimed-artifact-gate.md
---

# PLAN-REVERSE-112: Reverse R4 claimed artifact gate fullback

## R0 Evidence

The fullback-only sweep missed a second class of design-return trace drift:
non-fullback R4 Reverse PLANs can cite upstream artifact paths in prose while
omitting those paths from `generates`.

## R1 Observed Gap

The existing `reverse_fullback_claimed_artifact_missing` rule only covered
`confirmed_reverse_type=fullback`. That left `design`, `code`, and
`normalization` Reverse PLANs outside the same literal path consistency check.

## R2 Alignment

The invariant is common to R4 Reverse routing: if a PLAN body says an upstream
artifact path was part of the design/governance/test-design return path, the
frontmatter must expose that artifact for database projection and review.

## R3 / R4 Outcome

New or updated non-fullback R4 Reverse PLANs fail with
`reverse_r4_claimed_artifact_missing` when their body cites an upstream artifact
path absent from `generates`. Legacy cases remain listed in
docs/governance/reverse-fullback-backprop-audit-2026-06-22.md.

## DoD

- [x] Requirements record the non-fullback R4 claimed-artifact invariant.
- [x] Audit records the legacy non-fullback R4 claimed-artifact debt.
- [x] `plan-governance` emits the new violation for a negative fixture.
- [x] Live PLAN governance lint passes.
