---
plan_id: PLAN-L7-137-feedback-surface-taxonomy
title: "PLAN-L7-137 (troubleshoot): summarize feedback surface by actionability"
kind: troubleshoot
layer: L7
drive: be
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
backprop_decision: not_required
backprop_decision_reason: "The requirement to emit feedback already exists; this slice refines display taxonomy and prevents feedback queue self-noise."
agent_slots:
  - role: aim
    slot_label: "AIM - feedback surface triage"
  - role: tl
    slot_label: "TL - feedback surface taxonomy"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-137-feedback-surface-taxonomy.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/if-detail.md
    artifact_type: design_doc
  - artifact_path: src/feedback/surface.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/feedback-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-110-takeover-feedback-surface.md
  requires:
    - docs/plans/PLAN-L7-44-harness-db-master.md
    - docs/plans/PLAN-L7-110-takeover-feedback-surface.md
---

# PLAN-L7-137 (troubleshoot): summarize feedback surface by actionability

## 0. Objective

Reduce feedback surface noise without weakening detection. Open feedback should
be presented as:

- `gate`: true blockers.
- `actionable`: warnings that can be closed by PLAN/design/test work.
- `telemetry`: high-volume measurement rows that should be summarized, not
  listed one by one.

## 1. Scope

- Add a shared feedback display taxonomy for takeover and `ut-tdd feedback list`
  text output.
- Keep `ut-tdd feedback list --json` as the raw audit path.
- Group text output by `signal_type` and counts.
- Exclude `feedback_events` queue rows from resolvable PLAN join findings so the
  notification queue does not create self-referential `unresolved-join` noise.

## 2. Acceptance Criteria

- [x] Telemetry rows such as `missing-test-oracle-id`, `artifact_progress_yellow`,
      and skill rate signals are summarized.
- [x] Actionable rows remain visible and grouped.
- [x] Gate rows remain first.
- [x] Raw JSON output remains available.
- [x] Feedback queue projection does not create additional unresolved join
      findings.

## 3. Verification

- `bun run vitest run tests\feedback-surface.test.ts tests\search-feedback.test.ts`
- `bun run vitest run tests\projection-writer.test.ts tests\feedback-surface.test.ts tests\search-feedback.test.ts`
- `bun run tsc --noEmit`
- `bun run lint`
- `bun run src\cli.ts db rebuild --json`
- `bun run src\cli.ts feedback list --emit`

## 4. Known Residuals

The taxonomy does not claim all warnings are fixed. It only separates blockers,
actionable backlog, and telemetry so the next close-out work can target the
highest-value signals first.
