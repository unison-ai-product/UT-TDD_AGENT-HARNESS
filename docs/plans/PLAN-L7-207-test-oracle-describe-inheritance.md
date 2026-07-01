---
plan_id: PLAN-L7-207-test-oracle-describe-inheritance
title: "PLAN-L7-207: test catalog oracle inheritance from describe blocks"
kind: impl
layer: L7
drive: db
status: confirmed
created: 2026-06-30
updated: 2026-06-30
owner: Codex
parent_design: docs/plans/PLAN-L7-193-runtime-test-run-provenance.md
backprop_decision: not_required
backprop_decision_reason: "This narrows DB test catalog telemetry false negatives by preserving existing U-* oracle grouping from test describe blocks. It changes projection extraction only; no public CLI/API, schema, or workflow semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - test catalog oracle projection"
  - role: tl
    slot_label: "TL - telemetry substance review"
  - role: qa
    slot_label: "QA - projection writer regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-207-test-oracle-describe-inheritance.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-193-runtime-test-run-provenance.md
  requires:
    - docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md
    - docs/plans/PLAN-L7-193-runtime-test-run-provenance.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "DB test catalog now inherits U-* oracle ids from enclosing describe blocks when individual it/test names do not carry their own oracle id, reducing false missing-test-oracle-id telemetry while preserving explicit test-name oracle precedence."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\projection-writer.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:76825939ad6fd3e16a3c4225beada88354d62666a8deade364be07280e0c3320"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/state-db/projection-writer.ts
        output_digest: "sha256:1a61852bc66a939e4624a516ec9b5a5a4147becd6ac8e06842b25bca7e51bd1a"
---

# PLAN-L7-207: test catalog oracle inheritance from describe blocks

## Objective

Reduce false `missing-test-oracle-id` telemetry in the DB test catalog.

The prior projection extracted oracle ids only from individual `it(...)` /
`test(...)` names. Several established test files group cases under
`describe("U-...")`, so those cases had real oracle grouping in source but were
projected as missing.

## Scope

- Keep explicit `U-*` ids in test names as the strongest source.
- When a test name has no `U-*`, inherit the nearest preceding `describe`
  `U-*` family.
- Keep the catalog projection schema unchanged.
- Add a regression assertion that `tests/handover.test.ts` produces catalog rows
  with inherited `U-HOVER-001`.

## Verification

- `bun run vitest run tests\projection-writer.test.ts --reporter=dot` passes.
- `bun run typecheck` passes.
- `bun run lint` passes.
- `bun src\cli.ts db rebuild` passes.
- DB projection reduced open `missing-test-oracle-id` findings from 799 to 590
  by inheriting established `describe("U-...")` oracle groups into cataloged
  test cases.
