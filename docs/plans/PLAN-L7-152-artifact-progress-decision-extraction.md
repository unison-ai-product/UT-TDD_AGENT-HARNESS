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
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
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
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:76825939ad6fd3e16a3c4225beada88354d62666a8deade364be07280e0c3320"
        anchor_commit: 3f9adfea88616ba33fe8ff23aebc730c4b0c9cb3
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T17:14:20+09:00"
        evidence_path: src/state-db/artifact-progress-decision.ts
        output_digest: "sha256:94649018e5c8e51acb161ddc371df0237e0014499d2ae378cf061d3ac3eb06eb"
        anchor_commit: 6df9a823a9de546e394f5224c80eb740d73a7993
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/state-db/projection-writer.ts
        output_digest: "sha256:1a61852bc66a939e4624a516ec9b5a5a4147becd6ac8e06842b25bca7e51bd1a"
        anchor_commit: b3904eca7a50e185da4aeb1fa4177f0b3b64e271
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
