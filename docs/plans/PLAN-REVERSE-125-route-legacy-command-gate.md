---
plan_id: PLAN-REVERSE-125-route-legacy-command-gate
title: "PLAN-REVERSE-125: route legacy command gate fullback"
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
    reason: "The legacy runtime command acceptance item is now implemented and checked."
  - layer: L4-basic-design
    decision: updated
    evidence_path: docs/design/harness/L4-basic-design/function.md
    reason: "Route eval now documents route-map command validation and fail-close behavior."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The change uses the existing RecommendedCommandV1 schema and CLI/workflow boundaries."
agent_slots:
  - role: tl
    slot_label: "TL - route legacy command fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-125-route-legacy-command-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-125-route-legacy-command-gate.md
  requires:
    - docs/plans/PLAN-L7-125-route-legacy-command-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T16:40:00+09:00"
    tests_green_at: "2026-06-23T16:40:00+09:00"
    verdict: approve
    scope: "R4 fullback from route legacy command gate to requirements and L4 design."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T16:40:00+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:2a08f62b3f8de0104c840e9941a3c33fc6b4c26e66e0ba47070f6398d93d6590"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T16:40:00+09:00"
        evidence_path: src/workflow/contracts.ts
        output_digest: "sha256:fff49252866a549ac96498c868bc193410867829a119f1a93d9d52e36551e791"
---

# PLAN-REVERSE-125: route legacy command gate fullback

## Objective

Back-fill the route legacy command gate to requirements and L4 function design.

## Scope

- Requirements §7.8.2 / §7.8.6 now record the executable `ut-tdd` command
  restriction.
- L4 function design states that route-map command outputs are validated and
  fail closed.

## Acceptance Criteria

- Requirements and L4 design both mention the legacy command fail-close rule.
- The Reverse record keeps the change within existing route evaluation
  contracts.
