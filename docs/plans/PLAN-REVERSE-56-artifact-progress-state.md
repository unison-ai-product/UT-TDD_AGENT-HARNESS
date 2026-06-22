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
updated: 2026-06-22
owner: Codex
forward_routing: L5
promotion_strategy: reuse-as-is
agent_slots:
  - role: tl
    slot_label: "TL - artifact progress fullback review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-56-artifact-progress-state.md
    artifact_type: markdown_doc
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

The implementation surfaced one required lower-layer update: `physical-data.md` needed to declare
the projection table and indexes so `db-projection-coverage` can guard schema drift.

## R2 Alignment

The projection remains derived data. Authoring truth stays in source files, tests, PLAN frontmatter,
relation graph projection, and impact results. No new product workflow phase is introduced.

## R3 / R4 Outcome

Fullback is complete: physical data design now includes `artifact_progress`, the PLAN owns the
schema/projection/CLI/test changes, and the DB projection gates verify the table is populated.

## DoD

- [x] Forward L7 implementation is identified.
- [x] Lower-layer design impact is classified.
- [x] Required design update is applied.
- [x] No additional backlog item is required for this minimal DB read model.
