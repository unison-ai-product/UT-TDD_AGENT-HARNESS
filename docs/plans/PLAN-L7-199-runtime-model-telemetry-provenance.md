---
plan_id: PLAN-L7-199-runtime-model-telemetry-provenance
title: "PLAN-L7-199: Runtime model telemetry provenance in doctor"
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
    slot_label: "SE - runtime model telemetry provenance"
  - role: tl
    slot_label: "TL - telemetry provenance boundary review"
generates:
  - artifact_path: docs/plans/PLAN-L7-199-runtime-model-telemetry-provenance.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
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
    - docs/plans/PLAN-L7-193-runtime-test-run-provenance.md
  references:
    - docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T20:52:00+09:00"
    tests_green_at: "2026-06-29T20:52:00+09:00"
    verdict: approve
    scope: "Overlay runtime Claude/Codex JSONL token telemetry into doctor provenance checks so model_runs are no longer hollow review-evidence-only telemetry."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/db-projection-ingestion.test.ts tests/doctor.test.ts tests/token-tracker.test.ts tests/cli-surface.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T20:50:08+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:d9528134d8ae18ee34dc2f645f971d77feae52b82f48efa05e2833c58b59b087"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-29T20:47:33+09:00"
        evidence_path: src/doctor/index.ts
        output_digest: "sha256:c335922ccdb448a10ec315097268f14125723d6dceab08ea5562d87e74217128"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-29T20:47:33+09:00"
        evidence_path: src/doctor/index.ts
        output_digest: "sha256:c335922ccdb448a10ec315097268f14125723d6dceab08ea5562d87e74217128"
---

# PLAN-L7-199: Runtime model telemetry provenance in doctor

## Objective

Reduce the `model_runs` hollow-schema gap identified by PLAN-L7-188 and
PLAN-L7-192. Doctor should not rely only on review-evidence model projections
when deciding whether model telemetry has runtime provenance; it should also
consume the existing Claude/Codex JSONL token telemetry scanner.

## Scope

- Overlay runtime session usage into doctor in-memory DB checks by calling
  `loadRuntimeSessionUsage` and `projectTokenUsage`.
- Keep deterministic `ut-tdd db rebuild` as a source projection. It must not
  scan user runtime logs or make rebuild row counts environment-dependent.
- Do not launch Claude/Codex providers; only read already-written JSONL logs.
- Do not claim full DB telemetry closure. `skill_invocations` and
  `guardrail_decisions` runtime capture remain separate work.

## Acceptance Criteria

- `doctor` can count token/cost-valued `model_runs` as runtime provenance.
- `db-telemetry-provenance` partial count drops from three tables to two when
  runtime session usage logs are available.
- Typecheck, lint, targeted DB/doctor/token tests, and doctor are green for
  this slice.
