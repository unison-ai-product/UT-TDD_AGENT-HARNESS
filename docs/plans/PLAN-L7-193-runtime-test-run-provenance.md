---
plan_id: PLAN-L7-193-runtime-test-run-provenance
title: "PLAN-L7-193: Runtime test_run provenance from session logs"
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
    slot_label: "SE - runtime test_run provenance projection"
  - role: tl
    slot_label: "TL - projection versus runtime evidence review"
generates:
  - artifact_path: docs/plans/PLAN-L7-193-runtime-test-run-provenance.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-192-db-telemetry-provenance-enforcement.md
  requires:
    - docs/plans/PLAN-L7-192-db-telemetry-provenance-enforcement.md
  references:
    - docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "Project runtime-provenance test_runs from real session-log Bash verification events while ignoring non-verification Bash tool use."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/projection-writer.test.ts tests/review-evidence.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:76825939ad6fd3e16a3c4225beada88354d62666a8deade364be07280e0c3320"
        anchor_commit: 3f9adfea88616ba33fe8ff23aebc730c4b0c9cb3
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/state-db/projection-writer.ts
        output_digest: "sha256:1a61852bc66a939e4624a516ec9b5a5a4147becd6ac8e06842b25bca7e51bd1a"
        anchor_commit: b3904eca7a50e185da4aeb1fa4177f0b3b64e271
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/state-db/projection-writer.ts
        output_digest: "sha256:1a61852bc66a939e4624a516ec9b5a5a4147becd6ac8e06842b25bca7e51bd1a"
        anchor_commit: b3904eca7a50e185da4aeb1fa4177f0b3b64e271
---

# PLAN-L7-193: Runtime test_run provenance from session logs

## Objective

Reduce the `test_runs` projection-facade gap identified by PLAN-L7-188 and
PLAN-L7-192: when a real hook session logs a Bash verification action, the DB
rebuild should preserve that non-empty `session_id` as runtime provenance rather
than leaving all `test_runs` rows as review-evidence projection.

## Scope

- Derive runtime `test_runs` rows from `.ut-tdd/logs/session/*.jsonl`
  `tool_use` events.
- Accept only sanitized Bash verification targets already produced by
  `session-log` (`Bash (vitest)`, `Bash (test)`, `Bash (tsc)`,
  `Bash (doctor)`, `Bash (lint)`, `Bash (eslint)`).
- Preserve the session JSONL path as evidence and set non-verification Bash
  events aside.
- Do not claim full DB telemetry closure; `skill_invocations`,
  `guardrail_decisions`, and `model_runs` runtime capture remain separate
  work.

## Acceptance Criteria

- A recognized session-log verification event creates one `test_runs` row with
  non-empty `session_id`, `runtime=hook-session-log`, and
  `scope=runtime-hook`.
- A non-verification Bash event does not create runtime test evidence.
- Projection writer tests, typecheck, review-evidence lint, and doctor are
  green for this slice.
