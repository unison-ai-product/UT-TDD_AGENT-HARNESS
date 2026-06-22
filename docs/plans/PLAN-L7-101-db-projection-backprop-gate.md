---
plan_id: PLAN-L7-101-db-projection-backprop-gate
title: "PLAN-L7-101: DB projection backprop gate"
kind: add-impl
layer: L7
drive: db
status: confirmed
created: 2026-06-22
updated: 2026-06-22
owner: Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
agent_slots:
  - role: tl
    slot_label: "TL - regression gate for DB projection backprop"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-101-db-projection-backprop-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-101-db-projection-backprop-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/plan/lint.ts
    artifact_type: source_module
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-56-artifact-progress-state.md
  requires:
    - docs/plans/PLAN-L7-56-artifact-progress-state.md
    - docs/plans/PLAN-REVERSE-56-artifact-progress-state.md
    - docs/plans/PLAN-REVERSE-101-db-projection-backprop-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "plan-governance regression gate for progress color DB projection backprop"
    worker_model: codex
    reviewer_model: codex-intra-runtime
---

# PLAN-L7-101: DB projection backprop gate

## Objective

Prevent a repeat of the artifact progress color miss where L7 DB implementation introduced a
user-visible state contract before requirements, basic design, detailed design, and Reverse
fullback evidence were present.

## Root Cause

`PLAN-L7-56` originally treated the artifact progress colors as an implementation-local DB
projection. Existing `descent-obligation` and `fr-unit-coverage` gates are strong after an FR is
registered upstream, but they did not fail an L7 DB projection that created the user-visible
`red` / `yellow` / `green` contract before that upstream registration existed.

`plan-governance` also checked frontmatter validity, dependencies, parent drive, and artifact
existence, but it had no category-specific rule for "progress color DB projection must carry
Reverse/fullback and V-model backprop artifacts".

## Countermeasure

Add a `db_projection_backprop_missing` plan-governance violation for L7 DB implementation plans
that touch `src/schema/harness-db.ts` or `src/state-db/projection-writer.ts` and introduce progress
color semantics such as `artifact_progress` / `red/yellow/green`.

Such plans must include:

- Reverse fullback evidence through a generated or required `PLAN-REVERSE-*`.
- Requirements document update.
- L1 functional and screen requirements.
- L3 functional carry.
- L4 function building block.
- L5 physical-data semantics.
- L6 function specification and FR/unit coverage.

## Acceptance Criteria

- A fixture PLAN that adds `artifact_progress` / `red/yellow/green` projection code without
  upstream artifacts fails with `db_projection_backprop_missing`.
- A fixture PLAN with Reverse fullback and L1-L6 generated artifacts passes the new gate.
- Existing plan governance checks remain compatible with foundation DB plans that do not introduce
  progress color semantics.
- `bun test tests/plan-lint.test.ts` passes.
- `bun run typecheck` passes.
- `bun run lint` passes.
- `bun run src/cli.ts doctor` is run and its result is recorded.
