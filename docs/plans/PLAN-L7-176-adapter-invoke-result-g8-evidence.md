---
plan_id: PLAN-L7-176-adapter-invoke-result-g8-evidence
title: "PLAN-L7-176: adapter InvokeResult G8 evidence closure"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/plans/PLAN-L7-175-placeholder-threshold-g8-evidence.md
backprop_decision: not_required
backprop_decision_reason: "This closes the already-designed L8 IT-ADAPTER-01 mock provider normalization proof. It adds provider-independent InvokeResult evidence without changing lower-layer requirements."
agent_slots:
  - role: se
    slot_label: "SE - adapter InvokeResult evidence"
  - role: tl
    slot_label: "TL - provider boundary verification"
  - role: aim
    slot_label: "AIM - G8 manifest evidence update"
generates:
  - artifact_path: docs/plans/PLAN-L7-176-adapter-invoke-result-g8-evidence.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/adapter.ts
    artifact_type: source_module
  - artifact_path: tests/runtime-adapter.test.ts
    artifact_type: test_code
  - artifact_path: .ut-tdd/evidence/g8-integration/20260626-it-adapter-asset-expansion.json
    artifact_type: json_config
dependencies:
  parent: docs/plans/PLAN-L7-175-placeholder-threshold-g8-evidence.md
  requires:
    - docs/test-design/harness/L8-integration-test-design.md
    - src/runtime/adapter.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T11:42:24+09:00"
    tests_green_at: "2026-06-29T11:42:24+09:00"
    verdict: approve
    scope: "L8 IT-ADAPTER-01 mock provider InvokeResult normalization and G8 evidence promotion."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\runtime-adapter.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T11:42:24+09:00"
        evidence_path: tests/runtime-adapter.test.ts
        output_digest: "sha256:c660ed89dfe6fe167981c3e9bdf0e02396ed855b36b677e1898c63f9d33cc463"
---

# PLAN-L7-176: adapter InvokeResult G8 evidence closure

## Objective

Close the direct L8 evidence gap for `IT-ADAPTER-01`: provider-independent adapter intent is converted into a normalized `InvokeResult`, with mock provider success and malformed/missing output failure paths covered.

## Scope

- Keep provider execution outside this proof; no external Claude/Codex CLI is invoked.
- Add a pure `normalizeInvokeResult` boundary in `src/runtime/adapter.ts`.
- Cover mock provider success, empty-success malformed output, and provider launch error.
- Promote only `IT-ADAPTER-01` in the G8 adapter/asset manifest.

## Acceptance

- Successful mock provider output returns `ok: true`, provider metadata, command, args, exit code, and normalized output.
- Missing output after status 0 fails closed as `malformed_output`.
- Launch/spawn-style errors fail closed as `provider_error` without throwing.
- G8 manifest records `IT-ADAPTER-01` as mandatory passed.

## Residual L8 Partial Coverage

- `IT-ADAPTER-02` remains deferred for provider error-policy mapping across absent/auth/rate-limit/timeout.
- `IT-ADAPTER-03` remains deferred for D-CONTRACT DSL fixture loading and validation.
