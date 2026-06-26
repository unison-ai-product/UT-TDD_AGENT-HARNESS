---
plan_id: PLAN-REVERSE-169-g8-integration-evidence-manifest
title: "PLAN-REVERSE-169: G8 evidence manifest fullback"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: agent
status: confirmed
created: 2026-06-26
updated: 2026-06-26
owner: Codex
forward_routing: L5
promotion_strategy: reuse-with-hardening
backprop_scope:
  - layer: requirements
    decision: not_impacted
    evidence_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    reason: "The requirements already require gate evidence and mechanization; this slice adds G8 manifest enforcement without changing the requirement set."
  - layer: L4-basic-design
    decision: not_impacted
    evidence_path: docs/design/harness/L4-basic-design/function.md
    reason: "The functional boundary remains unchanged; the slice hardens L8 evidence selection and state verification."
  - layer: L5-detailed-design
    decision: not_impacted
    evidence_path: docs/design/harness/L5-detailed-design/internal-processing.md
    reason: "Existing L5 contracts remain valid; the new checks make IT-MODULE and IT-STATE evidence executable."
  - layer: test-design
    decision: updated
    evidence_path: docs/test-design/harness/L8-integration-test-design.md
    reason: "L8 now names the machine-readable G8 manifest location."
  - layer: implementation
    decision: updated
    evidence_path: src/lint/g8-integration-workflow.ts
    reason: "G8 workflow lint now loads and validates integration evidence manifests."
  - layer: runtime-state
    decision: updated
    evidence_path: src/runtime/agent-slots.ts
    reason: "IT-STATE-01 deficiency was closed by schema-validating agent slot state."
  - layer: workflow-state
    decision: updated
    evidence_path: src/workflow/contracts-extras.ts
    reason: "IT-STATE-02 deficiency was closed by drive partition contamination detection."
  - layer: evidence
    decision: updated
    evidence_path: .ut-tdd/evidence/g8-integration/20260626-it-module-state-minimum.json
    reason: "The selected IT-MODULE + IT-STATE coverage is now machine-readable."
agent_slots:
  - role: tl
    slot_label: "TL - G8 evidence fullback"
  - role: qa
    slot_label: "QA - IT-MODULE/IT-STATE gap review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-169-g8-integration-evidence-manifest.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/internal-processing.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
  - artifact_path: .ut-tdd/evidence/g8-integration/20260626-it-module-state-minimum.json
    artifact_type: json_config
  - artifact_path: src/lint/g8-integration-workflow.ts
    artifact_type: source_module
  - artifact_path: src/runtime/agent-slots.ts
    artifact_type: source_module
  - artifact_path: src/workflow/contracts-extras.ts
    artifact_type: source_module
  - artifact_path: tests/g8-integration-workflow.test.ts
    artifact_type: test_code
  - artifact_path: tests/agent-slots.test.ts
    artifact_type: test_code
  - artifact_path: tests/workflow-contracts.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-169-g8-integration-evidence-manifest.md
  requires:
    - docs/plans/PLAN-L7-169-g8-integration-evidence-manifest.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-26T21:20:00+09:00"
    tests_green_at: "2026-06-26T21:20:00+09:00"
    verdict: approve
    scope: "R4 fullback for G8 evidence manifest enforcement. Deficiencies in IT-STATE direct evidence were handled as implementation/test hardening."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\dependency-drift.test.ts tests\\lint-wiring.test.ts tests\\agent-slots.test.ts tests\\workflow-contracts.test.ts tests\\g8-integration-workflow.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T21:20:00+09:00"
        evidence_path: tests/g8-integration-workflow.test.ts
        output_digest: "sha256:fa256d0890c52c151aa718e56146b0830df23c20fa2dd6eb83b28452347b864d"
---

# PLAN-REVERSE-169: G8 evidence manifest fullback

## Objective

Record the back-propagation decision for turning G8 from a workflow marker check
into an evidence-bearing integration gate.

## Scope

- Preserve the confirmed L8 integration test design.
- Add machine-readable manifest enforcement for selected IT-* coverage.
- Backfill the discovered IT-STATE gaps with executable state and partition
  tests.

## Acceptance Criteria

- Missing manifest is a G8 violation.
- Failed mandatory IT coverage is a G8 violation.
- IT-MODULE-01/02 and IT-STATE-01/02 have direct executable evidence.
- `doctor` reports `g8-integration-workflow - OK`.
