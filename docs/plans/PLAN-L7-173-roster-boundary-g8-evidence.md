---
plan_id: PLAN-L7-173-roster-boundary-g8-evidence
title: "PLAN-L7-173: roster boundary G8 evidence closure"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/plans/PLAN-L7-172-roster-cli-g8-evidence.md
backprop_decision: not_required
backprop_decision_reason: "This closes the already-designed L8 IT-ASSET-03 import-direction proof. It adds a file-level runtime roster boundary check without changing the L8 test design contract."
agent_slots:
  - role: se
    slot_label: "SE - dependency boundary implementation"
  - role: tl
    slot_label: "TL - runtime/roster direction verification"
  - role: aim
    slot_label: "AIM - G8 manifest evidence update"
generates:
  - artifact_path: docs/plans/PLAN-L7-173-roster-boundary-g8-evidence.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/dependency-drift.ts
    artifact_type: source_module
  - artifact_path: tests/dependency-drift.test.ts
    artifact_type: test_code
  - artifact_path: .ut-tdd/evidence/g8-integration/20260626-it-adapter-asset-expansion.json
    artifact_type: json_config
dependencies:
  parent: docs/plans/PLAN-L7-172-roster-cli-g8-evidence.md
  requires:
    - docs/plans/PLAN-L7-172-roster-cli-g8-evidence.md
    - docs/test-design/harness/L8-integration-test-design.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "L8 IT-ASSET-03 runtime/roster import-direction proof and G8 evidence promotion."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\dependency-drift.test.ts tests\\agent-slots.test.ts tests\\g8-integration-workflow.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/dependency-drift.test.ts
        output_digest: "sha256:c17e61c86a61d36ec5556b8ae43aef32249ca6d36998edc5813f300d9833c58b"
        anchor_commit: e468ece632d7fd29c4dd3dbef301c2b38e847082
---

# PLAN-L7-173: roster boundary G8 evidence closure

## Objective

Close the direct L8 evidence gap for `IT-ASSET-03`: dependency direction between runtime, guard, and roster boundaries.

## Scope

- Add file-level relative import edges to `dependency-drift`.
- Fail closed when roster imports runtime or guard modules.
- Fail closed when guard imports roster directly.
- Allow the single intended `src/runtime/agent-slots.ts` to `src/runtime/agent-slots-roster.ts` edge.
- Promote only `IT-ASSET-03` in the G8 manifest.

## Acceptance

- Fixture with `agent-slots -> agent-slots-roster` passes.
- Reverse roster import and guard-to-roster import fail closed.
- Real repository has exactly one import edge to `agent-slots-roster.ts`.
- Targeted dependency/roster/G8 workflow tests pass.

## Residual L8 Partial Coverage

- `IT-ADAPTER-01..03` remain unclosed until provider invocation, error policy, and DSL fixture proofs exist.
- `IT-ASSET-04` remains partial until optional-root empty-with-evidence proof is direct.
- `IT-ASSET-07` remains partial until threshold behavior is proven at the current layer boundary.
