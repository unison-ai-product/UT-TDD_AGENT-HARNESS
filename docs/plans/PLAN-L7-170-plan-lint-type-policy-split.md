---
plan_id: PLAN-L7-170-plan-lint-type-policy-split
title: "PLAN-L7-170: plan lint type and policy split"
kind: refactor
layer: L7
drive: agent
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant split of plan lint types and policy constants. Schedule, governance, G1, and G3 lint behavior remains unchanged."
agent_slots:
  - role: se
    slot_label: "SE - plan lint type/policy split"
  - role: tl
    slot_label: "TL - plan lint invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-170-plan-lint-type-policy-split.md
    artifact_type: markdown_doc
  - artifact_path: src/plan/lint.ts
    artifact_type: source_module
  - artifact_path: src/plan/lint-types.ts
    artifact_type: source_module
  - artifact_path: src/plan/lint-policy.ts
    artifact_type: source_module
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-169-relation-graph-type-split.md
  requires:
    - docs/process/modes/refactor.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T21:25:20+09:00"
    tests_green_at: "2026-06-25T21:25:20+09:00"
    verdict: approve
    scope: "Extract plan lint public types and policy constants to sidecar modules while preserving lint behavior and exports."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\plan-lint.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:24:52+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:df3fd213a06f05be1cb8e3ad0d771b0d164538598d617b3a53ec333ef0dc9fb6"
      - kind: unit_test
        command: "bun run vitest run tests\\plan-lint.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:24:52+09:00"
        evidence_path: src/plan/lint.ts
        output_digest: "sha256:937ff982b0c5b3fac499a9d78e745dadeb12dae1e49801aaf7a04c5a4fc3ff66"
      - kind: unit_test
        command: "bun run vitest run tests\\plan-lint.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:24:52+09:00"
        evidence_path: src/plan/lint-types.ts
        output_digest: "sha256:4800f15a5e8662336101ab2c2ba9ad8329539e6ea75b9b2c73d51669e1b7f022"
      - kind: unit_test
        command: "bun run vitest run tests\\plan-lint.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:24:52+09:00"
        evidence_path: src/plan/lint-policy.ts
        output_digest: "sha256:ff2a6177eb10aeee0a7183ba27c2cbb6b3f9dc5c2dbf475c3d63bf57db3f64d6"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T21:25:03+09:00"
        evidence_path: src/plan/lint.ts
        output_digest: "sha256:937ff982b0c5b3fac499a9d78e745dadeb12dae1e49801aaf7a04c5a4fc3ff66"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T21:24:53+09:00"
        evidence_path: src/plan/lint-policy.ts
        output_digest: "sha256:ff2a6177eb10aeee0a7183ba27c2cbb6b3f9dc5c2dbf475c3d63bf57db3f64d6"
---

# PLAN-L7-170: plan lint type and policy split

## Objective

Reduce remaining `split-module` pressure on `src/plan/lint.ts` while keeping
plan lint behavior unchanged.

## Scope

- Move public plan lint result/doc/violation types to `src/plan/lint-types.ts`.
- Move schedule/governance policy constants to `src/plan/lint-policy.ts`.
- Preserve imports from `src/plan/lint.ts` through type re-exports.

## Acceptance Criteria

- `tests/plan-lint.test.ts`, typecheck, lint, DB rebuild, and doctor pass.
- `src/plan/lint.ts` falls below the `split-module` threshold.
- The refactor detector no longer reports `src/plan/lint.ts` as a
  `split-module` candidate.
