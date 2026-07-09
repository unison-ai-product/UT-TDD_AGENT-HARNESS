---
plan_id: PLAN-L7-179-g9-system-workflow
title: "PLAN-L7-179: G9 system workflow evidence gate"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/plans/PLAN-L7-178-d-contract-dsl-g8-evidence.md
backprop_decision: not_required
backprop_decision_reason: "This promotes the already-confirmed L9 system-test design into an executable G9 workflow gate. No lower-layer requirement is changed."
agent_slots:
  - role: se
    slot_label: "SE - G9 system workflow lint"
  - role: tl
    slot_label: "TL - system-test granularity verification"
  - role: aim
    slot_label: "AIM - G9 manifest evidence update"
generates:
  - artifact_path: docs/plans/PLAN-L7-179-g9-system-workflow.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/g9-system-workflow.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/g9-system-workflow.test.ts
    artifact_type: test_code
  - artifact_path: docs/process/gates.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L9-system-test-design.md
    artifact_type: test_design
  - artifact_path: .ut-tdd/evidence/g9-system/20260629-st-system-minimum.json
    artifact_type: json_config
dependencies:
  parent: docs/plans/PLAN-L7-178-d-contract-dsl-g8-evidence.md
  requires:
    - docs/test-design/harness/L9-system-test-design.md
    - docs/process/gates.md
    - src/lint/g8-integration-workflow.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T12:37:00+09:00"
    tests_green_at: "2026-06-29T12:37:00+09:00"
    verdict: approve
    scope: "L9 G9 system workflow manifest/lint gate and minimum ST family evidence."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\g9-system-workflow.test.ts tests\\lint-wiring.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T12:20:00+09:00"
        evidence_path: tests/g9-system-workflow.test.ts
        output_digest: "sha256:7ca4e705639b5f3f0f9b814663666ffe57f95c93d4d394b743fae8b7080c68cb"
        anchor_commit: 6b5d6c057ffb5d86b5bb47467c91ac9b48a464a9
      - kind: unit_test
        command: "bun run vitest run tests\\review-evidence.test.ts tests\\dependency-drift.test.ts tests\\workflow-contracts.test.ts tests\\asset-drift.test.ts tests\\runtime-adapter.test.ts tests\\g9-system-workflow.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T12:37:00+09:00"
        evidence_path: tests/g9-system-workflow.test.ts
        output_digest: "sha256:7ca4e705639b5f3f0f9b814663666ffe57f95c93d4d394b743fae8b7080c68cb"
        anchor_commit: 6b5d6c057ffb5d86b5bb47467c91ac9b48a464a9
---

# PLAN-L7-179: G9 system workflow evidence gate

## Objective

Make L9 system-test execution measurable before closing higher right-arm verification work. G9 must not pass by `ST-*` row presence alone; it needs explicit workflow markers, a system evidence manifest, family-level `ST-*` coverage, executable procedures, and exit criteria.

## Scope

- Add `g9-system-workflow` lint, modeled after `g8-integration-workflow` but using G9/ST terminology.
- Require the L9 ST families `ST-DATA`, `ST-ARCH`, `ST-FUNC`, `ST-ASSET`, and `ST-EXT` to be represented in selected and mandatory evidence.
- Wire the lint into `doctor` so it is fail-closed and reachable from the CLI path.
- Add a minimum evidence manifest backed by existing system-level tests.
- Update gates and L9 test design with `G9-WORKFLOW` markers.

## Acceptance

- Missing G9 workflow markers fail.
- Missing system evidence manifest fails.
- Missing mandatory ST coverage or non-passed coverage fails.
- Missing required ST families fail.
- Live repo passes `g9-system-workflow`.
- Doctor reports `g9-system-workflow - OK`.

## Residual L9 Partial Coverage

- The new manifest is a minimum family-spanning G9 slice, not full exhaustion of every ST row. Further L9 work can promote additional `ST-*` rows into the same manifest family without changing the gate shape.
