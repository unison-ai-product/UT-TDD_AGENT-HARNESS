---
plan_id: PLAN-L7-175-placeholder-threshold-g8-evidence
title: "PLAN-L7-175: placeholder threshold G8 evidence closure"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/plans/PLAN-L7-174-skill-catalog-g8-evidence.md
backprop_decision: not_required
backprop_decision_reason: "This closes the already-designed L8 IT-ASSET-07 placeholder threshold proof. It adds cross-rule evidence that placeholder-deps keeps carry visible and descent-obligation fails after materialization leaves a wait unresolved."
agent_slots:
  - role: se
    slot_label: "SE - placeholder threshold evidence"
  - role: tl
    slot_label: "TL - placeholder/descent rule boundary verification"
  - role: aim
    slot_label: "AIM - G8 manifest evidence update"
generates:
  - artifact_path: docs/plans/PLAN-L7-175-placeholder-threshold-g8-evidence.md
    artifact_type: markdown_doc
  - artifact_path: tests/placeholder-deps.test.ts
    artifact_type: test_code
  - artifact_path: .ut-tdd/evidence/g8-integration/20260626-it-adapter-asset-expansion.json
    artifact_type: json_config
dependencies:
  parent: docs/plans/PLAN-L7-174-skill-catalog-g8-evidence.md
  requires:
    - docs/plans/PLAN-L7-174-skill-catalog-g8-evidence.md
    - docs/test-design/harness/L8-integration-test-design.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T11:12:16+09:00"
    tests_green_at: "2026-06-29T11:12:16+09:00"
    verdict: approve
    scope: "L8 IT-ASSET-07 placeholder current-layer threshold proof and G8 evidence promotion."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\placeholder-deps.test.ts tests\\descent-obligation.test.ts tests\\g8-integration-workflow.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T11:12:16+09:00"
        evidence_path: tests/placeholder-deps.test.ts
        output_digest: "sha256:875f561b93958f2886aee99c08b502556e0684fe32dd4038f700d0b8add09916"
---

# PLAN-L7-175: placeholder threshold G8 evidence closure

## Objective

Close the direct L8 evidence gap for `IT-ASSET-07`: unresolved placeholder dependencies remain visible until the waiting layer, then fail validation once the target materializes without discharge.

## Scope

- Keep `placeholder-deps` responsible for visible carry and active L7 impl-state hard-fail.
- Keep `descent-obligation` responsible for impl-ahead threshold failure.
- Add a cross-rule `IT-ASSET-07` test proving both halves together.
- Promote only `IT-ASSET-07` in the G8 manifest.

## Acceptance

- Spec back-fill placeholder remains visible and green before materialization.
- Valid pre-threshold defer is represented as `deferred`.
- Materialized L7 implementation with the defer still open emits `implAhead` and fails.
- Active L7 impl-state placeholder fails through `placeholder-deps`.
- G8 manifest records `IT-ASSET-07` as mandatory passed.

## Residual L8 Partial Coverage

- `IT-ADAPTER-01..03` remain unclosed until provider invocation, error policy, and DSL fixture proofs exist.
