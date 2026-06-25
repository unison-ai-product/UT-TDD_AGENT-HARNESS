---
plan_id: PLAN-REVERSE-126-route-config-dependency-gate
title: "PLAN-REVERSE-126: route config dependency gate fullback"
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
    reason: "The route config dependency acceptance item is now implemented and checked."
  - layer: L4-basic-design
    decision: updated
    evidence_path: docs/design/harness/L4-basic-design/function.md
    reason: "Route eval now documents config dependency validation and fail-close behavior."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The change stays within the existing route evaluation contract and local config boundary."
agent_slots:
  - role: tl
    slot_label: "TL - route config dependency fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-126-route-config-dependency-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-126-route-config-dependency-gate.md
  requires:
    - docs/plans/PLAN-L7-126-route-config-dependency-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T17:05:00+09:00"
    tests_green_at: "2026-06-23T17:05:00+09:00"
    verdict: approve
    scope: "R4 fullback from route config dependency gate to requirements and L4 design."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T17:05:00+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:2a08f62b3f8de0104c840e9941a3c33fc6b4c26e66e0ba47070f6398d93d6590"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T17:05:00+09:00"
        evidence_path: src/workflow/contracts.ts
        output_digest: "sha256:fff49252866a549ac96498c868bc193410867829a119f1a93d9d52e36551e791"
---

# PLAN-REVERSE-126: route config dependency gate fullback

## Objective

Back-fill route config dependency validation to requirements and L4 function
design.

## Scope

- Requirements §7.8.6 records the route-map config dependency gate.
- L4 function design states that route-map config containing legacy DB or
  personal absolute paths fails closed.

## Acceptance Criteria

- Requirements and L4 design both mention config dependency fail-close.
- The Reverse record keeps the implementation inside local route evaluation
  contracts.
