---
plan_id: PLAN-L7-201-runtime-skill-telemetry-provenance
title: "PLAN-L7-201: Runtime skill telemetry provenance"
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
    slot_label: "SE - runtime skill telemetry provenance"
  - role: tl
    slot_label: "TL - skill provenance boundary review"
generates:
  - artifact_path: docs/plans/PLAN-L7-201-runtime-skill-telemetry-provenance.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/verb-classify.ts
    artifact_type: source_module
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
  - artifact_path: tests/session-log.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-192-db-telemetry-provenance-enforcement.md
  requires:
    - docs/plans/PLAN-L7-192-db-telemetry-provenance-enforcement.md
    - docs/plans/PLAN-L7-193-runtime-test-run-provenance.md
    - docs/plans/PLAN-L7-199-runtime-model-telemetry-provenance.md
    - docs/plans/PLAN-L7-200-runtime-guardrail-telemetry-provenance.md
  references:
    - docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T21:17:22+09:00"
    tests_green_at: "2026-06-29T21:17:22+09:00"
    verdict: approve
    scope: "Classify ut-tdd skill suggest as a durable session-log skill event and project runtime skill_invocations with non-empty session_id."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/projection-writer.test.ts tests/session-log.test.ts tests/db-projection-ingestion.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T21:17:22+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:0fe467c17fa13c617e69dccb8d31840b144ff35a4a5548b5ac4f4ff83bd6ee31"
---

# PLAN-L7-201: Runtime skill telemetry provenance

## Objective

Close the remaining `skill_invocations` projection facade identified by
PLAN-L7-188 and PLAN-L7-192. Skill telemetry that claims a skill was used must
be distinguishable from review-evidence projection.

## Scope

- Classify `ut-tdd skill suggest` Bash commands as durable `Bash (skill)`
  session-log events.
- Project `Bash (skill)` session events into `skill_invocations` rows with
  non-empty `session_id` and `source=runtime-hook:skill-suggest`.
- Preserve the boundary that generic Bash activity does not fabricate skill
  invocation telemetry.

## Acceptance Criteria

- `summarize()` records skill suggestion commands as `Bash (skill)`.
- `projectRuntimeSkillInvocationFromSessionEvent` creates runtime
  `skill_invocations` rows only for `Bash (skill)` events.
- Doctor's DB telemetry provenance check reaches full OK when a runtime skill
  session event exists in `.ut-tdd/logs/session`.
