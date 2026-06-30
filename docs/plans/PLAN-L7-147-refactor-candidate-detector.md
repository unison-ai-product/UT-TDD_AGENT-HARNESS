---
plan_id: PLAN-L7-147-refactor-candidate-detector
title: "PLAN-L7-147: refactor candidate detector projection"
kind: impl
layer: L7
drive: db
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
agent_slots:
  - role: se
    slot_label: "SE - DB projection refactor candidate detector"
  - role: tl
    slot_label: "TL - behavior-invariant detector review"
generates:
  - artifact_path: docs/plans/PLAN-L7-147-refactor-candidate-detector.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/refactor-candidates.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-133-refactor-brush-up-workflow.md
  requires:
    - docs/plans/PLAN-L7-133-refactor-brush-up-workflow.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T14:05:55+09:00"
    tests_green_at: "2026-06-25T14:05:55+09:00"
    verdict: approve
    scope: "Refactor candidate detector projects typed structural candidates into quality_signals and feedback_events without schema changes."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T14:05:55+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:78ce69d4b918cdeff0774af84fea9a6e15d84d8575760d985d0a433c9f638a1e"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T14:05:55+09:00"
        evidence_path: src/state-db/refactor-candidates.ts
        output_digest: "sha256:0e270c1572d46850fe94dd43359a38c04b75ecc7b23a62cf8bf983f74c8f601a"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T14:05:55+09:00"
        evidence_path: src/state-db/projection-writer.ts
        output_digest: "sha256:a012f9d5ad6c4fdcc9de0efbf86d8c4f245a027e8cd8dc576fcb0e0ae744fc6f"
---

# PLAN-L7-147: refactor candidate detector projection

## Objective

Materialize the Refactor mode's database-triggered candidate surface so
structural brush-up work can be found from `harness.db`, not only from manual
memory or prose handover.

## Scope

- Add a deterministic source scanner for behaviour-invariant refactor candidate
  kinds.
- Project candidates into existing `quality_signals` rows with
  `metric=refactor_candidate:<kind>`.
- Reuse the existing `feedback_events` projection so candidates appear in the
  takeover / feedback surface.
- Keep schema unchanged; this is an additive projection over existing tables.

## Candidate Kinds

- `split-module`: module is large enough or export-heavy enough to warrant
  splitting.
- `extract-helper`: a function body is large enough to warrant helper
  extraction.
- `deduplicate-function`: two or more functions have the same normalized body.
- `externalize-literal`: the same nontrivial literal repeats enough times to
  warrant a named constant or config boundary.

## Acceptance Criteria

- Pure detector test covers all four candidate kinds.
- Rebuild projection writes candidate rows to `quality_signals`.
- Existing feedback projection exposes the candidate as a `feedback_events`
  row.
- `bun run vitest run tests\projection-writer.test.ts` passes.
- `bun run typecheck` passes.
