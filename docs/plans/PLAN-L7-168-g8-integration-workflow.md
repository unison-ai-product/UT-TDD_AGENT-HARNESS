---
plan_id: PLAN-L7-168-g8-integration-workflow
title: "PLAN-L7-168: G8 integration workflow granularity"
kind: add-impl
layer: L7
drive: agent
status: confirmed
created: 2026-06-26
updated: 2026-06-26
owner: Codex
parent_design: docs/test-design/harness/L8-integration-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - G8 workflow gate wiring"
  - role: qa
    slot_label: "QA - L8 integration workflow granularity"
generates:
  - artifact_path: docs/plans/PLAN-L7-168-g8-integration-workflow.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
  - artifact_path: docs/process/gates.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/g8-integration-workflow.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/g8-integration-workflow.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-130-right-arm-gate-planning.md
  requires:
    - docs/plans/PLAN-L7-130-right-arm-gate-planning.md
    - docs/test-design/harness/L8-integration-test-design.md
    - docs/process/gates.md
    - docs/plans/PLAN-REVERSE-168-g8-integration-workflow.md
  references:
    - docs/governance/gate-design.md
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-26T20:30:00+09:00"
    tests_green_at: "2026-06-26T20:30:00+09:00"
    verdict: approve
    scope: "G8 workflow granularity is wired into doctor as a fail-close check. This slice defines entry/selection/procedure/evidence/exit for L8 ascent; it does not claim full L8 close."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\g8-integration-workflow.test.ts tests\\lint-wiring.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T20:30:00+09:00"
        evidence_path: tests/g8-integration-workflow.test.ts
        output_digest: "sha256:0000000000000000000000000000000000000000000000000000000000000000"
---

# PLAN-L7-168: G8 integration workflow granularity

## Objective

Make the first L8 ascent measurable. L8 already has confirmed IT-* case rows,
but G8 still needed workflow granularity: strategy, plan, selected conditions,
coverage items, procedures, execution evidence, exit criteria, and defect
routing.

## Scope

- Add `G8-WORKFLOW` to the L8 integration test design.
- Add a G8 process note that requires an integration evidence manifest and
  selected IT-* coverage before a slice can pass G8.
- Add `g8-integration-workflow` lint and wire it into `doctor`.
- Add tests for missing and present workflow markers.

## External Reference Handling

Downloads / HELIX workflow samples and current public testing references were
used only as comparison material. They are not canonical UT-TDD runtime state.
The adopted contract is the UT-TDD-specific workflow chain:
`test_strategy -> test_plan -> test_conditions -> coverage_items ->
test_procedures -> execution_evidence -> exit_criteria -> defect_routing`.

## DoD

- [x] L8 test design contains executable G8 workflow granularity.
- [x] G8 process doc no longer allows closing from IT-* rows alone.
- [x] Doctor fails if the L8/G8 workflow markers are absent.
- [x] Targeted G8 workflow tests pass.
- [x] This slice remains a first ascent step and does not claim full L8 close.
