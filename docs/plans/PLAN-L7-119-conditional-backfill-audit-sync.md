---
plan_id: PLAN-L7-119-conditional-backfill-audit-sync
title: "PLAN-L7-119: conditional backfill audit sync"
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
    slot_label: "TL - conditional backfill audit sync"
generates:
  - artifact_path: docs/plans/PLAN-L7-119-conditional-backfill-audit-sync.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-119-conditional-backfill-audit-sync.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/backfill-pairing.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/backfill-pairing.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-118-required-backfill-bidirectional-gate.md
  requires:
    - docs/plans/PLAN-L7-118-required-backfill-bidirectional-gate.md
    - docs/plans/PLAN-REVERSE-119-conditional-backfill-audit-sync.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T13:30:00+09:00"
    tests_green_at: "2026-06-23T13:30:00+09:00"
    verdict: approve
    scope: "Backfill legacy conditional audit synchronization gate and regression tests."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun test tests\\backfill-pairing.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T13:30:00+09:00"
        evidence_path: tests/backfill-pairing.test.ts
        output_digest: "sha256:4677eff98f8f122d395b94c7f70527358f358152a310e93d926a60ad3cc46512"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T13:30:00+09:00"
        evidence_path: src/lint/backfill-pairing.ts
        output_digest: "sha256:cb69e5f9425f57492a0760eb7574201d4d361689feb2229db46d773509485b07"
---

# PLAN-L7-119: conditional backfill audit sync

## Objective

Prevent the legacy conditional backfill allowlist from drifting away from its
human-readable audit table.

## Scope

- Parse `conditional-backfill-decision-audit-2026-06-22.md`.
- Compare the Legacy Debt table against `LEGACY_CONDITIONAL_BACKFILL_DEBT_PLAN_IDS`.
- Add `legacyAuditGaps` to `backfill-pairing` and wire it into doctor.
- Update requirements and concept glossary.

## Acceptance Criteria

- Allowlist entries missing from the audit table fail.
- Audit rows missing from the allowlist fail.
- Current repository audit and allowlist are synchronized.
