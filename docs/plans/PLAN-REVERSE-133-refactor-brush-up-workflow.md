---
plan_id: PLAN-REVERSE-133-refactor-brush-up-workflow
title: "PLAN-REVERSE-133: refactor brush-up workflow fullback"
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
    reason: "Refactor Green now requires linked regression test IDs and relation impact closure; DB projection may trigger Refactor candidates."
  - layer: L3-functional
    decision: updated
    evidence_path: docs/design/harness/L3-functional/functional-requirements.md
    reason: "FR-25 ACs now cover test-ID-linked green, DB trigger, and dependency impact failure."
  - layer: L4-basic-design
    decision: updated
    evidence_path: docs/design/harness/L4-basic-design/function.md
    reason: "Refactor state colors and DB projection boundary are part of the mode building-block contract."
  - layer: L5-detailed-design
    decision: not_impacted
    evidence_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    reason: "No module boundary or storage structure changed; relation graph is reused as an existing dependency substrate."
  - layer: L6-function-design
    decision: updated
    evidence_path: docs/design/harness/L6-function-design/function-spec.md
    reason: "assertRefactorInvariant requires linked regression test IDs."
  - layer: implementation
    decision: updated
    evidence_path: src/workflow/contracts.ts
    reason: "The contract function fails Green without test IDs."
agent_slots:
  - role: tl
    slot_label: "TL - refactor brush-up workflow fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-133-refactor-brush-up-workflow.md
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
  - artifact_path: docs/process/modes/refactor.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-133-refactor-brush-up-workflow.md
  requires:
    - docs/plans/PLAN-L7-133-refactor-brush-up-workflow.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T18:11:57+09:00"
    tests_green_at: "2026-06-23T18:11:57+09:00"
    verdict: approve
    scope: "Reverse fullback confirms Refactor mode changes returned to requirements and design."
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

# PLAN-REVERSE-133: refactor brush-up workflow fullback

## Objective

Back-propagate the Refactor brush-up workflow hardening into requirements and
design so the drive model is not only changed at implementation level.

## R4 Routing

Forward routing is L3 because the functional acceptance criteria for FR-L1-25
changed. L4 and L6 are updated as downstream design refinements.

L5 is explicitly not impacted: `docs/design/harness/L5-detailed-design/module-decomposition.md`
already assigns relation-graph reuse as the dependency substrate, and this
slice does not introduce a new module boundary or storage structure.

## Acceptance Criteria

- Requirements state the Refactor Green condition.
- L3 FR-25 has DB trigger and dependency impact ACs.
- L4 states the Red / Yellow / Green meaning and projection boundary.
- L6 `assertRefactorInvariant` matches the implementation contract.
