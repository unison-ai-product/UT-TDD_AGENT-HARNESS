---
plan_id: PLAN-L7-49-asset-catalog
title: "PLAN-L7-49: harness.db automation asset catalog"
kind: impl
layer: L7
drive: db
parent_design: docs/design/harness/L6-function-design/function-spec.md
status: completed
created: 2026-06-11
updated: 2026-06-11
agent_slots:
  - role: tl
    slot_label: 'TL - automation asset catalog review'
  - role: qa
    slot_label: 'QA - asset catalog evidence and drift review'
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: gpt-5.4
    reviewer_model: gpt-5.3-codex
    tests_green_at: "2026-06-11"
    reviewed_at: "2026-06-11"
    verdict: pass-with-fixes
    scope: "asset catalog span: metadata-only cataloging, allowed roots, no prompt bodies/secrets in DB, drift and empty catalogs surfaced as findings."
generates:
  - artifact_path: src/assets/catalog.ts
    artifact_type: source_module
  - artifact_path: tests/asset-catalog.test.ts
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
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-49: harness.db automation asset catalog

## Objective

- Implement `catalogAutomationAssets()` to scan approved skill / roster / command roots.
- Store metadata-only rows in `automation_assets` and searchable references in `search_index`.
- Expose `ut-tdd asset catalog`.

## Invariants

- Source paths are limited to approved docs / `.claude` roots.
- Prompt bodies and secrets are not stored in DB.
- Drift and empty catalog conditions are visible as findings.

## Completion Evidence

- `src/assets/catalog.ts` and `tests/asset-catalog.test.ts` exist.
- `bun test tests/search-feedback.test.ts tests/readiness-guardrail.test.ts tests/asset-catalog.test.ts` -> 7 pass.
- `bunx tsc --noEmit` -> pass.
- `bun run src/cli.ts db rebuild --json` -> pass.
- `bun run src/cli.ts asset catalog --json` -> pass; 19 metadata-only assets, findings 0.
- `bun run src/cli.ts doctor` -> pass.

## Notes

- `db rebuild` resets `automation_assets` to 0 by design. `asset catalog` is the projection command that populates asset metadata.

## DoD

- [x] IT-ASSET-DB-01 green.
- [x] `asset catalog` runnable, prompt body non-storage invariant covered.
- [x] Regression slice + doctor green, review evidence present.
