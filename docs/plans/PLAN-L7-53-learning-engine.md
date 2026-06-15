---
plan_id: PLAN-L7-53-learning-engine
title: "PLAN-L7-53: skill learning engine — evaluation, trend, and recommendation feedback"
kind: impl
layer: L7
drive: db
parent_design: docs/design/harness/L6-function-design/function-spec.md
status: draft
created: 2026-06-15
updated: 2026-06-15
agent_slots:
  - role: tl
    slot_label: 'TL - skill evaluation + learning engine review'
  - role: qa
    slot_label: 'QA - evaluation oracle and acceptance criteria'
review_evidence: []
generates:
  # FR-L1-36 (foundation slice — implemented in this PLAN)
  - artifact_path: src/schema/harness-db.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/skill-evaluation.test.ts
    artifact_type: test_code
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/fr-unit-coverage.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/plans/PLAN-L7-53-learning-engine.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L1-requirements/functional-requirements.md
    artifact_type: design_doc
  # FR-L1-38 (model evaluation — implemented in this PLAN)
  - artifact_path: tests/model-evaluation.test.ts
    artifact_type: test_code
  # FR-L1-43 (PoC success measurement — implemented in this PLAN)
  - artifact_path: tests/poc-evaluation.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires:
    - docs/plans/PLAN-L7-46-projection-writer.md
    - docs/plans/PLAN-L7-47-search-metrics-feedback.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/design/harness/L6-function-design/fr-unit-coverage.md
  references:
    - docs/design/harness/L5-detailed-design/physical-data.md
    - docs/design/harness/L3-functional/business-detail.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-53: skill learning engine

## Objective

Implement the skill learning engine foundation (FR-L1-36), model evaluation opt-in
(FR-L1-38), and PoC success measurement (FR-L1-43).

All three BR-21 FR slices are implemented in this PLAN.

## Scope

### FR-L1-36 (implemented — foundation slice)

- `skill_evaluations` table added to harness-db schema (SCHEMA_VERSION bumped to 10).
- `projectSkillEvaluations(db, opts?)` added to projection-writer.ts and wired into
  `rebuildHarnessDb` after `projectSkillMetrics`.
- Per-skill: skill_rating (0.0-1.0) = success_count / adoption_count, adoption_count,
  success_count, unused_flag (1 if no invocation in last 30 days), evaluated_at.
- Success states: "confirmed" and "completed" (documented in source with rationale).
- Cold-start (0 invocations) → 0 rows, no throw.
- Deletion of unused skills is human-only; flag surfaces the signal.

### FR-L1-38 (implemented — model evaluation, opt-in)

- `model_evaluations` table added to harness-db schema (SCHEMA_VERSION 11→12).
- `projectModelEvaluations(db, repoRoot)` added to projection-writer.ts and wired
  into `rebuildHarnessDb` after `projectPocEvaluations`.
- Opt-in: reads `.ut-tdd/config/model-opt-in.yaml` under repoRoot; runs only if
  `enabled: true`. Default (no file) = disabled → 0 rows.
- Per-model: success_rate = success_count / run_count (join model_runs.plan_id →
  plan_registry.status IN PLAN_SUCCESS_STATUSES).
- Cold-start (enabled but 0 model_runs) → 0 rows, no throw.
- Cost-efficiency (cost_per_success) is a declared follow-up pending token/cost
  telemetry — no fabricated cost data is stored.

### FR-L1-43 (implemented — PoC success measurement)

- `poc_evaluations` table added to harness-db schema (SCHEMA_VERSION bumped to 11).
- `projectPocEvaluations(db, opts?)` added to projection-writer.ts and wired into
  `rebuildHarnessDb` after `projectSkillEvaluations`.
- One summary row (id="poc-evaluation:summary"); poc_success_rate = confirmed /
  (confirmed + rejected + pivot). Pivot is non-success.
- Cold-start (0 decided PoC PLANs) → 0 rows, no throw.

## Acceptance Criteria

### FR-L1-36

- AC-FR-BR21-36-01: skill adopted by 5 plans, all 5 "confirmed" → rating 1.0, unused_flag 0.
- AC-FR-BR21-36-02: skill with last invocation > 30 days ago → unused_flag 1; row preserved.
- Cold-start: 0 invocations → 0 evaluation rows, no exception.

### FR-L1-38

- AC-38-01 (enabled): model-A (2 runs both success) → rate 1.0; model-B (2 runs, 1 success) → rate 0.5.
- AC-38-02 (disabled): no opt-in file → 0 model_evaluations rows.
- Cold-start (enabled, 0 model_runs) → 0 rows, no throw.

### FR-L1-43

- AC-FR-BR21-43-01: 10 PoC (6 confirmed / 3 rejected / 1 pivot) → rate 0.60.
- AC-FR-BR21-43-02 cold-start: 0 PoC PLANs → 0 rows.

## Completion Evidence

- `src/schema/harness-db.ts` has `skill_evaluations`, `poc_evaluations`, `model_evaluations` tables; SCHEMA_VERSION=12.
- `src/state-db/projection-writer.ts` exports `projectSkillEvaluations`, `projectPocEvaluations`, `projectModelEvaluations` and calls them in `rebuildHarnessDb`.
- `tests/skill-evaluation.test.ts` passes (6 tests, U-FR-L1-36 cited).
- `tests/poc-evaluation.test.ts` passes (U-FR-L1-43 cited).
- `tests/model-evaluation.test.ts` passes (U-FR-L1-38 cited).
- `npx tsc --noEmit` clean.
- `npx vitest run` fully green.
- `npx biome check src tests` clean.
- `bun run src/cli.ts doctor` exits 0 with no learning-engine FR in thin-coverage advisory.

## DoD

- [x] FR-L1-36 acceptance criteria green.
- [x] FR-L1-38 acceptance criteria green.
- [x] FR-L1-43 acceptance criteria green.
- [x] tsc + vitest + biome + doctor all pass.
- [x] function-spec.md, fr-unit-coverage.md, L7-unit-test-design.md updated.
- [x] FR-L1-38 follow-up (cost-efficiency) declared in PLAN body and function-spec.md invariant.
