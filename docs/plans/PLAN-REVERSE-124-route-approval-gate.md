---
plan_id: PLAN-REVERSE-124-route-approval-gate
title: "PLAN-REVERSE-124: route approval gate fullback"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: agent
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
forward_routing: L4
promotion_strategy: reuse-with-hardening
backprop_scope:
  - layer: requirements
    decision: updated
    evidence_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    reason: "The human-approval route acceptance item is now implemented and checked."
  - layer: L4-basic-design
    decision: updated
    evidence_path: docs/design/harness/L4-basic-design/function.md
    reason: "Route eval now describes approval-policy resolution and runtime audit block records."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The implementation stays within the existing CLI/workflow contract and runtime audit boundaries."
agent_slots:
  - role: tl
    slot_label: "TL - route approval fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-124-route-approval-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-124-route-approval-gate.md
  requires:
    - docs/plans/PLAN-L7-124-route-approval-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T16:10:00+09:00"
    tests_green_at: "2026-06-23T16:10:00+09:00"
    verdict: approve
    scope: "R4 fullback from route approval implementation to requirements and L4 design."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T16:10:00+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:059ef9f190b9f9d3ebb788f34a5ce67ff43dd58749c66422a73bfe3d178eb49b"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T16:10:00+09:00"
        evidence_path: src/workflow/contracts.ts
        output_digest: "sha256:c255c2d521dc672b954d41c1c03fc55e57a8adcb6d8195e00526ba5929ad4d40"
---

# PLAN-REVERSE-124: route approval gate fullback

## Objective

Back-fill the route approval gate implementation to requirements and L4
function design.

## Scope

- Requirements §7.8.3 / §7.8.6 now record the implemented route approval gate.
- L4 function design states that blocked approval routes write runtime audit
  evidence.
- The audit JSONL remains runtime state and is not tracked in Git.

## Acceptance Criteria

- Requirements and L4 design both name approval-policy resolution.
- The Reverse record states that `.ut-tdd/audit/route-approval.jsonl` is runtime
  evidence, not canonical prose.
