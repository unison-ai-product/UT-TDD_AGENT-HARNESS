---
plan_id: PLAN-L7-131-plan-complete-handover
title: "PLAN-L7-131: plan complete handover"
kind: add-impl
layer: L7
drive: agent
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
agent_slots:
  - role: tl
    slot_label: "TL - plan complete handover"
generates:
  - artifact_path: docs/plans/PLAN-L7-131-plan-complete-handover.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-131-plan-complete-handover.md
    artifact_type: markdown_doc
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-04-handover-mechanism.md
  requires:
    - docs/plans/PLAN-L7-04-handover-mechanism.md
    - docs/plans/PLAN-REVERSE-131-plan-complete-handover.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T16:10:00+09:00"
    tests_green_at: "2026-06-23T16:10:00+09:00"
    verdict: approve
    scope: "CLI plan complete routes to completed handover and clears current-plan through runHandover."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\cli-surface.test.ts -t \"plan complete\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T16:10:00+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:02dfec21181e8478f0ba3da13c010c8f155d45c9202ef008eb13fcbf3364dfb5"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T16:10:00+09:00"
        evidence_path: tsconfig.json
        output_digest: "sha256:290e679c492d7c229373061b313ab332394da783b08c9eff85bbb81275f96afc"
---

# PLAN-L7-131: plan complete handover

## Objective

Remove the manual gap where a PLAN can be finished but the completed handover
state is only generated if the operator remembers a separate `handover
--complete` command.

## Scope

- Add `ut-tdd plan complete [id]` as the PLAN lifecycle entrypoint.
- Reuse `runHandover({ complete: true })` for all writes and current-plan clear
  behavior.
- Keep `plan lint` read-only and keep `plan use` limited to active marker
  updates.
- Add CLI surface coverage that proves `plan complete` writes `CURRENT.json`
  with `status=completed` and clears `.ut-tdd/state/current-plan`.

## Acceptance Criteria

- `plan complete` exits 0 for the active current-plan.
- `CURRENT.json` records `status=completed` and the completed plan id.
- The current-plan marker is cleared by the same `runHandover` path.
- Existing handover tests still pass.
