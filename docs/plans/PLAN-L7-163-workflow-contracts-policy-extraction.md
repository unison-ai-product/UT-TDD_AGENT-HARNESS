---
plan_id: PLAN-L7-163-workflow-contracts-policy-extraction
title: "PLAN-L7-163: workflow contracts policy extraction"
kind: refactor
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant extraction of workflow TDD drive-fit policy constants. No public CLI/API contract, persisted schema, or workflow semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - workflow contracts policy extraction"
  - role: tl
    slot_label: "TL - workflow invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-163-workflow-contracts-policy-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/workflow/contracts.ts
    artifact_type: source_module
  - artifact_path: src/workflow/contracts-policy.ts
    artifact_type: source_module
  - artifact_path: tests/workflow-contracts.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-162-team-run-policy-extraction.md
  requires:
    - docs/process/modes/refactor.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T20:15:00+09:00"
    tests_green_at: "2026-06-25T20:15:00+09:00"
    verdict: approve
    scope: "Extract workflow TDD drive-fit policy catalog into a sidecar module and keep classifyDriveTddFits as composition logic."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T20:11:58+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:2a08f62b3f8de0104c840e9941a3c33fc6b4c26e66e0ba47070f6398d93d6590"
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T20:11:58+09:00"
        evidence_path: src/workflow/contracts.ts
        output_digest: "sha256:fff49252866a549ac96498c868bc193410867829a119f1a93d9d52e36551e791"
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T20:11:58+09:00"
        evidence_path: src/workflow/contracts-policy.ts
        output_digest: "sha256:dfe68d29ecaf344bb33153dae76408dfa596172be9a98d250eb3f59c3eacfa50"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T20:15:00+09:00"
        evidence_path: src/workflow/contracts.ts
        output_digest: "sha256:fff49252866a549ac96498c868bc193410867829a119f1a93d9d52e36551e791"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T20:15:00+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:2a08f62b3f8de0104c840e9941a3c33fc6b4c26e66e0ba47070f6398d93d6590"
---

# PLAN-L7-163: workflow contracts policy extraction

## Objective

Remove the remaining `externalize-policy` candidate by extracting the workflow
TDD drive-fit catalog from `src/workflow/contracts.ts`.

## Scope

- Move `DriveTddFit`, `TddCompatibility`, and `DRIVE_TDD_FITS` to
  `src/workflow/contracts-policy.ts`.
- Keep `classifyDriveTddFits` in `src/workflow/contracts.ts` as composition
  logic over the policy catalog.
- Add direct test coverage for the sidecar policy catalog.

## Acceptance Criteria

- Workflow contract behavior remains unchanged.
- `tests/workflow-contracts.test.ts` passes and directly imports the sidecar
  policy.
- Typecheck, lint, DB rebuild, and doctor pass.
