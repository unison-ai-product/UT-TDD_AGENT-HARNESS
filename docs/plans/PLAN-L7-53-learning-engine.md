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
  # FR-L1-38 (skill trend signals — future slice, files TBD)
  # FR-L1-43 (skill recommendation feedback loop — future slice, files TBD)
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

Implement the skill learning engine foundation (FR-L1-36) and prepare the scaffold
for trend signals (FR-L1-38) and recommendation feedback loop (FR-L1-43).

This PLAN covers the FR-L1-36 foundation slice in full. FR-L1-38 and FR-L1-43 are
pre-listed in `generates` to allow later agents to fill them in without creating a
new PLAN (impl-plan-trace gate compliance).

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

### FR-L1-38 (deferred — future slice)

Skill trend signals: temporal window aggregation of skill_rating over successive
evaluation snapshots. Requires at least two evaluation runs. To be implemented
in a follow-up commit to this PLAN.

### FR-L1-43 (deferred — future slice)

Recommendation feedback loop: use skill_evaluations.skill_rating to bias
projectSkillTelemetry ranking and surface low-rated skills as improvement findings.
Requires FR-L1-36 to be stable. To be implemented in a follow-up commit to this PLAN.

## Acceptance Criteria

### FR-L1-36

- AC-FR-BR21-36-01: skill adopted by 5 plans, all 5 "confirmed" → rating 1.0, unused_flag 0.
- AC-FR-BR21-36-02: skill with last invocation > 30 days ago → unused_flag 1; row preserved.
- Cold-start: 0 invocations → 0 evaluation rows, no exception.

## Completion Evidence

- `src/schema/harness-db.ts` has `skill_evaluations` table, SCHEMA_VERSION=10.
- `src/state-db/projection-writer.ts` exports `projectSkillEvaluations` and calls it
  in `rebuildHarnessDb`.
- `tests/skill-evaluation.test.ts` passes (6 tests, U-FR-L1-36 cited).
- `npx tsc --noEmit` clean.
- `npx vitest run` fully green.
- `npx biome check src tests` clean.
- `bun run src/cli.ts doctor` exits 0.

## DoD

- [ ] FR-L1-36 acceptance criteria green.
- [ ] tsc + vitest + biome + doctor all pass.
- [ ] function-spec.md, fr-unit-coverage.md, L7-unit-test-design.md updated.
- [ ] FR-L1-38 / FR-L1-43 scaffold pre-listed in generates for future agents.
