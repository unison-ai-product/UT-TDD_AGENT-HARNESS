---
plan_id: PLAN-L7-152-artifact-progress-decision-extraction
title: "PLAN-L7-152: artifact progress decision extraction"
kind: refactor
layer: L7
drive: db
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant extraction inside the existing harness.db projection boundary. No persisted schema, CLI behavior, requirement semantics, or workflow state semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - artifact progress decision extraction"
  - role: tl
    slot_label: "TL - behavior invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-152-artifact-progress-decision-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/artifact-progress-decision.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-150-refactor-candidate-closure-sweep.md
  requires:
    - docs/plans/PLAN-L7-150-refactor-candidate-closure-sweep.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T17:15:00+09:00"
    tests_green_at: "2026-06-25T17:15:00+09:00"
    verdict: approve
    scope: "Behavior-invariant extraction of artifact progress decision policy from projection-writer."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T17:14:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:54a0128ece0ed84a75ca94323c74181c81089262a4ef81d406621640215a82dd"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T17:14:20+09:00"
        evidence_path: src/state-db/artifact-progress-decision.ts
        output_digest: "sha256:94649018e5c8e51acb161ddc371df0237e0014499d2ae378cf061d3ac3eb06eb"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T17:14:05+09:00"
        evidence_path: src/state-db/projection-writer.ts
        output_digest: "sha256:3ec94213b5788a3dbce52c375a7dcbf01593c233c47d8afcd88e55da869ff4af"
---

# PLAN-L7-152: artifact progress decision extraction

## Objective

Reduce the `projection-writer.ts` split-module candidate by moving the pure
artifact progress decision policy into a focused module.

## Scope

- Extract `deriveArtifactProgressDecision` and its exported types to
  `src/state-db/artifact-progress-decision.ts`.
- Keep `src/state-db/projection-writer.ts` public exports stable through
  re-export.
- Update existing projection writer tests to import the pure decision helper
  directly from the new module.

## Acceptance Criteria

- Artifact progress decision behavior remains unchanged.
- Existing `projection-writer` rebuild tests still pass.
- `bun run typecheck`, `bun run lint`, DB rebuild, and doctor pass.
