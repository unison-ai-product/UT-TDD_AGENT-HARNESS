---
plan_id: PLAN-L7-105-artifact-type-path-governance-gate
title: "PLAN-L7-105: Artifact path/type governance gate"
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
    slot_label: "TL - artifact path/type gate"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-105-artifact-type-path-governance-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-105-artifact-type-path-governance-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-56-artifact-progress-state.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-56-artifact-progress-state.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: src/plan/lint.ts
    artifact_type: source_module
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-104-conditional-backfill-decision-gate.md
  requires:
    - docs/plans/PLAN-L7-104-conditional-backfill-decision-gate.md
    - docs/plans/PLAN-REVERSE-105-artifact-type-path-governance-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "PLAN governance artifact_path/artifact_type consistency gate and regression tests"
    worker_model: codex
    reviewer_model: codex-intra-runtime
---

# PLAN-L7-105: Artifact path/type governance gate

## Objective

Prevent PLAN `generates` entries from hiding design, test-design, or PLAN
artifacts behind the wrong `artifact_type`.

## Scope

- Enforce `docs/design/` as `design_doc`.
- Enforce `docs/test-design/` as `test_design`.
- Enforce `docs/plans/` as `markdown_doc`.
- Keep enforcement inside `plan-governance` so existing PLAN review and doctor
  flows fail closed on mismatched path/type declarations.
- Repair the existing artifact progress PLAN pair whose design backprop artifacts
  were registered as generic markdown.

## Acceptance Criteria

- A `docs/design/` generated artifact declared as `markdown_doc` fails with
  `artifact_type_mismatch`.
- A `docs/test-design/` generated artifact declared as `markdown_doc` fails with
  `artifact_type_mismatch`.
- A `docs/plans/` generated artifact declared as `design_doc` fails with
  `artifact_type_mismatch`.
- Matching path/type declarations continue to pass existing DB projection and
  reverse fullback tests.
- Existing `PLAN-L7-56` / `PLAN-REVERSE-56` design backprop entries are
  classified as `design_doc`.
- `bun test tests/plan-lint.test.ts` passes.
- `bun run typecheck` passes.
- `bun run lint` passes.
- `bun run src\cli.ts doctor` passes.
