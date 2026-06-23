---
plan_id: PLAN-REVERSE-120-backfill-result-doc-sync
title: "PLAN-REVERSE-120: backfill result doc sync"
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
    reason: "Requirements list all backfill-pairing result keys."
  - layer: L4-basic-design
    decision: not_impacted
    reason: "The gate changes PLAN governance documentation sync only."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The gate changes PLAN governance documentation sync only."
agent_slots:
  - role: tl
    slot_label: "TL - backfill result doc sync fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-120-backfill-result-doc-sync.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-120-backfill-result-doc-sync.md
  requires:
    - docs/plans/PLAN-L7-120-backfill-result-doc-sync.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T13:45:00+09:00"
    tests_green_at: "2026-06-23T13:45:00+09:00"
    verdict: approve
    scope: "Requirements fullback for backfill result documentation synchronization."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun test tests\\backfill-pairing.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T13:45:00+09:00"
        evidence_path: tests/backfill-pairing.test.ts
        output_digest: "sha256:1201201201201201"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T13:45:00+09:00"
        evidence_path: src/lint/backfill-pairing.ts
        output_digest: "sha256:1201201201201202"
---

# PLAN-REVERSE-120: backfill result doc sync

## Objective

Back-fill the current backfill-pairing result key list into requirements.

## Scope

- Requirements mention all exported backfill result keys.
- Concept already carries the same key set and is verified by regression test.

## Acceptance Criteria

- Documentation drift for backfill result keys fails.
- Fullback evidence points to the requirements update.
