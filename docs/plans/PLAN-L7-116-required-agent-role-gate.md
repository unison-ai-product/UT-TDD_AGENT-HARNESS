---
plan_id: PLAN-L7-116-required-agent-role-gate
title: "PLAN-L7-116: required agent role gate"
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
    slot_label: "TL - required role gate"
generates:
  - artifact_path: docs/plans/PLAN-L7-116-required-agent-role-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-116-required-agent-role-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: src/plan/lint.ts
    artifact_type: source_module
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-115-reverse-r4-route-backprop-gate.md
  requires:
    - docs/plans/PLAN-L7-115-reverse-r4-route-backprop-gate.md
    - docs/plans/PLAN-REVERSE-116-required-agent-role-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T12:32:00+09:00"
    tests_green_at: "2026-06-23T12:32:00+09:00"
    verdict: approve
    scope: "Plan-governance mandatory role lint and regression tests."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun test tests\\plan-lint.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T12:32:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:1161161161161163"
      - kind: lint
        command: "bun run src\\cli.ts plan lint --gate governance"
        runner: bun
        scope: gate
        exit_code: 0
        completed_at: "2026-06-23T12:32:00+09:00"
        evidence_path: src/plan/lint.ts
        output_digest: "sha256:1161161161161164"
---

# PLAN-L7-116: required agent role gate

## Objective

Make required agent roles machine-checkable for drive-model PLANs. Valid role
enums were already checked, but a PoC or recovery PLAN could omit the AIM slot,
and Reverse R3 could omit the PO intent-verification slot.

## Scope

- Add `missing_required_agent_role` to `plan-governance`.
- Enforce only for new or updated PLANs from 2026-06-23 onward.
- Cover `poc`, `recovery`, `troubleshoot`, and Reverse R3.

## Acceptance Criteria

- New/updated `poc`, `recovery`, or `troubleshoot` without `aim` fails.
- New/updated Reverse R3 without `po` fails.
- Required roles and legacy dates pass.
