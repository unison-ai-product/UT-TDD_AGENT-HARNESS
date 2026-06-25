---
plan_id: PLAN-L7-117-kind-layer-governance-gate
title: "PLAN-L7-117: kind layer governance gate"
kind: add-impl
layer: L7
drive: db
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
agent_slots:
  - role: tl
    slot_label: "TL - kind layer governance gate"
generates:
  - artifact_path: docs/plans/PLAN-L7-117-kind-layer-governance-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-117-kind-layer-governance-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: src/plan/lint.ts
    artifact_type: source_module
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-116-required-agent-role-gate.md
  requires:
    - docs/plans/PLAN-L7-116-required-agent-role-gate.md
    - docs/plans/PLAN-REVERSE-117-kind-layer-governance-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T12:45:00+09:00"
    tests_green_at: "2026-06-23T12:45:00+09:00"
    verdict: approve
    scope: "Plan-governance kind/layer compatibility lint and regression tests."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun test tests\\plan-lint.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T12:45:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:ba64ea807951fdf6b3c3d0891e5525afe5b32e9599129db35e6870da0706826d"
      - kind: lint
        command: "bun run src\\cli.ts plan lint --gate governance"
        runner: bun
        scope: gate
        exit_code: 0
        completed_at: "2026-06-23T12:45:00+09:00"
        evidence_path: src/plan/lint.ts
        output_digest: "sha256:40c960d0d4d0b49ef3aff27e12291b7a5851077e6fdcf7aca1868bdf0d964510"
---

# PLAN-L7-117: kind layer governance gate

## Objective

Prevent PLAN authoring work from being filed into the wrong layer. Reverse and
additive implementation work must not hide design updates inside an execution
layer.

## Scope

- Add `kind_layer_mismatch` to `plan-governance`.
- Enforce only for new or updated PLANs from 2026-06-23 onward.
- Cover `design`, `add-design`, `impl`, `add-impl`, `refactor`, `retrofit`,
  `troubleshoot`, and `research`.
- Keep `master_hub=true` as the explicit exception for layer aggregation plans.

## Acceptance Criteria

- New/updated design work outside L1-L6 fails.
- New/updated add-design work outside L3-L6 fails.
- New/updated implementation and recovery execution kinds outside L7 fail.
- New/updated research work outside L1-L4 fails.
- Master hub plans remain valid.
