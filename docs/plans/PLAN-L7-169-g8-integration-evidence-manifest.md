---
plan_id: PLAN-L7-169-g8-integration-evidence-manifest
title: "PLAN-L7-169: G8 integration evidence manifest"
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
    slot_label: "TL - G8 evidence manifest wiring"
  - role: qa
    slot_label: "QA - IT-MODULE/IT-STATE evidence review"
generates:
  - artifact_path: docs/plans/PLAN-L7-169-g8-integration-evidence-manifest.md
    artifact_type: markdown_doc
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
  parent: docs/plans/PLAN-L7-168-g8-integration-workflow.md
  requires:
    - docs/plans/PLAN-L7-168-g8-integration-workflow.md
    - docs/plans/PLAN-REVERSE-169-g8-integration-evidence-manifest.md
    - docs/test-design/harness/L8-integration-test-design.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-26T21:20:00+09:00"
    tests_green_at: "2026-06-26T21:20:00+09:00"
    verdict: approve
    scope: "G8 now requires machine-readable integration evidence. IT-MODULE and IT-STATE deficiencies found during verification were handled by adding schema and partition isolation tests before manifesting the evidence."
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

# PLAN-L7-169: G8 integration evidence manifest

## Objective

Make G8 fail-close on executable integration evidence, not just on L8 workflow
wording. The first selectable L8 slice is the IT-MODULE + IT-STATE boundary
family.

## Scope

- Load `.ut-tdd/evidence/g8-integration/*.json` from `g8-integration-workflow`.
- Validate mandatory IT coverage, evidence paths, command exit codes, digest
  shape, and exit criteria.
- Add the first IT-MODULE + IT-STATE manifest.
- Close verification deficiencies found during evidence mapping:
  - `agent-slots` state now validates slot shapes through Zod and fails closed.
  - drive state partition evidence now detects unauthorized cross-drive artifact
    contamination.

## DoD

- [x] Doctor fails when G8 workflow exists but the evidence manifest is absent.
- [x] Doctor fails when a mandatory selected IT case is not passed.
- [x] IT-MODULE-01/02 and IT-STATE-01/02 have manifest coverage.
- [x] Newly found IT-STATE evidence gaps are backed by executable tests.
- [x] This slice advances L8 but does not claim full L8 close.
