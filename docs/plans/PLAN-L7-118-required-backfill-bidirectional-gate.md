---
plan_id: PLAN-L7-118-required-backfill-bidirectional-gate
title: "PLAN-L7-118: required backfill bidirectional gate"
kind: add-impl
layer: L7
drive: db
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
agent_slots:
  - role: tl
    slot_label: "TL - required backfill bidirectional gate"
generates:
  - artifact_path: docs/plans/PLAN-L7-118-required-backfill-bidirectional-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-118-required-backfill-bidirectional-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/backfill-pairing.ts
    artifact_type: source_module
  - artifact_path: tests/backfill-pairing.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-117-kind-layer-governance-gate.md
  requires:
    - docs/plans/PLAN-L7-117-kind-layer-governance-gate.md
    - docs/plans/PLAN-REVERSE-118-required-backfill-bidirectional-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T13:05:00+09:00"
    tests_green_at: "2026-06-23T13:05:00+09:00"
    verdict: approve
    scope: "Backfill-pairing bidirectional required add-impl gate and regression tests."
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

# PLAN-L7-118: required backfill bidirectional gate

## Objective

Make required add-impl backfill pairing bidirectional. Reverse already had to
require the L7 implementation PLAN, but the implementation PLAN also needs to
require the Reverse PLAN so the execution contract visibly carries the design
fullback step.

## Scope

- Add `reverseLinkMissing` to `backfill-pairing`.
- Enforce only for new or updated required add-impl PLANs from 2026-06-23 onward.
- Keep legacy one-way backfill debt non-blocking unless the PLAN is updated.
- Record the rule in requirements.

## Acceptance Criteria

- New/updated add-impl with Reverse→L7 only fails.
- New/updated add-impl with both L7→Reverse and Reverse→L7 passes.
- Current repository backfill audit remains green.
