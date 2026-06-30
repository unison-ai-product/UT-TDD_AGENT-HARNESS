---
plan_id: PLAN-L7-200-runtime-guardrail-telemetry-provenance
title: "PLAN-L7-200: Runtime guardrail telemetry provenance"
kind: impl
layer: L7
drive: db
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - runtime guardrail telemetry provenance"
  - role: tl
    slot_label: "TL - guardrail provenance boundary review"
generates:
  - artifact_path: docs/plans/PLAN-L7-200-runtime-guardrail-telemetry-provenance.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-192-db-telemetry-provenance-enforcement.md
  requires:
    - docs/plans/PLAN-L7-192-db-telemetry-provenance-enforcement.md
    - docs/plans/PLAN-L7-193-runtime-test-run-provenance.md
    - docs/plans/PLAN-L7-199-runtime-model-telemetry-provenance.md
  references:
    - docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T21:24:13+09:00"
    tests_green_at: "2026-06-29T21:24:13+09:00"
    verdict: approve
    scope: "Project runtime forced-stop session events into guardrail_decisions with non-empty session_id so guardrail telemetry is not projection-only."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/projection-writer.test.ts tests/db-projection-ingestion.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T21:24:13+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:0fe467c17fa13c617e69dccb8d31840b144ff35a4a5548b5ac4f4ff83bd6ee31"
---

# PLAN-L7-200: Runtime guardrail telemetry provenance

## Objective

Reduce the `guardrail_decisions` projection facade identified by PLAN-L7-188
and PLAN-L7-192. Runtime safety decisions must carry session provenance when
they are derived from actual hook events.

## Scope

- Project session-log `forced_stop` events into `guardrail_decisions`.
- Preserve the distinction between real safety decisions and ordinary tool
  usage. Non-guardrail `tool_use` events must not fabricate guardrail telemetry.
- Keep projection-only issue approval guardrails as separate queue/governance
  evidence.
- Do not claim full DB telemetry closure. `skill_invocations` runtime capture
  remains separate work.

## Acceptance Criteria

- A `forced_stop` session event creates a `guardrail_decisions` row with
  non-empty `session_id`, `guardrail=forced-stop`, `decision=block`, and
  `mode=runtime-hook`.
- Ordinary tool events do not create guardrail decisions.
- Doctor reduces DB telemetry provenance partial scope when runtime forced-stop
  logs are present.
