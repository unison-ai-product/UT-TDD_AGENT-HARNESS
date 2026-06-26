---
plan_id: PLAN-L7-169-relation-graph-type-split
title: "PLAN-L7-169: relation graph type split"
kind: refactor
layer: L7
drive: agent
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant split of relation graph type definitions. Projection, impact analysis, diagram export, and evidence projection behavior remain unchanged."
agent_slots:
  - role: se
    slot_label: "SE - relation graph type split"
  - role: tl
    slot_label: "TL - relation graph invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-169-relation-graph-type-split.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/relation-graph.ts
    artifact_type: source_module
  - artifact_path: src/lint/relation-graph-types.ts
    artifact_type: source_module
  - artifact_path: src/lint/relation-graph-evidence.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph.test.ts
    artifact_type: test_code
  - artifact_path: tests/relation-graph-loader.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-168-verification-profile-type-split.md
  requires:
    - docs/process/modes/refactor.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T21:17:30+09:00"
    tests_green_at: "2026-06-25T21:17:30+09:00"
    verdict: approve
    scope: "Extract relation graph public type model to a sidecar module while preserving relation-graph re-exports."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:16:39+09:00"
        evidence_path: tests/relation-graph.test.ts
        output_digest: "sha256:8fc2b804d2261a292e8088835576e390f1e01ad14d1729b1131d78b1efe7b0c8"
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph-loader.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:16:43+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:8b119a0324d46bf51628db846951cb9745c10bcb15f7017cc970e3b66a49af2b"
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:16:39+09:00"
        evidence_path: src/lint/relation-graph.ts
        output_digest: "sha256:50db752915d778c7e590d6748fde1eaa73b2ddb22a80aa2e80c4ab6db356dca1"
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:16:39+09:00"
        evidence_path: src/lint/relation-graph-types.ts
        output_digest: "sha256:ec29890a2d01897c2bf3a05bbc7290783cfdf2342f998ade0da5a7fcc98975e7"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T21:17:10+09:00"
        evidence_path: src/lint/relation-graph-evidence.ts
        output_digest: "sha256:727e8a25d9373fa69dff910467c5699dfcfd761795b4fdb06c82e6e069f16570"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T21:17:02+09:00"
        evidence_path: src/lint/relation-graph.ts
        output_digest: "sha256:50db752915d778c7e590d6748fde1eaa73b2ddb22a80aa2e80c4ab6db356dca1"
---

# PLAN-L7-169: relation graph type split

## Objective

Reduce the remaining `split-module` pressure on
`src/lint/relation-graph.ts` by extracting its public type model.

## Scope

- Move relation graph projection, impact analysis, diagram, and evidence input
  type definitions to `src/lint/relation-graph-types.ts`.
- Preserve existing imports by re-exporting moved types from
  `src/lint/relation-graph.ts`.
- Point `src/lint/relation-graph-evidence.ts` at the type sidecar.

## Acceptance Criteria

- `tests/relation-graph.test.ts`, `tests/relation-graph-loader.test.ts`,
  typecheck, lint, DB rebuild, and doctor pass.
- The public relation graph type import surface remains compatible.
- The refactor detector no longer reports `src/lint/relation-graph.ts` as a
  `split-module` candidate.
