---
plan_id: PLAN-L7-51-descent-obligation
title: "PLAN-L7-51: descent-obligation ledger implementation"
kind: add-impl
layer: L7
drive: agent
status: completed
created: 2026-06-12
updated: 2026-06-12
agent_slots:
  - role: tl
    slot_label: "TL - implement descent-obligation lint, DB projection, doctor surface, and U-DESC tests"
generates:
  - artifact_path: src/lint/descent-obligation.ts
    artifact_type: source_module
  - artifact_path: src/lint/plan-dod.ts
    artifact_type: source_module
  - artifact_path: src/lint/placeholder-deps.ts
    artifact_type: source_module
  - artifact_path: src/lint/drive-db-registration.ts
    artifact_type: source_module
  - artifact_path: src/lint/db-projection-coverage.ts
    artifact_type: source_module
  - artifact_path: src/lint/db-projection-ingestion.ts
    artifact_type: source_module
  - artifact_path: src/lint/l7-completion.ts
    artifact_type: source_module
  - artifact_path: src/state-db/drive-registration.ts
    artifact_type: source_module
  - artifact_path: tests/descent-obligation.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
  - artifact_path: tests/drive-db-registration.test.ts
    artifact_type: test_code
  - artifact_path: tests/db-projection-coverage.test.ts
    artifact_type: test_code
  - artifact_path: tests/db-projection-ingestion.test.ts
    artifact_type: test_code
  - artifact_path: src/schema/harness-db.ts
    artifact_type: schema_migration
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
dependencies:
  parent: docs/plans/PLAN-L6-35-descent-obligation.md
  requires:
    - docs/design/harness/L6-function-design/descent-obligation.md
    - docs/test-design/harness/L7-unit-test-design.md
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    worker_model: gpt-5.4
    reviewer_model: gpt-5.4
    tests_green_at: "2026-06-12"
    reviewed_at: "2026-06-12"
    verdict: pass
    scope: "L7 add-impl for PLAN-L6-35: descent-obligation lint, descent_obligations projection, doctor hard/fail-close wiring, and U-DESC-001..008 tests."
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-51: descent-obligation ledger implementation

## Objective

Implement the L6 descent-obligation contract from PLAN-L6-35 so absence-blind downstream gaps are generated from upstream trace keys and layer adjacency, then surfaced through tests, doctor, and harness.db. Also harden doctor completion precision so confirmed/completed L7 PLANs cannot retain unchecked DoD items silently.

## WBS

| WBS ID | Work | Source target | Test target | Gate |
|---|---|---|---|---|
| WBS-L7-51-01 | Pure analyzer and repo loaders | `src/lint/descent-obligation.ts` | `tests/descent-obligation.test.ts` | `vitest tests/descent-obligation.test.ts` |
| WBS-L7-51-02 | harness.db projection | `src/schema/harness-db.ts`, `src/state-db/projection-writer.ts` | `tests/projection-writer.test.ts` | `vitest tests/projection-writer.test.ts` |
| WBS-L7-51-03 | doctor hard/fail-close surface | `src/doctor/index.ts` | `tests/doctor.test.ts` | `ut-tdd doctor` |
| WBS-L7-51-04 | confirmed L7 DoD completion guard | `src/lint/plan-dod.ts`, `src/doctor/index.ts` | `tests/doctor.test.ts` | `ut-tdd doctor` |
| WBS-L7-51-05 | active L7 placeholder dependency guard | `src/lint/placeholder-deps.ts`, `src/doctor/index.ts` | `tests/doctor.test.ts` | `ut-tdd doctor` |
| WBS-L7-51-06 | drive/model DB registration hard gate | `src/lint/drive-db-registration.ts`, `src/state-db/drive-registration.ts`, `src/doctor/index.ts` | `tests/drive-db-registration.test.ts`, `tests/doctor.test.ts` | `ut-tdd doctor` |

## Acceptance Criteria

- U-DESC-001..008 are executable tests, not `it.todo`.
- `generateObligations` is upstream-driven and does not rely on downstream self-declared links.
- `analyzeDescentObligations` handles untraceable, duplicate, satisfied, unmet, valid/invalid defer, impl-ahead, and park/placeholder cases.
- `descent_obligations` rows are projected during `rebuildHarnessDb`.
- `ut-tdd doctor` surfaces descent-obligation messages as hard/fail-close and wires the result into `runDoctor.ok`.
- `ut-tdd doctor` fails closed when a confirmed/completed `PLAN-L7-*` retains unchecked DoD items.
- `ut-tdd doctor` fails closed when active design/test-design docs retain L7-waiting `placeholder_deps` or claim the dedicated placeholder-deps rule is not implemented.
- `ut-tdd doctor` fails closed when harness.db lacks automatic drive/model/workflow/skill registration evidence, when current workflow/model/skill projection rows do not resolve to `drive_runs` / `plan_registry`, or when required current drive modes are absent.
