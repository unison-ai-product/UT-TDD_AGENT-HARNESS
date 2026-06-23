---
plan_id: PLAN-REVERSE-109-review-green-command-db-projection
title: "PLAN-REVERSE-109: Review green command DB projection fullback"
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
    decision: not_impacted
    reason: "PLAN-L7-108 already added the requirements-level green_commands rule; this slice wires the existing rule into DB projection."
  - layer: L4-basic-design
    decision: not_impacted
    reason: "The external workflow/review contract does not change; only the L5 physical projection implementation is connected."
  - layer: L5-detailed-design
    decision: updated
    evidence_path: docs/design/harness/L5-detailed-design/physical-data.md
    reason: "L5 physical data now records that projectReviewEvidenceRegistry projects review_evidence.green_commands into test_runs."
agent_slots:
  - role: tl
    slot_label: "TL - review green command DB projection fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-109-review-green-command-db-projection.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-109-review-green-command-db-projection.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-109-review-green-command-db-projection.md
  requires:
    - docs/plans/PLAN-L7-109-review-green-command-db-projection.md
---

# PLAN-REVERSE-109: Review green command DB projection fullback

## R0 Evidence

PLAN-L7-108 made green command evidence mandatory for new review evidence and
added `test_runs.output_digest`, but harness.db rebuild still left `test_runs`
empty for those frontmatter records.

## R1 Observed Gap

The DB could enforce the presence of green command evidence via doctor, but could
not answer which PLAN/test command/evidence path produced the green state. That
kept the user's red/yellow/green DB progress idea partially doc-only.

## R2 Alignment

The projection belongs in `projectReviewEvidenceRegistry`: review evidence is the
authoring source, while `test_runs` is the query surface. This is a narrower
implementation of IMP-109; general UT runner ingestion remains future scope.

## R3 / R4 Outcome

`review_evidence.green_commands[]` is now projected into `test_runs` on rebuild.
The row carries command, runner, scope, exit code, completed timestamp, evidence
path, output digest, and PLAN id.

## DoD

- [x] L5 physical data records the implemented projection.
- [x] L7 projection writer emits `test_runs` rows from green command evidence.
- [x] Focused regression test verifies PLAN-L7-108 appears in `test_runs`.
