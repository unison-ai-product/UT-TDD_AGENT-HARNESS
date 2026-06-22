---
plan_id: PLAN-REVERSE-105-artifact-type-path-governance-gate
title: "PLAN-REVERSE-105: Artifact path/type governance gate fullback"
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
    reason: "Requirements define the artifact path/type governance gate."
  - layer: L4-basic-design
    decision: not_impacted
    reason: "The governance gate does not change external runtime function design."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The governance gate does not change detailed runtime data or module design."
agent_slots:
  - role: tl
    slot_label: "TL - artifact path/type fullback review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-105-artifact-type-path-governance-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-105-artifact-type-path-governance-gate.md
  requires:
    - docs/plans/PLAN-L7-105-artifact-type-path-governance-gate.md
---

# PLAN-REVERSE-105: Artifact path/type governance gate fullback

## R0 Evidence

The requirements already defined `artifact_path x artifact_type` consistency,
but the active validator only enforced the `artifact_type` enum. A PLAN could
therefore register a design or test-design artifact as a generic markdown file.

## R1 Observed Gap

That pattern weakens Reverse and add-impl traceability because the generated
artifact exists, but the database and review gates cannot reliably classify it
as design, test-design, or PLAN evidence.

## R2 Alignment

`plan-governance` now derives the expected type for the currently specified
paths: `docs/design/`, `docs/test-design/`, and `docs/plans/`. The gate is
limited to these explicit requirement paths to avoid overreaching into source or
runtime artifact naming.

## R3 / R4 Outcome

The requirements no longer describe path/type validation as future work.
Mismatches fail with `artifact_type_mismatch`, and regression tests cover design,
test-design, and PLAN path classes.

## DoD

- [x] Requirements state path/type mismatch as a current fail-close rule.
- [x] PLAN governance emits `artifact_type_mismatch`.
- [x] Regression tests cover design, test-design, and PLAN path mismatches.
