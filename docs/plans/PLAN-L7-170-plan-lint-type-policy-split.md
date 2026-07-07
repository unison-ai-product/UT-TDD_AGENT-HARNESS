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
    reviewed_at: "2026-06-30T22:30:00+09:00"
    tests_green_at: "2026-06-30T22:29:00+09:00"
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
        completed_at: "2026-06-30T22:29:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:5200049532ce0cb4b1210298bb346151ea184c90ff89440a0ef71b831eaf1653"
      - kind: unit_test
        command: "bun run vitest run tests\\plan-lint.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T22:29:00+09:00"
        evidence_path: src/plan/lint.ts
        output_digest: "sha256:096c894039dd0664cd7a60bcc6b417da34883587a278a16362296ccbb3bdf020"
      - kind: unit_test
        command: "bun run vitest run tests\\plan-lint.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T22:29:00+09:00"
        evidence_path: src/plan/lint-types.ts
        output_digest: "sha256:0b8f4972983e3b227c0139f2fdb53d915b7fc131b6e1231e265646b487fbee11"
      - kind: unit_test
        command: "bun run vitest run tests\\plan-lint.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T22:29:00+09:00"
        evidence_path: src/plan/lint-policy.ts
        output_digest: "sha256:fa101e8efd6656e885186e40e25277229885aa42909ebf669d7ae3d9c17a234f"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T22:29:00+09:00"
        evidence_path: src/plan/lint.ts
        output_digest: "sha256:096c894039dd0664cd7a60bcc6b417da34883587a278a16362296ccbb3bdf020"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T22:29:00+09:00"
        evidence_path: src/plan/lint-policy.ts
        output_digest: "sha256:fa101e8efd6656e885186e40e25277229885aa42909ebf669d7ae3d9c17a234f"
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
