---
plan_id: PLAN-L7-183-doctor-test-performance
title: "PLAN-L7-183: doctor test performance"
kind: refactor
layer: L7
drive: agent
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/plans/PLAN-L7-182-readme-relation-graph-projection.md
backprop_decision: not_required
backprop_decision_reason: "This is a behavior-preserving test performance refactor. Product contracts and gate semantics are unchanged."
agent_slots:
  - role: tl
    slot_label: "TL - test performance review"
  - role: qa
    slot_label: "QA - doctor regression timing"
  - role: aim
    slot_label: "AIM - CI performance evidence"
generates:
  - artifact_path: docs/plans/PLAN-L7-183-doctor-test-performance.md
    artifact_type: markdown_doc
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-182-readme-relation-graph-projection.md
  requires:
    - tests/doctor.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T13:55:00+09:00"
    tests_green_at: "2026-06-29T13:55:00+09:00"
    verdict: approve
    scope: "Share the expensive real-repo runDoctor result within doctor.test while preserving per-gate assertions."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\doctor.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T13:55:00+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:38c828573c69c9456aa714bd88c2197ead8fbad2827547f909bccf2c610c8d0a"
---

# PLAN-L7-183: doctor test performance

## Objective

Reduce full-suite wall time without weakening doctor gate assertions.

## Scope

- Cache the expensive real-repo `runDoctor()` result inside the `tests/doctor.test.ts` `runDoctor` describe block.
- Keep fixture-based doctor tests isolated and uncached.
- Preserve all existing gate-specific assertions against the shared real-repo doctor result.

## Acceptance

- `tests/doctor.test.ts` passes.
- The real-repo doctor gate assertions still check the same messages and `ok=true`.
- Targeted timing improves from the previous full-run `doctor.test.ts` segment of about 230s to about 16.5s on the local Windows runner.
- Full suite remains green and completed in about 84.0s on the local Windows runner after the cache refactor.
