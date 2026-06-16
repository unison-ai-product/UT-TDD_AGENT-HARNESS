---
plan_id: PLAN-L7-60-change-set-integrity
title: "PLAN-L7-60: change-set integrity warning/block detector"
kind: impl
layer: L7
drive: fullstack
parent_design: docs/design/harness/L6-function-design/function-spec.md
status: completed
created: 2026-06-16
updated: 2026-06-16
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: gpt-5.4
    reviewer_model: gpt-5.4
    tests_green_at: "2026-06-16"
    reviewed_at: "2026-06-16"
    verdict: pass
    scope: "change-set integrity detector with singleton/incomplete artifact warnings and dependent regression blockers"
agent_slots:
  - role: tl
    slot_label: "TL - change-set integrity detector"
generates:
  - artifact_path: src/lint/change-impact.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/change-impact.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: PLAN-L7-59-detector-hardening
  requires:
    - docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-60: change-set integrity warning/block detector

## Objective

Make the harness flag incomplete implementation sets before review:

- If a change set only touches one artifact category (`source`, `design`, or `test`), emit a warning alert.
- If `source` changes are missing design/plan or test/test-design counterparts, emit a warning alert.
- If a source change affects dependent modules and no mapped regression test is touched, block doctor progression.
- Keep warnings non-blocking and blockers fail-closed.

## Scope

- Add `analyzeChangeSetIntegrity` and `changeSetIntegrityMessages`.
- Reuse the dependency graph from `dependency-drift` to detect dependent modules.
- Wire `change-set-integrity` into `runDoctor.ok`.
- Add fail-closed doctor meta coverage.
- Add unit tests for singleton warning, dependent regression block, and mapped regression pass.

## Verification

- [x] `bunx vitest run tests\change-impact.test.ts tests\doctor.test.ts`
- [x] `bun run lint`
- [x] `bun run typecheck`
- [x] `bun src\cli.ts doctor`
- [x] `bun run test`

## DoD

- [x] One-category change sets produce warning alerts.
- [x] Source-only/incomplete source sets produce warning alerts.
- [x] Dependent module changes without touched mapped regression tests block progression.
- [x] The detector itself fails closed when repo/dependency inputs cannot be read.
- [x] The detector is included in doctor hard-gate aggregation.
