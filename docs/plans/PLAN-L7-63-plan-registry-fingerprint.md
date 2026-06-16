---
plan_id: PLAN-L7-63-plan-registry-fingerprint
title: "PLAN-L7-63: plan registry source fingerprint stale gate"
kind: impl
layer: L7
drive: db
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
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
    scope: "plan_registry source_hash projection and drive-db-registration same-count stale detection"
agent_slots:
  - role: tl
    slot_label: "TL - plan registry fingerprint stale gate"
generates:
  - artifact_path: src/schema/harness-db.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/state-db/drive-registration.ts
    artifact_type: source_module
  - artifact_path: src/lint/drive-db-registration.ts
    artifact_type: source_module
  - artifact_path: tests/drive-db-registration.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
  - artifact_path: tests/state-db.test.ts
    artifact_type: test_code
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
dependencies:
  parent: PLAN-L7-59
  requires:
    - docs/design/harness/L5-detailed-design/physical-data.md
    - docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-63: plan registry source fingerprint stale gate

## Objective

Make persisted `harness.db` PLAN registration freshness content-aware, not only count-aware.

`drive-db-registration` already detects missing DB rows and plan count drift. It must also fail when
the persisted `plan_registry` has the same number of PLANs as `docs/plans/*.md` but was built from
older markdown content.

## Scope

- Add `plan_registry.source_hash` as the sha256 of each PLAN markdown file.
- Project `source_hash` during `rebuildHarnessDb`.
- Compare an aggregate DB fingerprint with an aggregate current-doc fingerprint in
  `drive-db-registration`.
- Add a distinct `stale_plan_registry_fingerprint` violation for same-count stale content.
- Cover the detector with a direct metatest and projection/schema tests.

## Verification

- [x] `bunx vitest run tests\drive-db-registration.test.ts tests\projection-writer.test.ts tests\state-db.test.ts`

## DoD

- [x] PLAN count drift still reports `stale_plan_registry`.
- [x] PLAN content drift with unchanged count reports `stale_plan_registry_fingerprint`.
- [x] Rebuilt DB rows carry `source_hash` values.
- [x] Existing DB migration repairs the added `source_hash` column.
