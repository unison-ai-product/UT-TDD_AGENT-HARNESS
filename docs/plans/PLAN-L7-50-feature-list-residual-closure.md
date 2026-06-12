---
plan_id: PLAN-L7-50-feature-list-residual-closure
title: "PLAN-L7-50: feature-list residual closure for R1-R9"
kind: impl
layer: L7
drive: fullstack
parent_design: docs/design/harness/L6-function-design/function-spec.md
status: completed
created: 2026-06-12
updated: 2026-06-12
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: gpt-5.4
    reviewer_model: gpt-5.3-codex
    tests_green_at: "2026-06-12"
    reviewed_at: "2026-06-12"
    verdict: pass-with-fixes
    scope: "R1-R9 feature-list residual closure: every residual bucket is bound to a PLAN/WBS, L7 source target, test target, and doctor coverage gate."
agent_slots:
  - role: tl
    slot_label: "TL - R1-R9 residual closure and fail-close coverage gate"
generates:
  - artifact_path: docs/plans/PLAN-L7-50-feature-list-residual-closure.md
    artifact_type: markdown_doc
  - artifact_path: .ut-tdd/audit/A-133-upstream-vmodel-coverage-audit.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/fr-roadmap-coverage.ts
    artifact_type: source_module
  - artifact_path: src/workflow/contracts.ts
    artifact_type: source_module
  - artifact_path: src/runtime/agent-slots.ts
    artifact_type: source_module
  - artifact_path: tests/fr-roadmap-coverage.test.ts
    artifact_type: test_code
  - artifact_path: tests/workflow-contracts.test.ts
    artifact_type: test_code
  - artifact_path: tests/agent-slots.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L3-04-upstream-schedule-reconciliation.md
  requires:
    - .ut-tdd/audit/A-133-upstream-vmodel-coverage-audit.md
    - docs/design/harness/L1-requirements/functional-requirements.md
    - docs/design/harness/L6-function-design/fr-unit-coverage.md
    - docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-50: feature-list residual closure for R1-R9

## Objective

Close the feature-list residual buckets from A-133 at L7. A residual bucket is not closed by text-only routing. It is closed only when the row names a WBS, implementation surface, test surface, and automated coverage gate.

## WBS

| WBS ID | Residual bucket | L7 source target | Test target | Coverage gate | feature flag | rollback |
|---|---|---|---|---|---|---|
| WBS-L7-50-R1 | R1 Learning / observability | `src/feedback/engine.ts` | `tests/search-feedback.test.ts` | `doctor fr-roadmap-coverage`, `npm test` | N/A | Revert A-133 row to `scheduled` and keep feedback metrics as carry |
| WBS-L7-50-R2 | R2 FE / W-gate workflow | `src/workflow/readiness.ts` | `tests/readiness-guardrail.test.ts` | `doctor fr-roadmap-coverage`, `npm test` | N/A | Revert A-133 row to `scheduled` and keep W-gate as L4 carry |
| WBS-L7-50-R3 | R3 P2 readiness and infra | `src/guardrail/ledger.ts` | `tests/issue-queue.test.ts` | `doctor fr-roadmap-coverage`, `npm test` | N/A | Revert A-133 row to `scheduled` and keep P2 infra as parked/carry |
| WBS-L7-50-R4 | R4 model/drive/onboarding/provider | `src/runtime/provider-handover.ts` | `tests/provider-handover.test.ts` | `doctor fr-roadmap-coverage`, `npm test` | N/A | Revert A-133 row to `scheduled` and keep provider/drive as Phase B carry |
| WBS-L7-50-R5 | R5 internal assets | `src/assets/catalog.ts` | `tests/asset-catalog.test.ts` | `doctor fr-roadmap-coverage`, `npm test` | N/A | Revert A-133 row to `scheduled` and keep asset drift as carry |
| WBS-L7-50-R6 | R6 DDD/TDD strictness | `src/lint/ddd-tdd-rules.ts` | `tests/ddd-tdd-rules.test.ts` | `doctor fr-roadmap-coverage`, `npm test` | N/A | Revert A-133 row to `scheduled` and keep strictness hardening as carry |
| WBS-L7-50-R7 | R7 relation graph | `src/lint/relation-graph.ts` | `tests/relation-graph.test.ts` | `doctor fr-roadmap-coverage`, `npm test` | N/A | Revert A-133 row to `scheduled` and keep relation graph as residual PLAN |
| WBS-L7-50-R8 | R8 external verification/MCP | `src/lint/tool-adapter.ts` | `tests/tool-adapter.test.ts` | `doctor fr-roadmap-coverage`, `npm test` | N/A | Revert A-133 row to `scheduled` and keep must-tool profiles as carry |
| WBS-L7-50-R9 | R9 document export | `src/export/document-export.ts` | `tests/document-export.test.ts` | `doctor fr-roadmap-coverage`, `npm test` | N/A | Revert A-133 row to `scheduled` and keep export derivatives as carry |
| WBS-L7-50-R10 | Function-spec explicit L7 defer discharge | `src/workflow/contracts.ts`, `src/schema/harness-db.ts` | `tests/workflow-contracts.test.ts` | `doctor impl-plan-trace`, `doctor oracle-test-trace`, `npm test` | N/A | Revert function-spec rows to `explicit_l7_defer` and keep R10 open |
| WBS-L7-50-R11 | Agent roster capability defer discharge | `src/runtime/agent-slots.ts` | `tests/agent-slots.test.ts` | `doctor impl-plan-trace`, `doctor oracle-test-trace`, `npm test` | N/A | Revert agent-slots row to explicit defer and keep R11 open |

## Acceptance Criteria

- [x] A-133 residual bucket rows R1-R9 are `closed`.
- [x] A-133 has a `Residual Feature Closure Evidence` table with one evidence row per bucket.
- [x] `fr-roadmap-coverage` fails if a closed bucket lacks PLAN/WBS, source, test, coverage gate, or target file existence.
- [x] Function-spec rows marked `explicit_l7_defer` are discharged to L7 source/test evidence or reopened as non-closed residuals.
- [x] Agent roster capability row is discharged to L7 source/test evidence or reopened as non-closed residual.
- [x] `ut-tdd doctor` passes the `fr-roadmap-coverage` hard gate.
- [x] `npm run lint`, `npm run typecheck`, and `npm test` pass.

## DoD

- [x] R1-R9 residual rows are closed by source, test, and doctor evidence.
- [x] R10/R11 defer discharge rows are covered by source and test evidence.
- [x] `doctor`, typecheck, lint, and full vitest suite pass after DB rebuild.
