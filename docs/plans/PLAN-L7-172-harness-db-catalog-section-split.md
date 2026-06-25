---
plan_id: PLAN-L7-172-harness-db-catalog-section-split
title: "PLAN-L7-172: harness DB catalog section split"
kind: refactor
layer: L7
drive: db
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant split of harness DB table/index catalog sections. Schema table and index definitions are preserved in the same exported order."
agent_slots:
  - role: se
    slot_label: "SE - harness DB catalog split"
  - role: tl
    slot_label: "TL - DB schema invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-172-harness-db-catalog-section-split.md
    artifact_type: markdown_doc
  - artifact_path: src/schema/harness-db-catalog.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-table-builders.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-tables-core.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-tables-graph.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-tables-evaluation.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-indexes.ts
    artifact_type: source_module
  - artifact_path: tests/state-db.test.ts
    artifact_type: test_code
  - artifact_path: tests/db-projection-ingestion.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-171-workflow-contracts-type-cleanup.md
  requires:
    - docs/process/modes/refactor.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T21:54:10+09:00"
    tests_green_at: "2026-06-25T21:54:10+09:00"
    verdict: approve
    scope: "Split harness DB catalog tables and indexes into section modules while preserving schema migration behavior."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\state-db.test.ts tests\\db-projection-ingestion.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:53:34+09:00"
        evidence_path: tests/state-db.test.ts
        output_digest: "sha256:bfb3698fc15d79cd071c389e1b2cd1c805cd8e561526bb26eeed839bb829d587"
      - kind: unit_test
        command: "bun run vitest run tests\\state-db.test.ts tests\\db-projection-ingestion.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:53:34+09:00"
        evidence_path: tests/db-projection-ingestion.test.ts
        output_digest: "sha256:f8473f1164e98f02ca1d0e825386dae7504dd29580edd87fed3a86d17c2df15b"
      - kind: unit_test
        command: "bun run vitest run tests\\state-db.test.ts tests\\db-projection-ingestion.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:53:34+09:00"
        evidence_path: src/schema/harness-db-catalog.ts
        output_digest: "sha256:81f4c66394128721249f900d053d0c6e377289f91069bde588f812224b69ff2c"
      - kind: unit_test
        command: "bun run vitest run tests\\state-db.test.ts tests\\db-projection-ingestion.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:53:34+09:00"
        evidence_path: src/schema/harness-db-tables-core.ts
        output_digest: "sha256:656786a4ff4422f7c38429075cd3cb8688c64fa5b8385f30d35d1dee0050453d"
      - kind: unit_test
        command: "bun run vitest run tests\\state-db.test.ts tests\\db-projection-ingestion.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:53:34+09:00"
        evidence_path: src/schema/harness-db-tables-graph.ts
        output_digest: "sha256:bf52681a3595d148483c2778a79bb20aabd9b95b7c14d1983ce830a4d2828937"
      - kind: unit_test
        command: "bun run vitest run tests\\state-db.test.ts tests\\db-projection-ingestion.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:53:34+09:00"
        evidence_path: src/schema/harness-db-tables-evaluation.ts
        output_digest: "sha256:6a7998736d30a0ccbc43cb997655d357d4a177096f63be2a16e822f18c4149c7"
      - kind: unit_test
        command: "bun run vitest run tests\\state-db.test.ts tests\\db-projection-ingestion.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:53:34+09:00"
        evidence_path: src/schema/harness-db-indexes.ts
        output_digest: "sha256:772549881eb241e7eaab058968ddc67ab3fe3e7cdedd07c2e3c52539df3beae1"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T21:53:33+09:00"
        evidence_path: src/schema/harness-db-table-builders.ts
        output_digest: "sha256:b84c3c8c379c25828716c8749efae34a7614f1405dd1305077377b30bc17d6d2"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T21:53:22+09:00"
        evidence_path: src/schema/harness-db-catalog.ts
        output_digest: "sha256:81f4c66394128721249f900d053d0c6e377289f91069bde588f812224b69ff2c"
---

# PLAN-L7-172: harness DB catalog section split

## Objective

Reduce remaining `split-module` pressure on `src/schema/harness-db-catalog.ts`
without changing schema definitions or migration behavior.

## Scope

- Move table-builder helpers to `src/schema/harness-db-table-builders.ts`.
- Split table definitions into core, graph/export, and evaluation/screen table
  catalog modules.
- Move index definitions to `src/schema/harness-db-indexes.ts`.
- Keep `src/schema/harness-db-catalog.ts` as the compatibility export surface.

## Acceptance Criteria

- `tests/state-db.test.ts`, `tests/db-projection-ingestion.test.ts`,
  typecheck, lint, DB rebuild, and doctor pass.
- `src/schema/harness-db-catalog.ts` falls below the `split-module` threshold.
- The refactor detector no longer reports `src/schema/harness-db-catalog.ts`
  as a `split-module` candidate.
