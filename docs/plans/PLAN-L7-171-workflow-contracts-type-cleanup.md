---
plan_id: PLAN-L7-171-workflow-contracts-type-cleanup
title: "PLAN-L7-171: workflow contracts type cleanup"
kind: refactor
layer: L7
drive: agent
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant extraction of workflow contract public types and supplemental contract helpers, plus removal of obsolete commented policy data already represented in contracts-policy."
agent_slots:
  - role: se
    slot_label: "SE - workflow contracts type cleanup"
  - role: tl
    slot_label: "TL - workflow contracts invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-171-workflow-contracts-type-cleanup.md
    artifact_type: markdown_doc
  - artifact_path: src/workflow/contracts.ts
    artifact_type: source_module
  - artifact_path: src/workflow/contracts-types.ts
    artifact_type: source_module
  - artifact_path: src/workflow/contracts-extras.ts
    artifact_type: source_module
  - artifact_path: tests/workflow-contracts.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-170-plan-lint-type-policy-split.md
  requires:
    - docs/process/modes/refactor.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T21:40:10+09:00"
    tests_green_at: "2026-06-25T21:40:10+09:00"
    verdict: approve
    scope: "Extract workflow contract public types and supplemental helpers to sidecar modules while preserving the contracts.ts import surface."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:39:53+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:0b0bff7c2fdea2a365d20b26d36478896d707bf891a6caa386b846a5b9375e55"
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:39:53+09:00"
        evidence_path: src/workflow/contracts.ts
        output_digest: "sha256:6caf60cac4a0d40cc4c6a2f46b26f92f2e6707958f3462c0c643b21ad1af7fd8"
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:39:53+09:00"
        evidence_path: src/workflow/contracts-types.ts
        output_digest: "sha256:2b8dcac19d45cd742cd7f996537c26ea0fb24273762405963b2d8e66e25417da"
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:39:53+09:00"
        evidence_path: src/workflow/contracts-extras.ts
        output_digest: "sha256:879610fc9bf5ec87218f823b8741dd4a861dcddf0cc78d74ebe0051d99ebd569"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T21:40:04+09:00"
        evidence_path: src/workflow/contracts.ts
        output_digest: "sha256:6caf60cac4a0d40cc4c6a2f46b26f92f2e6707958f3462c0c643b21ad1af7fd8"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T21:39:59+09:00"
        evidence_path: src/workflow/contracts-extras.ts
        output_digest: "sha256:879610fc9bf5ec87218f823b8741dd4a861dcddf0cc78d74ebe0051d99ebd569"
---

# PLAN-L7-171: workflow contracts type cleanup

## Objective

Reduce remaining `split-module` pressure on `src/workflow/contracts.ts` without
changing workflow contract behavior.

## Scope

- Move public workflow contract result/evidence types to
  `src/workflow/contracts-types.ts`.
- Preserve imports from `src/workflow/contracts.ts` through type re-exports.
- Move supplemental asset/model/skill/catalog contract helpers to
  `src/workflow/contracts-extras.ts` and re-export them from
  `src/workflow/contracts.ts`.
- Remove obsolete commented policy data that is already represented by
  `src/workflow/contracts-policy.ts`.

## Acceptance Criteria

- `tests/workflow-contracts.test.ts`, typecheck, lint, DB rebuild, and doctor
  pass.
- `src/workflow/contracts.ts` falls below the `split-module` threshold.
- The refactor detector no longer reports `src/workflow/contracts.ts` as a
  `split-module` candidate.
