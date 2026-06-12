---
plan_id: PLAN-L7-47-search-metrics-feedback
title: "PLAN-L7-47: harness.db search index + skill metrics + feedback engine"
kind: impl
layer: L7
drive: db
parent_design: docs/design/harness/L6-function-design/function-spec.md
status: completed
created: 2026-06-11
updated: 2026-06-11
agent_slots:
  - role: tl
    slot_label: 'TL - search metrics and feedback DB projection review'
  - role: qa
    slot_label: 'QA - IT-DB search and feedback evidence review'
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: gpt-5.4
    reviewer_model: gpt-5.3-codex
    tests_green_at: "2026-06-11"
    reviewed_at: "2026-06-11"
    verdict: pass-with-fixes
    scope: "search/metrics/feedback span: ranked find, skill metrics, feedback events, read-only search, and no feedback auto-approval of PLANs."
generates:
  - artifact_path: src/search/index.ts
    artifact_type: source_module
  - artifact_path: src/feedback/engine.ts
    artifact_type: source_module
  - artifact_path: tests/search-feedback.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires:
    - docs/plans/PLAN-L7-46-projection-writer.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/design/harness/L5-detailed-design/if-detail.md
    - docs/test-design/harness/L8-integration-test-design.md
  references:
    - docs/design/harness/L5-detailed-design/physical-data.md
    - https://www.sqlite.org/fts5.html
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-47: harness.db search + skill metrics + feedback

## Objective

- Implement `findReference(query)` on `search_index` and expose `ut-tdd find`.
- Implement `computeSkillMetrics()` to store firing/acceptance rates in `quality_signals` and expose `ut-tdd metrics skill`.
- Implement `emitFeedbackEvents()` to convert open findings / quality failures into `feedback_events` and expose `ut-tdd feedback list`.

## Invariants

- Search is read-only for authoring sources; DB projection is rebuildable.
- Missing skill logs are recorded as findings, not fabricated success.
- Feedback events never auto-approve PLANs.
- Secret-like content and transcript bodies are not indexed.

## Completion Evidence

- `src/search/index.ts`, `src/feedback/engine.ts`, and `tests/search-feedback.test.ts` exist.
- `bun test tests/search-feedback.test.ts tests/readiness-guardrail.test.ts tests/asset-catalog.test.ts` -> 7 pass.
- `bunx tsc --noEmit` -> pass.
- `bun run src/cli.ts db rebuild --json` -> pass.
- CLI smoke passed:
  - `bun run src/cli.ts find PLAN-L7-47-search-metrics-feedback --json`
  - `bun run src/cli.ts metrics skill --json`
  - `bun run src/cli.ts feedback list --emit --json`
- `bun run src/cli.ts doctor` -> pass.

## DoD

- [x] IT-SEARCH-01 / DB-03 / FEEDBACK-01 green.
- [x] `find` / `metrics skill` / `feedback list` runnable, invariants maintained.
- [x] Regression slice + doctor green, review evidence present.
