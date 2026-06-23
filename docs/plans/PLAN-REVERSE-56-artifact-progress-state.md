---
plan_id: PLAN-REVERSE-56-artifact-progress-state
title: "PLAN-REVERSE-56: artifact progress state fullback"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: db
status: confirmed
created: 2026-06-22
updated: 2026-06-23
owner: Codex
forward_routing: L5
promotion_strategy: reuse-as-is
backprop_scope:
  - layer: requirements
    decision: updated
    evidence_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    reason: "Requirements define the artifact progress color contract."
  - layer: L4-basic-design
    decision: updated
    evidence_path: docs/design/harness/L4-basic-design/function.md
    reason: "Basic design records the artifact progress projection building block."
  - layer: L5-detailed-design
    decision: updated
    evidence_path: docs/design/harness/L5-detailed-design/physical-data.md
    reason: "Detailed design records the physical artifact progress state semantics."
agent_slots:
  - role: tl
    slot_label: "TL - artifact progress fullback review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-56-artifact-progress-state.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L1-requirements/functional-requirements.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L1-requirements/screen-requirements.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L3-functional/functional-requirements.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/fr-unit-coverage.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-56-artifact-progress-state.md
  requires:
    - docs/plans/PLAN-L7-56-artifact-progress-state.md
---

# PLAN-REVERSE-56: artifact progress state fullback

## R0 Evidence

PLAN-L7-56 added `artifact_progress` as a rebuildable harness.db projection. The implementation
derives red/yellow/green rows from relation graph source nodes, linked `covered-by` test edges, and
open impact results.

## R1 Observed Gap

The implementation surfaced a higher-level design gap, not only a physical-data gap:

- L1 functional requirements did not have an artifact-level progress color requirement.
- L1 screen requirements did not say where red/yellow/green artifact state is visible.
- L3 carry and L4 function building blocks did not include the progress projection.
- L6 function/unit coverage did not include deterministic contracts for the progress color decision.
- governance requirements §6.8.6/§6.8.7 did not define the color contract.
- `physical-data.md` declared the table but needed explicit color invariants.

## R2 Alignment

The projection remains derived data. Authoring truth stays in source files, tests, PLAN frontmatter,
relation graph projection, impact results, and recovery/fullback PLANs. No new product workflow
phase is introduced, but a new P1 requirement is registered as FR-L1-51 because the color contract
is user-visible progress management semantics rather than a hidden DB implementation detail.

## R3 / R4 Outcome

Fullback is complete: requirements §6.8.6/§6.8.7, L1 FR-L1-51, screen trace, L3 carry, L4 function
building block, and L5 physical-data color invariants now describe the same contract as the
schema/projection/CLI/test implementation.

L6 follow-up is also complete: `function-spec.md` defines `deriveArtifactProgressDecision` /
`projectArtifactProgress`, and `fr-unit-coverage.md` maps FR-L1-51 to U-FR-L1-51.

2026-06-23 hardening closes the workflow-coupling gap inside the same fullback scope:
`artifact_progress` now requires linked passing `test_runs` evidence for green, records
relation-impact check metadata, covers source/design/test-design/plan/requirement nodes, records
recovery PLAN links, and mirrors red/yellow rows into `feedback_events` as DB-triggerable workflow
inputs.

## DoD

- [x] Forward L7 implementation is identified.
- [x] Lower-layer and upper-layer design impact is classified.
- [x] Requirements-level update is applied.
- [x] Basic design and detailed design updates are applied.
- [x] L6 function contract and FR unit coverage are applied.
- [x] No additional backlog item is required for this DB read model; the gap is closed by fullback.
