---
plan_id: PLAN-L7-133-refactor-brush-up-workflow
title: "PLAN-L7-133: refactor brush-up workflow hardening"
kind: add-impl
layer: L7
drive: agent
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
agent_slots:
  - role: tl
    slot_label: "TL - refactor brush-up workflow hardening"
generates:
  - artifact_path: docs/process/modes/refactor.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L3-functional/functional-requirements.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: src/workflow/contracts.ts
    artifact_type: source_module
  - artifact_path: tests/workflow-contracts.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires:
    - docs/plans/PLAN-L6-00-master.md
    - docs/plans/PLAN-REVERSE-133-refactor-brush-up-workflow.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T18:11:57+09:00"
    tests_green_at: "2026-06-23T18:11:57+09:00"
    verdict: approve
    scope: "Refactor mode now requires test-ID-linked green evidence and records DB-trigger/dependency-impact boundaries."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts -t \"implements routing\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T18:11:57+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:2a08f62b3f8de0104c840e9941a3c33fc6b4c26e66e0ba47070f6398d93d6590"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T18:11:57+09:00"
        evidence_path: src/workflow/contracts.ts
        output_digest: "sha256:fff49252866a549ac96498c868bc193410867829a119f1a93d9d52e36551e791"
---

# PLAN-L7-133: refactor brush-up workflow hardening

## Objective

Make the existing Refactor drive model explicit enough to support
TDD-style brush-up refactoring and future DB-triggered refactor candidates.

## Scope

- Replace the unreadable Refactor mode document with a clean canonical workflow.
- Define Red / Yellow / Green semantics for Refactor.
- Record that `harness.db` can trigger Refactor candidates from findings,
  quality signals, feedback events, relation-graph impact, and artifact progress
  projection rows.
- Tighten `assertRefactorInvariant` so Green requires linked regression test IDs.
- Add regression coverage for the missing-test-ID failure.

## Acceptance Criteria

- Refactor mode states are documented as behaviour-invariant brush-up states.
- DB-triggered Refactor is documented without making DB the authoring source.
- Relation-graph dependency impact is part of the Refactor Green condition.
- `assertRefactorInvariant` fails when no regression test ID is linked.
- Targeted workflow contract tests pass.
