---
plan_id: PLAN-L7-130-right-arm-gate-planning
title: "PLAN-L7-130: right-arm gate planning"
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
    slot_label: "TL - right-arm gate planning"
generates:
  - artifact_path: docs/plans/PLAN-L7-130-right-arm-gate-planning.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-130-right-arm-gate-planning.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/right-arm-gate-planning.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/right-arm-gate-planning.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-95-lint-wiring-meta-gate.md
  requires:
    - docs/plans/PLAN-L7-95-lint-wiring-meta-gate.md
    - docs/process/gates.md
    - docs/improvement-backlog.md
    - docs/plans/PLAN-REVERSE-130-right-arm-gate-planning.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T16:30:00+09:00"
    tests_green_at: "2026-06-23T16:30:00+09:00"
    verdict: approve
    scope: "G8-G14 carry is routed to concrete PLAN evidence and doctor fail-close coverage."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\right-arm-gate-planning.test.ts tests\\lint-wiring.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T16:30:00+09:00"
        evidence_path: tests/right-arm-gate-planning.test.ts
        output_digest: "sha256:f321df37a40bc2ea221a2a2ab9d07c36ff6c8be0e02524791c40d198e8e9fb3b"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T16:30:00+09:00"
        evidence_path: src/lint/right-arm-gate-planning.ts
        output_digest: "sha256:5c5df976593649215c875d844ac067a99e6a5f3bbe107843f565be01f97caacd"
---

# PLAN-L7-130: right-arm gate planning

## Objective

Stop the G8-G14 right-arm gate mechanization carry from staying unplanned or
untraceable.

## Scope

- Add a doctor hard gate that checks the IMP-052 carry has concrete PLAN
  evidence.
- Treat `docs/plans/PLAN-L7-130-right-arm-gate-planning.md` and
  `docs/plans/PLAN-REVERSE-130-right-arm-gate-planning.md` as the first
  machine-readable route for the carry.
- Keep full G8-G14 gate implementation as child-plan work; this PLAN only
  prevents the "future PLAN but no PLAN exists" hole from recurring.
- Add targeted tests for unplanned and routed cases.

## Acceptance Criteria

- Doctor fails when G8-G14 carry has no concrete PLAN reference.
- Doctor passes when the carry is backed by concrete PLAN artifacts.
- `lint-wiring` reaches the new lint module through the runtime entrypoint.
- The reverse record explains why this is a planning fail-close slice, not the
  full G8-G14 gate implementation.
