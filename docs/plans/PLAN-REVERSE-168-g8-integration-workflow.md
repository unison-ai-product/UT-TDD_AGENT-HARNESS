---
plan_id: PLAN-REVERSE-168-g8-integration-workflow
title: "PLAN-REVERSE-168: G8 integration workflow fullback"
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
    reason: "The requirement already records G8-G14 as future mechanization; this slice defines the first G8 workflow gate without changing product requirements."
  - layer: L4-basic-design
    decision: not_impacted
    evidence_path: docs/design/harness/L4-basic-design/function.md
    reason: "The L4 function model is unchanged; this slice adds the L8 execution workflow for existing integration-test design rows."
  - layer: L5-detailed-design
    decision: not_impacted
    evidence_path: docs/design/harness/L5-detailed-design/internal-processing.md
    reason: "The L5 contracts remain unchanged; G8-WORKFLOW selects and evidences existing IT-* coverage."
  - layer: test-design
    decision: updated
    evidence_path: docs/test-design/harness/L8-integration-test-design.md
    reason: "L8 had confirmed IT-* rows, but the G8 workflow layer needed explicit strategy/plan/condition/coverage/procedure/evidence/exit granularity."
  - layer: process-gates
    decision: updated
    evidence_path: docs/process/gates.md
    reason: "G8 now requires an integration evidence manifest and selected IT-* coverage rather than row presence alone."
  - layer: implementation
    decision: updated
    evidence_path: src/lint/g8-integration-workflow.ts
    reason: "Doctor now fails if the L8/G8 workflow markers are missing."
agent_slots:
  - role: tl
    slot_label: "TL - G8 workflow fullback"
  - role: qa
    slot_label: "QA - L8/G8 workflow review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-168-g8-integration-workflow.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/internal-processing.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
  - artifact_path: docs/process/gates.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/g8-integration-workflow.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
dependencies:
  parent: docs/plans/PLAN-L7-168-g8-integration-workflow.md
  requires:
    - docs/plans/PLAN-L7-168-g8-integration-workflow.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-26T20:30:00+09:00"
    tests_green_at: "2026-06-26T20:30:00+09:00"
    verdict: approve
    scope: "R4 fullback for G8 workflow granularity. L8 rows remain valid; the missing workflow/evidence gate layer is added and doctor-wired."
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
        output_digest: "sha256:2eab00f92a5bda76ff43a4b215d4620c117939e3221f808603492b5c7ed77d91"
---

# PLAN-REVERSE-168: G8 integration workflow fullback

## Objective

Record the back-propagation decision for the first L8 ascent: G8 cannot be a
concept-only gate or a checklist of IT-* rows. It needs an executable workflow
contract and doctor enforcement.

## Scope

- Preserve the confirmed L8 IT-* case design.
- Add the missing workflow layer that selects and executes IT-* rows.
- Wire a hard doctor check for the required workflow and gate markers.
- Keep full L8 close for later slices; this is the workflow foundation.

## Acceptance Criteria

- L8 test design declares `G8-WORKFLOW`.
- G8 process text requires an integration evidence manifest and selected IT-*
  coverage.
- `g8-integration-workflow` tests prove missing markers fail.
- Doctor reports `g8-integration-workflow - OK`.
