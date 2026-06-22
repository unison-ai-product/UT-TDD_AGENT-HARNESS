---
plan_id: PLAN-REVERSE-103-reverse-fullback-backprop-gate
title: "PLAN-REVERSE-103: Reverse fullback backprop gate fullback"
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
    reason: "Requirements define the Reverse fullback backprop gate."
  - layer: L4-basic-design
    decision: not_impacted
    reason: "The governance gate does not change external runtime function design."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The governance gate does not change detailed runtime data or module design."
agent_slots:
  - role: tl
    slot_label: "TL - Reverse fullback backprop rule review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-103-reverse-fullback-backprop-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/reverse-fullback-backprop-audit-2026-06-22.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-103-reverse-fullback-backprop-gate.md
  requires:
    - docs/plans/PLAN-L7-103-reverse-fullback-backprop-gate.md
---

# PLAN-REVERSE-103: Reverse fullback backprop gate fullback

## R0 Evidence

The repository contained confirmed R4 fullback PLANs with no generated design/governance/test-design
artifact. Several older PLANs state that L1/L3/L4/L5 backfill occurred, but the machine-readable
frontmatter cannot prove the target artifact.

## R1 Observed Gap

`plan-governance` checked R4 field presence but did not enforce the core fullback invariant:
fullback must point back to the artifact that was actually updated.

## R2 Alignment

The rule is enforced prospectively from 2026-06-22. Older gaps are recorded as legacy debt because
retroactively failing all historical Reverse PLANs would block unrelated current work before each
old PLAN is classified.

## R3 / R4 Outcome

Requirements now state that confirmed/completed R4 fullback PLANs must generate at least one
`docs/design/`, `docs/governance/`, or `docs/test-design/` artifact. `plan-governance` enforces this
for new/updated fullback PLANs with `reverse_fullback_backprop_missing`.

## DoD

- [x] Requirements define the fullback backprop target invariant.
- [x] Legacy fullback gaps are listed in an audit artifact.
- [x] A regression test fails a new fullback without backprop.
- [x] A regression test accepts a new fullback with a governance/design/test-design target.
