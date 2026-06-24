---
plan_id: PLAN-REVERSE-118-required-backfill-bidirectional-gate
title: "PLAN-REVERSE-118: required backfill bidirectional gate"
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
    reason: "Requirements define bidirectional required add-impl backfill pairing."
  - layer: L4-basic-design
    decision: not_impacted
    reason: "The gate changes PLAN governance only, not external basic design behavior."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The gate changes PLAN governance only, not detailed runtime design behavior."
agent_slots:
  - role: tl
    slot_label: "TL - bidirectional backfill fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-118-required-backfill-bidirectional-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-118-required-backfill-bidirectional-gate.md
  requires:
    - docs/plans/PLAN-L7-118-required-backfill-bidirectional-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T13:05:00+09:00"
    tests_green_at: "2026-06-23T13:05:00+09:00"
    verdict: approve
    scope: "Requirements fullback for bidirectional required add-impl backfill pairing."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun test tests\\backfill-pairing.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T13:05:00+09:00"
        evidence_path: tests/backfill-pairing.test.ts
        output_digest: "sha256:4677eff98f8f122d395b94c7f70527358f358152a310e93d926a60ad3cc46512"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T13:05:00+09:00"
        evidence_path: src/lint/backfill-pairing.ts
        output_digest: "sha256:cb69e5f9425f57492a0760eb7574201d4d361689feb2229db46d773509485b07"
---

# PLAN-REVERSE-118: required backfill bidirectional gate

## Objective

Back-fill the required add-impl bidirectional pairing rule into requirements.
The previous rule proved that a Reverse PLAN pointed back to implementation, but
not that the implementation PLAN exposed its Reverse dependency.

## Scope

- Requirements record the `reverseLinkMissing` backfill-pairing violation.
- New or updated required add-impl PLANs must require the Reverse PLAN that
  backfills them.
- Legacy one-way pairing remains non-blocking until updated.

## Acceptance Criteria

- A one-way required add-impl/Reverse pair fails for new PLANs.
- A bidirectional required add-impl/Reverse pair passes.
- Fullback evidence points to the requirements update.
