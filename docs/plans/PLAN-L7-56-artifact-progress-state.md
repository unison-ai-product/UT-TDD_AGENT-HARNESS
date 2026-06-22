---
plan_id: PLAN-L7-56-artifact-progress-state
title: "PLAN-L7-56: DB-backed artifact progress color projection"
kind: add-impl
layer: L7
drive: db
status: confirmed
created: 2026-06-22
updated: 2026-06-22
owner: Codex
agent_slots:
  - role: se
    slot_label: "SE - artifact progress projection implementation"
  - role: tl
    slot_label: "TL - intra-runtime review for DB projection gates"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-56-artifact-progress-state.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: markdown_doc
  - artifact_path: src/schema/harness-db.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/lint/db-projection-ingestion.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
  - artifact_path: tests/db-projection-ingestion.test.ts
    artifact_type: test_code
dependencies:
  parent: PLAN-L7-44-harness-db-master
  requires:
    - PLAN-L7-32-cross-artifact-relation-graph
    - PLAN-L7-45-harness-db-foundation
    - PLAN-L7-46-projection-writer
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "artifact_progress DB projection, CLI read model, schema/design coverage, and targeted Vitest evidence"
    worker_model: codex
    reviewer_model: codex-intra-runtime
---

# PLAN-L7-56: DB-backed artifact progress color projection

## Objective

Add a rebuildable `artifact_progress` projection so implementation status is queryable from
harness.db instead of being held only in chat memory.

The color contract is:

- red: dependency check is missing or there is an open dependency impact.
- yellow: implemented but no linked test evidence yet, or recovery work is in progress.
- green: linked test evidence exists and dependency impacts are clear.

## Scope

- Add an `artifact_progress` table and indexes to the harness.db schema registry.
- Project rows from relation graph source nodes, `covered-by` test edges, and open `impact_results`.
- Add `ut-tdd progress artifacts` for read-only inspection of the projected colors.
- Cover the color derivation and DB projection path with Vitest.
- Document the new projection table in `physical-data.md` so `db-projection-coverage` guards drift.

## Acceptance Criteria

- `bun test tests/projection-writer.test.ts tests/db-projection-ingestion.test.ts` passes.
- `bun run typecheck` passes.
- `bun run lint` passes.
- `bun run src/cli.ts db rebuild --json` populates `artifact_progress`.
- `bun run src/cli.ts progress artifacts --json` returns rows with `red` / `yellow` / `green`
  compatible fields.
- `bun run src/cli.ts doctor` passes.

## Notes

This PLAN intentionally keeps `artifact_progress` as derived data. It is safe to delete and rebuild
from relation graph, test catalog, and impact result projections.
