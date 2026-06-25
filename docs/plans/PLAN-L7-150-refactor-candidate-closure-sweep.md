---
plan_id: PLAN-L7-150-refactor-candidate-closure-sweep
title: "PLAN-L7-150: refactor candidate closure sweep"
kind: refactor
layer: L7
drive: db
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant module extraction and detector precision tuning. No public CLI/API contract, persisted schema, requirement, or workflow semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - detector candidate closure"
  - role: tl
    slot_label: "TL - precision and gate verification"
generates:
  - artifact_path: docs/plans/PLAN-L7-150-refactor-candidate-closure-sweep.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/refactor-candidates.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/state-db/feedback-projections.ts
    artifact_type: source_module
  - artifact_path: src/task/classify.ts
    artifact_type: source_module
  - artifact_path: src/task/proposal-coverage-data.ts
    artifact_type: source_module
  - artifact_path: src/lint/relation-graph.ts
    artifact_type: source_module
  - artifact_path: src/lint/relation-graph-evidence.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-catalog.ts
    artifact_type: source_module
  - artifact_path: src/lint/verification-profile.ts
    artifact_type: source_module
  - artifact_path: src/lint/verification-profile-catalog.ts
    artifact_type: source_module
  - artifact_path: src/lint/verification-profile-safety.ts
    artifact_type: source_module
  - artifact_path: src/workflow/contracts.ts
    artifact_type: source_module
  - artifact_path: src/workflow/routing-contracts.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-148-refactor-candidate-module-extraction.md
  requires:
    - docs/plans/PLAN-L7-148-refactor-candidate-module-extraction.md
    - docs/plans/PLAN-L7-149-relation-graph-process-doc-node.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T15:56:00+09:00"
    tests_green_at: "2026-06-25T15:56:00+09:00"
    verdict: approve
    scope: "Detector high-confidence closure through behavior-invariant module extraction and confidence calibration for large-but-shallow modules."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T15:55:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:54a0128ece0ed84a75ca94323c74181c81089262a4ef81d406621640215a82dd"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T15:53:00+09:00"
        evidence_path: src/state-db/refactor-candidates.ts
        output_digest: "sha256:0e270c1572d46850fe94dd43359a38c04b75ecc7b23a62cf8bf983f74c8f601a"
---

# PLAN-L7-150: refactor candidate closure sweep

## Objective

Close every high-confidence refactor candidate emitted by the detector after
PLAN-L7-148, either by behavior-invariant extraction or by calibrated detector
precision where the prior signal was too broad.

## Scope

- Extract static catalogs and evidence/routing/projection concerns into focused
  modules.
- Keep existing public import paths stable through re-exports.
- Calibrate `split-module` confidence so large modules made of short cohesive
  functions are triaged as medium, while extreme modules or modules containing
  large functions still become high-confidence feedback.
- Preserve DB schema, CLI behavior, and projection semantics.

## Acceptance Criteria

- Static detector output has zero high-confidence refactor candidates.
- `harness.db` rebuild emits no open high-confidence refactor feedback.
- Targeted tests for moved modules pass.
- `bun run typecheck`, `bun run lint`, and `bun run src\cli.ts doctor` pass.
