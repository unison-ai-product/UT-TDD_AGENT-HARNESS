---
plan_id: PLAN-L7-104-conditional-backfill-decision-gate
title: "PLAN-L7-104: Conditional backfill decision gate"
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
    slot_label: "TL - conditional backfill gate"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-104-conditional-backfill-decision-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-104-conditional-backfill-decision-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/conditional-backfill-decision-audit-2026-06-22.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/backfill-pairing.ts
    artifact_type: source_module
  - artifact_path: src/schema/frontmatter.ts
    artifact_type: source_module
  - artifact_path: tests/backfill-pairing.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-103-reverse-fullback-backprop-gate.md
  requires:
    - docs/plans/PLAN-L7-103-reverse-fullback-backprop-gate.md
    - docs/plans/PLAN-REVERSE-104-conditional-backfill-decision-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "Conditional backfill decision gate, legacy debt audit, and regression tests"
    worker_model: codex
    reviewer_model: codex-intra-runtime
---

# PLAN-L7-104: Conditional backfill decision gate

## Objective

Prevent `refactor`, `retrofit`, and `troubleshoot` PLANs from silently skipping
Reverse back-fill when a contract, behavior, requirement, design, or test-design
meaning changed.

## Scope

- Extend `backfill-pairing` with `conditionalDecisionMissing`.
- Allow explicit no-backprop decisions through `backprop_decision: not_required`
  and `backprop_decision_reason`.
- Baseline existing conditional warnings in a governance audit table.
- Keep current doctor green while enforcing the rule for new and updated PLANs.

## Acceptance Criteria

- A new conditional-kind PLAN without Reverse or no-backprop decision fails.
- A conditional-kind PLAN with `backprop_decision: not_required` and a concrete
  reason passes.
- Existing conditional debt is visible in
  `conditional-backfill-decision-audit-2026-06-22.md`.
- `bun test tests/backfill-pairing.test.ts` passes.
- `bun run typecheck` passes.
- `bun run lint` passes.
- `bun run src\cli.ts doctor` passes.
