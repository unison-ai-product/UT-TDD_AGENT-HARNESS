---
plan_id: PLAN-L7-61-telemetry-ingestion-metatest
title: "PLAN-L7-61: telemetry ingestion transaction metatest"
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
    scope: "telemetry token ingestion transaction guard and rollback metatest"
agent_slots:
  - role: tl
    slot_label: "TL - telemetry ingestion metatest"
generates:
  - artifact_path: tests/token-tracker.test.ts
    artifact_type: test_code
dependencies:
  parent: PLAN-L7-58
  requires:
    - src/state-db/projection-writer.ts
    - src/state-db/token-tracker.ts
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-61: telemetry ingestion transaction metatest

## Objective

Keep automatic telemetry acquisition robust under large session-log scans.

`ut-tdd telemetry scan` can ingest tens of thousands of runtime token rows from existing
Claude/Codex session JSONL. The ingest path must remain batched in a single SQLite
transaction and must rollback on projection failure.

## Scope

- Add regression tests proving `projectTokenUsage` opens one `BEGIN IMMEDIATE` transaction.
- Verify successful automatic token projection commits once.
- Verify projection failure rolls back and leaves no partial `model_runs` rows.

## Verification

- [x] `bunx vitest run tests\token-tracker.test.ts`

## DoD

- [x] Bulk token usage ingest is guarded by a transaction metatest.
- [x] Failed token usage ingest is guarded by a rollback metatest.
- [x] The test does not invoke provider CLIs or depend on local user session files.
