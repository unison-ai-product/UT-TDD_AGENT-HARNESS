---
plan_id: PLAN-REVERSE-134-tdd-drive-fit-classification
title: "PLAN-REVERSE-134: TDD drive fit classification fullback"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: agent
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
    reason: "Requirements define strong/partial/weak TDD fit and DB firing boundaries."
  - layer: L3-functional
    decision: updated
    evidence_path: docs/design/harness/L3-functional/functional-requirements.md
    reason: "Functional ACs define classifyDriveTddFits and DB-triggered Red."
  - layer: L4-basic-design
    decision: updated
    evidence_path: docs/design/harness/L4-basic-design/function.md
    reason: "Basic design records the cross-drive TDD fit table and trigger sources."
  - layer: L5-detailed-design
    decision: not_impacted
    evidence_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    reason: "No module boundary changes; existing workflow contract module is extended."
  - layer: L6-function-design
    decision: updated
    evidence_path: docs/design/harness/L6-function-design/function-spec.md
    reason: "L6 adds the classifyDriveTddFits contract."
  - layer: implementation
    decision: updated
    evidence_path: src/workflow/contracts.ts
    reason: "The contract returns TDD fit, Red triggers, Yellow state, and Green requirements."
agent_slots:
  - role: tl
    slot_label: "TL - TDD drive fit classification fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-134-tdd-drive-fit-classification.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L3-functional/functional-requirements.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/process/modes/README.md
    artifact_type: markdown_doc
  - artifact_path: src/workflow/contracts.ts
    artifact_type: source_module
dependencies:
  parent: docs/plans/PLAN-L7-134-tdd-drive-fit-classification.md
  requires:
    - docs/plans/PLAN-L7-134-tdd-drive-fit-classification.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T18:11:57+09:00"
    tests_green_at: "2026-06-23T18:11:57+09:00"
    verdict: approve
    scope: "Reverse fullback for TDD drive fit classification."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts -t \"implements routing\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T18:11:57+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:2a08f62b3f8de0104c840e9941a3c33fc6b4c26e66e0ba47070f6398d93d6590"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T18:11:57+09:00"
        evidence_path: src/workflow/contracts.ts
        output_digest: "sha256:fff49252866a549ac96498c868bc193410867829a119f1a93d9d52e36551e791"
---

# PLAN-REVERSE-134: TDD drive fit classification fullback

## Objective

Back-propagate cross-drive TDD fit classification into requirements and design.

## R4 Routing

Forward routing is L3 because the functional workflow behavior changes: drive
models and design specialties now expose machine-readable TDD fit and DB firing
sources.

L5 is not impacted: `docs/design/harness/L5-detailed-design/module-decomposition.md`
already maps workflow contracts to `src/workflow/contracts.ts`; this slice adds
a pure contract in that module without changing module boundaries.

## Acceptance Criteria

- Requirements include strong/partial/weak classification and DB firing limits.
- L3 has acceptance criteria for classification and DB-triggered Red.
- L4 has the cross-drive table and projection boundary.
- L6 documents `classifyDriveTddFits`.
