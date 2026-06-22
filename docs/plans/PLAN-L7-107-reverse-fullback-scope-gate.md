---
plan_id: PLAN-L7-107-reverse-fullback-scope-gate
title: "PLAN-L7-107: Reverse fullback backprop scope gate"
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
    slot_label: "TL - Reverse fullback scope gate"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-107-reverse-fullback-scope-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-107-reverse-fullback-scope-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-56-artifact-progress-state.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-101-db-projection-backprop-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-103-reverse-fullback-backprop-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-104-conditional-backfill-decision-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-105-artifact-type-path-governance-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-106-backprop-classification-backlog-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/plan/lint.ts
    artifact_type: source_module
  - artifact_path: src/lint/screen-impl-pair-freeze.ts
    artifact_type: source_module
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
  - artifact_path: tests/screen-impl-pair-freeze.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-106-backprop-classification-backlog-gate.md
  requires:
    - docs/plans/PLAN-L7-106-backprop-classification-backlog-gate.md
    - docs/plans/PLAN-REVERSE-107-reverse-fullback-scope-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "Reverse fullback scope lint, live PLAN backfill, and regression tests"
    worker_model: codex
    reviewer_model: codex-intra-runtime
---

# PLAN-L7-107: Reverse fullback backprop scope gate

## Objective

Prevent a Reverse/fullback PLAN from claiming design back-propagation while leaving
requirements, L4 basic design, or L5 detailed design impact unclassified.

## Scope

- Add `reverse_fullback_scope_missing` to `plan-governance`.
- Require `backprop_scope` entries for `requirements`, `L4-basic-design`, and
  `L5-detailed-design`.
- Require `updated` entries to cite a generated evidence path.
- Backfill the current 2026-06-22 fullback PLANs with explicit scope decisions.

## Acceptance Criteria

- A new R4 fullback without `backprop_scope` fails.
- A new R4 fullback whose `updated` scope does not cite generated evidence fails.
- A fullback with requirements evidence and explicit L4/L5 no-impact decisions passes.
- Live `docs/plans/PLAN-REVERSE-*.md` passes `plan-governance`.
- `bun test tests/plan-lint.test.ts` passes.
- `bun run typecheck` passes.
- `bun run lint` passes.
- `bun run src\cli.ts doctor` passes.
