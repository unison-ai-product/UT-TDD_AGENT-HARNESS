---
plan_id: PLAN-L7-160-runtime-adapter-policy-extraction
title: "PLAN-L7-160: runtime adapter policy extraction"
kind: refactor
layer: L7
drive: agent
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant extraction of runtime adapter provider policy constants. No public CLI/API contract, persisted schema, or workflow semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - runtime adapter policy extraction"
  - role: tl
    slot_label: "TL - adapter invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-160-runtime-adapter-policy-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/adapter.ts
    artifact_type: source_module
  - artifact_path: src/runtime/adapter-policy.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/runtime-adapter.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-159-policy-sidecar-extraction-sweep.md
  requires:
    - docs/process/modes/refactor.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T19:32:10+09:00"
    tests_green_at: "2026-06-25T19:32:10+09:00"
    verdict: approve
    scope: "Extract runtime adapter provider argv/env/context policy into a sidecar module without changing adapter behavior."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\runtime-adapter.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T19:16:59+09:00"
        evidence_path: tests/runtime-adapter.test.ts
        output_digest: "sha256:ed8855117f7827e1da70ef4677cd539833169b02e858e56dc96cd922378f62d9"
      - kind: unit_test
        command: "bun run vitest run tests\\runtime-adapter.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T19:16:59+09:00"
        evidence_path: src/runtime/adapter.ts
        output_digest: "sha256:331fcf4747f9ca0f3b7b1bf9456ad50f77630c309c047bd81097e367ede41101"
      - kind: unit_test
        command: "bun run vitest run tests\\runtime-adapter.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T19:16:59+09:00"
        evidence_path: src/runtime/adapter-policy.ts
        output_digest: "sha256:9b1c0ab2c23a5efdb88f1cd2522b2c150817fb203c034cf30d4bd561f11e20a5"
      - kind: unit_test
        command: "bun run vitest run tests\\doctor.test.ts -t \"U-ADAPTER-009\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T19:30:24+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:33020f27b413367999c48d68f94939c589551ff71e0f600606c1bd0471f927b5"
      - kind: unit_test
        command: "bun run vitest run tests\\doctor.test.ts -t \"U-ADAPTER-009\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T19:30:24+09:00"
        evidence_path: src/doctor/index.ts
        output_digest: "sha256:c335922ccdb448a10ec315097268f14125723d6dceab08ea5562d87e74217128"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T19:32:10+09:00"
        evidence_path: src/runtime/adapter.ts
        output_digest: "sha256:331fcf4747f9ca0f3b7b1bf9456ad50f77630c309c047bd81097e367ede41101"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T19:32:10+09:00"
        evidence_path: tests/runtime-adapter.test.ts
        output_digest: "sha256:ed8855117f7827e1da70ef4677cd539833169b02e858e56dc96cd922378f62d9"
---

# PLAN-L7-160: runtime adapter policy extraction

## Objective

Reduce the remaining `externalize-policy` candidates by moving runtime adapter
provider policy literals into a dedicated sidecar module.

## Scope

- Extract Codex/Claude stdin argv policy, Claude effort env, and context
  injection labels to `src/runtime/adapter-policy.ts`.
- Update the Codex wrapper parity doctor gate to read the sidecar policy as the
  argv sentinel source.
- Keep `src/runtime/adapter.ts` responsible for runtime command construction.
- Add direct test coverage for the policy constants through the existing runtime
  adapter contract tests.

## Acceptance Criteria

- Runtime adapter behavior remains unchanged.
- `tests/runtime-adapter.test.ts` passes and directly imports the sidecar policy.
- Typecheck, lint, DB rebuild, and doctor pass.
