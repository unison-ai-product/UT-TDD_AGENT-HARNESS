---
plan_id: PLAN-L7-56-artifact-progress-state
title: "PLAN-L7-56: DB-backed artifact progress color projection"
kind: add-impl
layer: L7
drive: db
status: confirmed
created: 2026-06-22
updated: 2026-06-23
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
    - PLAN-REVERSE-56-artifact-progress-state
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T19:50:00+09:00"
    tests_green_at: "2026-06-23T19:50:00+09:00"
    verdict: approve
    scope: "artifact_progress DB projection, CLI read model, schema/design coverage, and targeted Vitest evidence"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\projection-writer.test.ts tests\\db-projection-ingestion.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T19:44:07+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:54a0128ece0ed84a75ca94323c74181c81089262a4ef81d406621640215a82dd"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T19:44:07+09:00"
        evidence_path: src/state-db/projection-writer.ts
        output_digest: "sha256:3ec94213b5788a3dbce52c375a7dcbf01593c233c47d8afcd88e55da869ff4af"
---

# PLAN-L7-56: DB-backed artifact progress color projection

## Objective

Add a rebuildable `artifact_progress` projection so implementation status is queryable from
harness.db instead of being held only in chat memory.

The color contract is:

- red: dependency check is missing or there is an open dependency impact.
- yellow: implemented but no linked passing test run yet, or recovery work is in progress.
- green: linked passing `test_runs` evidence exists and dependency impacts are clear.

## Scope

- Add an `artifact_progress` table and indexes to the harness.db schema registry.
- Project rows from relation graph source/design/test-design/plan/requirement nodes,
  `covered-by` / `pairs` edges, passing `test_runs`, active recovery PLANs, and open
  `impact_results`.
- Project `artifact_progress_events` and mirror red/yellow progress rows into
  `feedback_events` so workflow recovery can start from DB state.
- Add `ut-tdd progress artifacts` for read-only inspection of the projected colors.
- Cover the color derivation and DB projection path with Vitest.
- Document the requirement/design chain in requirements §6.8.6/§6.8.7, L1 FR-L1-51, L3 carry,
  L4 function building block, L5 physical data, and L6 function/unit coverage so this implementation does not remain a
  lower-layer-only change.

## Acceptance Criteria

- `bun test tests/projection-writer.test.ts tests/db-projection-ingestion.test.ts` passes.
- `bun run typecheck` passes.
- `bun run lint` passes.
- `bun run src/cli.ts db rebuild --json` populates `artifact_progress`.
- `bun run src/cli.ts progress artifacts --json` returns rows with `red` / `yellow` / `green`,
  `passed_test_run_ids`, `dependency_check_run_id`, and `recovery_plan_ids` compatible fields.
- FR-L1-51 is present in L1 functional requirements, screen trace, L3 carry, and L4 function
  building blocks.
- FR-L1-51 is present in L6 `function-spec.md` and `fr-unit-coverage.md`.
- `physical-data.md` defines the color invariants: red for missing dependency/back-propagation,
  yellow for implemented/recovery/unverified, green for linked passing test run + dependency clear.
- `bun run src/cli.ts doctor` passes.

## Notes

This PLAN intentionally keeps `artifact_progress` as derived data. It is safe to delete and rebuild
from relation graph, test catalog, and impact result projections.

2026-06-23 hardening: DB workflow coupling now uses `test_runs` pass evidence and relation-impact
check metadata. Static test links alone are yellow, not green. Red/yellow rows become
`feedback_events` with `source_table=artifact_progress`, and `artifact_progress_events` provides a
rebuildable event view for trigger consumers.
