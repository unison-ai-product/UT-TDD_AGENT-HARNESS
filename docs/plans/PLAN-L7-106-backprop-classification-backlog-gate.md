---
plan_id: PLAN-L7-106-backprop-classification-backlog-gate
title: "PLAN-L7-106: Backprop classification backlog gate"
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
    slot_label: "TL - backlog backprop classification gate"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-106-backprop-classification-backlog-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-106-backprop-classification-backlog-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/improvement-backlog.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/improvement-backlog.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/improvement-backlog.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-105-artifact-type-path-governance-gate.md
  requires:
    - docs/plans/PLAN-L7-105-artifact-type-path-governance-gate.md
    - docs/plans/PLAN-REVERSE-106-backprop-classification-backlog-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "Improvement backlog lower-layer backprop classification lint, doctor hard gate, and regression tests"
    worker_model: codex
    reviewer_model: codex-intra-runtime
---

# PLAN-L7-106: Backprop classification backlog gate

## Objective

Prevent lower-layer Reverse back-propagation findings from remaining in the
improvement backlog without a machine-readable disposition.

## Scope

- Extend `improvement-backlog` lint with `missingBackpropClassification`.
- Require the six classification fields for backlog rows that explicitly mention
  lower-layer or backprop handling.
- Wire the new finding into the existing doctor hard gate.
- Backfill IMP-117 with the same classification fields it now requires.

## Acceptance Criteria

- A lower-layer/backprop backlog row without classification fields fails.
- A lower-layer/backprop backlog row with all six fields passes.
- Live `docs/improvement-backlog.md` has zero missing backprop classifications.
- `bun test tests/improvement-backlog.test.ts` passes.
- `bun run typecheck` passes.
- `bun run lint` passes.
- `bun run src\cli.ts doctor` passes.
