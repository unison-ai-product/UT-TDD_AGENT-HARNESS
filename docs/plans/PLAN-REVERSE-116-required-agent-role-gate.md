---
plan_id: PLAN-REVERSE-116-required-agent-role-gate
title: "PLAN-REVERSE-116: required agent role gate"
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
    reason: "Requirements define mandatory role fail-close for drive-model PLANs."
  - layer: L4-basic-design
    decision: not_impacted
    reason: "The gate changes PLAN governance only, not external basic design behavior."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The gate changes PLAN governance only, not detailed runtime design behavior."
agent_slots:
  - role: tl
    slot_label: "TL - required role fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-116-required-agent-role-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-116-required-agent-role-gate.md
  requires:
    - docs/plans/PLAN-L7-116-required-agent-role-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T12:32:00+09:00"
    tests_green_at: "2026-06-23T12:32:00+09:00"
    verdict: approve
    scope: "Requirements fullback for mandatory role gate."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun test tests\\plan-lint.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T12:32:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:ba64ea807951fdf6b3c3d0891e5525afe5b32e9599129db35e6870da0706826d"
      - kind: lint
        command: "bun run src\\cli.ts plan lint --gate governance"
        runner: bun
        scope: gate
        exit_code: 0
        completed_at: "2026-06-23T12:32:00+09:00"
        evidence_path: src/plan/lint.ts
        output_digest: "sha256:40c960d0d4d0b49ef3aff27e12291b7a5851077e6fdcf7aca1868bdf0d964510"
---

# PLAN-REVERSE-116: required agent role gate

## Objective

Back-fill the mandatory role rule into requirements. The schema verified that
`agent_slots[].role` used a valid enum, but it did not prove that the role
required by the drive model was present.

## Scope

- Requirements record the `missing_required_agent_role` governance violation.
- New or updated `poc`, `recovery`, and `troubleshoot` PLANs require `aim`.
- New or updated Reverse R3 PLANs require `po`.
- Legacy role debt remains non-blocking unless the PLAN is updated.

## Acceptance Criteria

- A new drive-model PLAN missing its required role fails.
- The same PLAN with the required role passes.
- Legacy PLANs before the enforcement date are not retroactively failed.
