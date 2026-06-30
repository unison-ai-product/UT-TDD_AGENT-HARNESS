---
plan_id: PLAN-L7-188-verification-strategy-design-time-logging
title: "PLAN-L7-188: Verification strategy with runtime provenance gates"
kind: impl
layer: L7
drive: db
status: confirmed
created: 2026-06-29
updated: 2026-06-30
owner: Codex
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE - runtime provenance capture and projection-fail-close implementation"
  - role: tl
    slot_label: "TL - projection versus substance boundary review"
  - role: qa
    slot_label: "QA - L7 debug evidence and telemetry provenance gate verification"
generates:
  - artifact_path: docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/db-projection-ingestion.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/db-projection-ingestion.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
  - artifact_path: tests/token-tracker.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-110-takeover-feedback-surface.md
  requires:
    - docs/plans/PLAN-L7-192-db-telemetry-provenance-enforcement.md
    - docs/plans/PLAN-L7-193-runtime-test-run-provenance.md
    - docs/plans/PLAN-L7-199-runtime-model-telemetry-provenance.md
    - docs/plans/PLAN-L7-200-runtime-guardrail-telemetry-provenance.md
    - docs/plans/PLAN-L7-201-runtime-skill-telemetry-provenance.md
  references:
    - .ut-tdd/audit/A-144-03-verification-evidence-integrity.md
    - .ut-tdd/audit/A-144-04-db-registration-projection.md
    - .ut-tdd/audit/A-146-substance-gap-consolidated-remediation.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-30T11:49:21+09:00"
    tests_green_at: "2026-06-30T11:49:21+09:00"
    verdict: approve
    scope: "Close the parent verification-strategy plan by binding the landed telemetry provenance enforcement and runtime capture slices: projection-only telemetry can fail-close, runtime test/skill/guardrail rows carry session provenance, model telemetry can be overlaid in doctor and persisted through explicit telemetry scan."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\db-projection-ingestion.test.ts tests\\projection-writer.test.ts tests\\doctor.test.ts tests\\token-tracker.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T11:49:21+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:49a3731aead9ced7f2533912c25dcd714c165b407c7cdb134f1d27ffae7208c8"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T11:49:21+09:00"
        evidence_path: src/state-db/projection-writer.ts
        output_digest: "sha256:5fe7e619252bb9637163e01916815852487e1c8880cc5adc3e2b39a81ee91e47"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T11:49:21+09:00"
        evidence_path: src/doctor/index.ts
        output_digest: "sha256:c335922ccdb448a10ec315097268f14125723d6dceab08ea5562d87e74217128"
---

# PLAN-L7-188: Verification strategy with runtime provenance gates

## Objective

Close the cross-cutting "projection is not substance" gap for operational
telemetry. A table being populated, a digest matching a file, or a PLAN carrying
review evidence must not be enough to prove that a capability actually fired,
ran, or worked. Fired/used/works claims need runtime provenance or must remain
unverified.

## Original Gap

The audit found four telemetry surfaces that looked populated while not proving
runtime operation:

| Surface | Original problem |
| --- | --- |
| `skill_invocations` | Rows came from review-evidence projection, not actual skill firing. |
| `test_runs` | Rows represented green-command evidence projection, not captured test execution. |
| `guardrail_decisions` | Runtime guardrail decisions were effectively unwired. |
| `model_runs` | Review model rows existed, but token/cost runtime rows were absent. |

The same root appeared in verification evidence integrity: a hash restamp proves
that the digest matches the current file, not that the green command was
re-executed on that file.

## Landed Implementation

This parent plan is closed by the following confirmed implementation slices:

| Slice | Result |
| --- | --- |
| `PLAN-L7-192` | Added `enforceTelemetryProvenance` so projection-only telemetry can fail closed when provenance is required. |
| `PLAN-L7-193` | Projects runtime `test_runs` from session-log verification events with non-empty `session_id`. |
| `PLAN-L7-199` | Overlays Claude/Codex runtime JSONL token telemetry into doctor provenance checks and keeps deterministic DB rebuild separate. |
| `PLAN-L7-200` | Projects runtime forced-stop events into `guardrail_decisions` with non-empty `session_id`. |
| `PLAN-L7-201` | Classifies `ut-tdd skill suggest` as `Bash (skill)` and projects runtime `skill_invocations` with non-empty `session_id`. |

## Acceptance Status

- Projection-only telemetry is distinguishable from runtime telemetry.
- `analyzeDbProjectionIngestion(..., { enforceTelemetryProvenance: true })`
  fails closed when a populated telemetry table has no runtime provenance.
- Default `doctor` no longer reports `db-telemetry-provenance - partial` in the
  current runtime state.
- Runtime provenance exists in the local DB for `skill_invocations`,
  `test_runs`, and `guardrail_decisions`.
- Runtime model telemetry is available in two tiers:
  - `doctor` overlays existing Claude/Codex JSONL token logs in memory so model
    telemetry is not judged from review-evidence rows alone.
  - `ut-tdd telemetry scan` is the explicit persistence path that ingests token
    rows into `.ut-tdd/harness.db`.

## Evidence Snapshot

On 2026-06-30, after `bun run src\cli.ts telemetry scan --json`, the local
runtime telemetry DB contained at least:

| Table | Runtime evidence |
| --- | --- |
| `skill_invocations` | `rows>=1645`, `runtime_rows>=5` |
| `test_runs` | `rows>=763`, `runtime_rows>=396` |
| `guardrail_decisions` | `rows>=42`, `runtime_rows>=40` |
| `model_runs` | `rows>=105453`, `session_rows>=104947`, `valued_rows>=104947` |

This proves the local state can carry real runtime provenance rather than only
review-evidence projection. Deterministic `db rebuild` intentionally does not
scan user runtime logs; use `telemetry scan` when a persistent token/cost
snapshot is required.

## Residual Boundary

This does not claim external release, public repository publication, or
cross-machine UAT. It closes the L7 verification-strategy implementation gap
inside the local harness. Public clean-repo, tag, signed tarball, and consumer
UAT remain external/human-gated release activities.
