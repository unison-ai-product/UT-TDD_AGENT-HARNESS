---
plan_id: PLAN-REVERSE-108-review-green-command-evidence
title: "PLAN-REVERSE-108: Green command evidence fullback"
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
    reason: "Requirements now define green_commands as the hard evidence required for new confirmed review_evidence."
  - layer: L4-basic-design
    decision: updated
    evidence_path: docs/design/harness/L4-basic-design/function.md
    reason: "L4 workflow/review contract now states that green review evidence must include green_commands for new confirmed/completed entries."
  - layer: L5-detailed-design
    decision: updated
    evidence_path: docs/design/harness/L5-detailed-design/physical-data.md
    reason: "L5 physical data now maps review_evidence.green_commands into test_runs / quality_signals green compliance."
agent_slots:
  - role: tl
    slot_label: "TL - green command evidence reverse fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-108-review-green-command-evidence.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-108-review-green-command-evidence.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/test-before-review.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-108-review-green-command-evidence.md
  requires:
    - docs/plans/PLAN-L7-108-review-green-command-evidence.md
---

# PLAN-REVERSE-108: Green command evidence fullback

## R0 Evidence

The review evidence gate previously checked only `tests_green_at <= reviewed_at`.
That left green content as prose: a PLAN could say tests were green without a
machine-readable command, runner, scope, exit code, evidence path, or digest.

## R1 Observed Gap

This is the same class of gap as the progress-color DB idea: a green state must
be tied to test evidence, otherwise the database can only preserve labels. The
Reverse path also needs explicit requirements/design back-propagation so
implementation does not outrun the design documents.

## R2 Alignment

The fix belongs in `review-evidence` lint and frontmatter schema. It is a
governance/DB readiness invariant, not a product runtime feature. Requirements
define the hard rule; L6 test-before-review defines the contract and the
GreenDefinition carry.

## R3 / R4 Outcome

New or updated confirmed/completed review evidence from 2026-06-23 onward must
include `green_commands[]`. Each command must record kind, command, runner,
scope, exit code 0, evidence path, and SHA-256 digest. Missing or invalid command
evidence is a doctor-visible hard violation.

## DoD

- [x] Requirements updated with the IMP-108 hard gate.
- [x] L4 basic design updated with the workflow/review contract.
- [x] L5 detailed design updated with DB projection semantics.
- [x] L6 function design updated with current `green_commands[]` invariant.
- [x] L7 implementation and frontmatter schema updated.
- [x] Unit tests cover legacy compatibility, missing evidence, valid evidence,
  and nonzero exit rejection.
