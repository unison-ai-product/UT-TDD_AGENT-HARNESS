---
plan_id: PLAN-REVERSE-127-orchestration-degradation-record
title: "PLAN-REVERSE-127: orchestration degradation record fullback"
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
    reason: "The execution-mode degradation acceptance item is now implemented and checked."
  - layer: L4-basic-design
    decision: updated
    evidence_path: docs/design/harness/L4-basic-design/function.md
    reason: "L4 now points to the implemented degraded_from/degraded_to recording surface."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The implementation stays within the existing V-model injection CLI boundary."
agent_slots:
  - role: tl
    slot_label: "TL - orchestration degradation fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-127-orchestration-degradation-record.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-127-orchestration-degradation-record.md
  requires:
    - docs/plans/PLAN-L7-127-orchestration-degradation-record.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T17:35:00+09:00"
    tests_green_at: "2026-06-23T17:35:00+09:00"
    verdict: approve
    scope: "R4 fullback from orchestration degradation implementation to requirements and L4 design."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\vmodel-injection.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T17:35:00+09:00"
        evidence_path: tests/vmodel-injection.test.ts
        output_digest: "sha256:2f96c00b1a8110ee1717e291a594c68faa1eb0a9d6fe711ee5b157b3b88ff920"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T17:35:00+09:00"
        evidence_path: src/vmodel/injection.ts
        output_digest: "sha256:09dfbf69280399fc50b720af5b68e4ee8b22e3d28d484997df818edcfceb9a10"
---

# PLAN-REVERSE-127: orchestration degradation record fullback

## Objective

Back-fill execution-mode degradation recording to requirements and L4 function
design.

## Scope

- Requirements §7.8.7 records the implemented degradation surface.
- L4 function design no longer carries `degraded_from` / `degraded_to` as a
  remaining stub.

## Acceptance Criteria

- Requirements and L4 design both point to the implemented V-model injection
  degradation record.
- The Reverse record keeps degradation separate from human escalation boundary
  enforcement.
