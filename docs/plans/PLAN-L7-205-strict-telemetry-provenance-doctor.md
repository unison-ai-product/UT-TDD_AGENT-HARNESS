---
plan_id: PLAN-L7-205-strict-telemetry-provenance-doctor
title: "PLAN-L7-205: Strict telemetry provenance doctor flag"
kind: impl
layer: L7
drive: db
status: confirmed
created: 2026-06-30
updated: 2026-06-30
owner: Codex
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE - strict telemetry provenance doctor flag"
  - role: qa
    slot_label: "QA - projection-only telemetry fail-close verification"
generates:
  - artifact_path: docs/plans/PLAN-L7-205-strict-telemetry-provenance-doctor.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md
  requires:
    - docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md
    - docs/plans/PLAN-L7-192-db-telemetry-provenance-enforcement.md
    - docs/plans/PLAN-L7-193-runtime-test-run-provenance.md
    - docs/plans/PLAN-L7-199-runtime-model-telemetry-provenance.md
    - docs/plans/PLAN-L7-200-runtime-guardrail-telemetry-provenance.md
    - docs/plans/PLAN-L7-201-runtime-skill-telemetry-provenance.md
  references:
    - .ut-tdd/audit/A-144-04-db-registration-projection.md
    - .ut-tdd/audit/A-146-substance-gap-consolidated-remediation.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "Expose strict DB telemetry provenance enforcement through doctor without breaking default CI self-sufficiency. Verification cycles can now fail-close projection-only telemetry via `ut-tdd doctor --strict-telemetry-provenance`."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\cli-surface.test.ts -t \"strict telemetry provenance\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T22:01:00+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:c6aa218270dcf1a164768508e4bce5818cef05b59fa102a3846a08492e83de55"
      - kind: unit_test
        command: "bun run vitest run tests\\db-projection-ingestion.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T12:29:02+09:00"
        evidence_path: tests/db-projection-ingestion.test.ts
        output_digest: "sha256:53507c4d465d3fde47369dbcb3051da02dd7f0df502924239086634b07ff5fef"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/doctor/index.ts
        output_digest: "sha256:e0d5812770ccc3042a6c484f68dda86f62c63eae3801ff156660065730df97ea"
---

# PLAN-L7-205: Strict telemetry provenance doctor flag

## Objective

Make the existing telemetry provenance enforcement executable from `ut-tdd doctor`
so a verification cycle can fail-close tables that are populated only by
projection while still keeping the default CI lane self-sufficient on clean
checkouts.

## Change

- `checkDbProjectionIngestion` accepts `strictTelemetryProvenance`.
- `runDoctor` forwards the same option to the DB ingestion gate.
- `ut-tdd doctor --strict-telemetry-provenance` exposes the strict path as an
  explicit verification-cycle gate.
- Default `ut-tdd doctor` remains compatible with CI environments that do not
  carry local runtime transcript directories.

## Acceptance

- Projection-only telemetry still fails closed when strict provenance is enabled
  by the existing `db-projection-ingestion` oracle.
- The CLI documents the strict flag in `doctor --help`.
- TypeScript compilation remains green.
