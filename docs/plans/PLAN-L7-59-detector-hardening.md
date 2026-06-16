---
plan_id: PLAN-L7-59-detector-hardening
title: "PLAN-L7-59: detector hardening for verification-profile and DB trace projection"
kind: impl
layer: L7
drive: db
parent_design: docs/design/harness/L4-basic-design/architecture.md
status: completed
created: 2026-06-16
updated: 2026-06-16
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: gpt-5.4
    reviewer_model: gpt-5.4
    tests_green_at: "2026-06-16"
    reviewed_at: "2026-06-16"
    verdict: pass
    scope: "verification-profile hard gate wiring, trace_edges projection, db-projection-ingestion meta tests, doctor hard-gate aggregation meta test"
agent_slots:
  - role: tl
    slot_label: "TL - detector hardening"
generates:
  - artifact_path: src/lint/verification-profile.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/lint/db-projection-ingestion.ts
    artifact_type: source_module
  - artifact_path: tests/verification-profile.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
  - artifact_path: tests/db-projection-ingestion.test.ts
    artifact_type: test_code
dependencies:
  requires:
    - docs/design/harness/L5-detailed-design/physical-data.md
    - docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-59: detector hardening for verification-profile and DB trace projection

## Objective

All green checks must mean the harness detectors are actually enforcing the implementation surface, not only printing advisory summaries. This PLAN closes the discovered detector gaps:

- `verification-profile` must be a doctor hard gate, not a surface-only message.
- External verification profiles must remain disabled by default, but the detector must prove they have explicit approval/refusal routing.
- `trace_edges` must be populated from relation graph projection and must fail DB ingestion if empty.
- Optional telemetry/evidence tables that can legitimately be zero must be explicitly classified so zero rows are intentional, not accidental.

## Scope

- Add a pure `analyzeVerificationProfileGate` hard-gate analyzer.
- Wire `verificationProfile.ok` into `runDoctor.ok`.
- Project relation graph nodes into `artifact_registry` and graph edges into `trace_edges`.
- Add `trace_edges` to automatic DB projection ingestion requirements.
- Classify `model_evaluations` and `retry_events` as evidence-gated zero tables.
- Add meta tests for gate wiring, fail-closed behavior, and trace projection ingestion.

## Verification

- [x] `bunx vitest run tests\verification-profile.test.ts tests\db-projection-ingestion.test.ts tests\doctor.test.ts`
- [x] `bun run typecheck`
- [x] `bun run lint`
- [x] `bun src\cli.ts db rebuild --json`
- [x] `bun src\cli.ts db status --json`
- [x] `bun src\cli.ts doctor`

## DoD

- [x] `verification-profile` is connected to `runDoctor.ok`.
- [x] `checkVerificationProfile` fails closed when repo input cannot be read.
- [x] Disabled/external profile recommendations require approval/refusal routing without implicit execution.
- [x] `trace_edges` is non-empty after DB rebuild.
- [x] `orphanTraceEdges` remains 0 after DB rebuild.
- [x] DB ingestion detector fails when `trace_edges` is empty.
- [x] Zero evidence tables are explicit, not silent omissions.
