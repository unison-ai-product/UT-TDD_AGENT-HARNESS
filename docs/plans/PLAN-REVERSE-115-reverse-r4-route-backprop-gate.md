---
plan_id: PLAN-REVERSE-115-reverse-r4-route-backprop-gate
title: "PLAN-REVERSE-115: Reverse R4 route backprop gate"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: db
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
forward_routing: L3
promotion_strategy: reuse-with-hardening
backprop_scope:
  - layer: requirements
    decision: updated
    evidence_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    reason: "Requirements define the route-level R4 backprop evidence gate."
  - layer: L4-basic-design
    decision: not_impacted
    reason: "The gate changes planning governance, not external basic design behavior."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The gate changes planning governance, not detailed runtime design behavior."
agent_slots:
  - role: tl
    slot_label: "TL - Reverse R4 route backprop gate"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-115-reverse-r4-route-backprop-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-115-reverse-r4-route-backprop-gate.md
  requires:
    - docs/plans/PLAN-L7-115-reverse-r4-route-backprop-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T12:22:00+09:00"
    tests_green_at: "2026-06-23T12:21:00+09:00"
    verdict: approve
    scope: "Requirements fullback for route-level R4 backprop evidence gate."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun test tests\\plan-lint.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T12:21:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:ba64ea807951fdf6b3c3d0891e5525afe5b32e9599129db35e6870da0706826d"
      - kind: lint
        command: "bun run src\\cli.ts plan lint --gate governance"
        runner: bun
        scope: gate
        exit_code: 0
        completed_at: "2026-06-23T12:21:00+09:00"
        evidence_path: src/plan/lint.ts
        output_digest: "sha256:40c960d0d4d0b49ef3aff27e12291b7a5851077e6fdcf7aca1868bdf0d964510"
---

# PLAN-REVERSE-115: Reverse R4 route backprop gate

## Objective

Back-fill the route-level Reverse R4 evidence rule into requirements. The
previous gate caught literal upstream artifact claims, but a non-fullback R4
Reverse PLAN could still route to L1-L6 without generating an upstream artifact
or declaring that no upstream reflection was needed.

## Scope

- Requirements add the `reverse_r4_route_backprop_missing` condition.
- The rule applies only to new or updated non-fullback R4 Reverse PLANs from
  2026-06-23 onward.
- Legacy Reverse debt remains in the existing audit instead of being
  retroactively hard-failed.

## Acceptance Criteria

- A routed non-fullback R4 Reverse PLAN without upstream generated artifact or
  explicit no-backprop decision fails.
- A generated upstream artifact passes.
- `backprop_decision: not_required` with a concrete reason passes.
