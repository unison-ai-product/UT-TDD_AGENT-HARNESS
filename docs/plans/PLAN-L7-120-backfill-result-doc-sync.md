---
plan_id: PLAN-L7-120-backfill-result-doc-sync
title: "PLAN-L7-120: backfill result doc sync"
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
    slot_label: "TL - backfill result doc sync"
generates:
  - artifact_path: docs/plans/PLAN-L7-120-backfill-result-doc-sync.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-120-backfill-result-doc-sync.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/backfill-pairing.ts
    artifact_type: source_module
  - artifact_path: tests/backfill-pairing.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-119-conditional-backfill-audit-sync.md
  requires:
    - docs/plans/PLAN-L7-119-conditional-backfill-audit-sync.md
    - docs/plans/PLAN-REVERSE-120-backfill-result-doc-sync.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T13:45:00+09:00"
    tests_green_at: "2026-06-23T13:45:00+09:00"
    verdict: approve
    scope: "Backfill result key documentation sync gate and regression tests."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun test tests\\backfill-pairing.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T13:45:00+09:00"
        evidence_path: tests/backfill-pairing.test.ts
        output_digest: "sha256:4677eff98f8f122d395b94c7f70527358f358152a310e93d926a60ad3cc46512"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T13:45:00+09:00"
        evidence_path: src/lint/backfill-pairing.ts
        output_digest: "sha256:cb69e5f9425f57492a0760eb7574201d4d361689feb2229db46d773509485b07"
---

# PLAN-L7-120: backfill result doc sync

## Objective

Keep the machine backfill result keys synchronized with requirements and concept
documentation.

## Scope

- Export `BACKFILL_RESULT_KEYS` from `backfill-pairing`.
- Require requirements and concept docs to mention every machine result key.
- Update the requirements backfill mechanism note.

## Acceptance Criteria

- Adding or renaming a backfill result key without docs fails the regression
  test.
- Current requirements and concept docs mention all backfill result keys.
