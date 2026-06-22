---
plan_id: PLAN-L7-103-reverse-fullback-backprop-gate
title: "PLAN-L7-103: Reverse fullback backprop gate"
kind: add-impl
layer: L7
drive: db
status: confirmed
created: 2026-06-22
updated: 2026-06-22
owner: Codex
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
agent_slots:
  - role: tl
    slot_label: "TL - Reverse fullback governance gate"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-103-reverse-fullback-backprop-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-103-reverse-fullback-backprop-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/reverse-fullback-backprop-audit-2026-06-22.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-101-db-projection-backprop-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/plan/lint.ts
    artifact_type: source_module
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-101-db-projection-backprop-gate.md
  requires:
    - docs/plans/PLAN-L7-101-db-projection-backprop-gate.md
    - docs/plans/PLAN-REVERSE-101-db-projection-backprop-gate.md
    - docs/plans/PLAN-REVERSE-103-reverse-fullback-backprop-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "Reverse fullback backprop gate, legacy audit table, and plan-governance regression tests"
    worker_model: codex
    reviewer_model: codex-intra-runtime
---

# PLAN-L7-103: Reverse fullback backprop gate

## Objective

Prevent future Reverse PLANs from claiming `confirmed_reverse_type=fullback` without naming the
design, governance, or test-design artifact that received the backprop.

## Scope

- Add `reverse_fullback_backprop_missing` to `plan-governance`.
- Enforce the rule for confirmed/completed R4 fullback PLANs updated on or after 2026-06-22.
- Preserve legacy operation by recording older gaps in an audit table instead of retroactively
  breaking doctor.
- Correct PLAN-REVERSE-101 so the current slice also follows the new rule.

## Acceptance Criteria

- A new R4 fullback PLAN that only generates itself fails with
  `reverse_fullback_backprop_missing`.
- A new R4 fullback PLAN that generates a design/governance/test-design artifact passes.
- Legacy fullback debt before 2026-06-22 remains visible in
  `reverse-fullback-backprop-audit-2026-06-22.md` and does not break current doctor.
- `bun test tests/plan-lint.test.ts` passes.
- `bun run typecheck` passes.
- `bun run lint` passes.
- `bun run src\cli.ts doctor` passes.
