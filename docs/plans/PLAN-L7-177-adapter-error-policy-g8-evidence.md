---
plan_id: PLAN-L7-177-adapter-error-policy-g8-evidence
title: "PLAN-L7-177: adapter error policy G8 evidence closure"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/plans/PLAN-L7-176-adapter-invoke-result-g8-evidence.md
backprop_decision: not_required
backprop_decision_reason: "This closes the already-designed L8 IT-ADAPTER-02 provider error-policy proof. It adds provider-independent policy mapping without changing lower-layer requirements."
agent_slots:
  - role: se
    slot_label: "SE - adapter error policy evidence"
  - role: tl
    slot_label: "TL - fail-close/degradation verification"
  - role: aim
    slot_label: "AIM - G8 manifest evidence update"
generates:
  - artifact_path: docs/plans/PLAN-L7-177-adapter-error-policy-g8-evidence.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/adapter-policy.ts
    artifact_type: source_module
  - artifact_path: tests/runtime-adapter.test.ts
    artifact_type: test_code
  - artifact_path: .ut-tdd/evidence/g8-integration/20260626-it-adapter-asset-expansion.json
    artifact_type: json_config
dependencies:
  parent: docs/plans/PLAN-L7-176-adapter-invoke-result-g8-evidence.md
  requires:
    - docs/test-design/harness/L8-integration-test-design.md
    - docs/design/harness/L5-detailed-design/if-detail.md
    - src/runtime/adapter-policy.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T11:56:10+09:00"
    tests_green_at: "2026-06-29T11:56:10+09:00"
    verdict: approve
    scope: "L8 IT-ADAPTER-02 provider error-policy mapping and G8 evidence promotion."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\runtime-adapter.test.ts tests\\g8-integration-workflow.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T11:56:10+09:00"
        evidence_path: tests/runtime-adapter.test.ts
        output_digest: "sha256:c660ed89dfe6fe167981c3e9bdf0e02396ed855b36b677e1898c63f9d33cc463"
---

# PLAN-L7-177: adapter error policy G8 evidence closure

## Objective

Close the direct L8 evidence gap for `IT-ADAPTER-02`: adapter provider errors are mapped into deterministic fail-close, degradation, retry, and skip decisions before workflow execution depends on them.

## Scope

- Keep the proof provider-independent; no external Claude/Codex CLI is invoked.
- Add a pure `mapAdapterErrorPolicy` boundary in `src/runtime/adapter-policy.ts`.
- Cover absent, auth, rate-limit, timeout, and unknown error classes with deterministic action, exit code, severity, and next action.
- Promote only `IT-ADAPTER-02` in the G8 adapter/asset manifest.

## Acceptance

- Absent provider degrades with exit 0 only when degradation is allowed.
- Auth errors fail closed with provider-specific login guidance.
- Rate limits retry only while retry budget remains, then fail closed.
- Timeouts skip the affected item after bounded retry exhaustion.
- Unknown provider errors fail closed until classified.
- G8 manifest records `IT-ADAPTER-02` as mandatory passed.

## Residual L8 Partial Coverage

- `IT-ADAPTER-03` was closed by `PLAN-L7-178-d-contract-dsl-g8-evidence`.
