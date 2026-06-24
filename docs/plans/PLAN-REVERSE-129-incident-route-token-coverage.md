---
plan_id: PLAN-REVERSE-129-incident-route-token-coverage
title: "PLAN-REVERSE-129: route token coverage fullback"
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
    reason: "The route eval acceptance list now records missing route token coverage."
  - layer: L4-basic-design
    decision: updated
    evidence_path: docs/design/harness/L4-basic-design/function.md
    reason: "Basic design now states declared route tokens and longest-token priority."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The change stays within the existing route evaluation contract."
agent_slots:
  - role: tl
    slot_label: "TL - route token fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-129-incident-route-token-coverage.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-129-incident-route-token-coverage.md
  requires:
    - docs/plans/PLAN-L7-129-incident-route-token-coverage.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T15:45:00+09:00"
    tests_green_at: "2026-06-23T15:45:00+09:00"
    verdict: approve
    scope: "R4 fullback from route token coverage to requirements and L4 design."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T15:45:00+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:059ef9f190b9f9d3ebb788f34a5ce67ff43dd58749c66422a73bfe3d178eb49b"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T15:45:00+09:00"
        evidence_path: src/workflow/contracts.ts
        output_digest: "sha256:c255c2d521dc672b954d41c1c03fc55e57a8adcb6d8195e00526ba5929ad4d40"
---

# PLAN-REVERSE-129: route token coverage fullback

## Objective

Back-fill the implemented route token coverage to requirements and L4 function
design.

## Scope

- Requirements 7.8.1 / 7.8.6 record route token coverage and longest-token
  priority.
- L4 function design states incident token coverage, drift routing, additive
  interrupt routing, and fail-close approval behavior.

## Acceptance Criteria

- Requirements and L4 design both mention route token coverage.
- The Reverse record keeps the implementation inside the route evaluation
  contract.
