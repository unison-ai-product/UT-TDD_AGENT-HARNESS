---
plan_id: PLAN-L7-168-verification-profile-type-split
title: "PLAN-L7-168: verification profile type split"
kind: refactor
layer: L7
drive: agent
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant split of verification profile type definitions. Verification recommendation, probe, safety, and evidence semantics remain unchanged."
agent_slots:
  - role: se
    slot_label: "SE - verification profile type split"
  - role: tl
    slot_label: "TL - verification profile invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-168-verification-profile-type-split.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/verification-profile.ts
    artifact_type: source_module
  - artifact_path: src/lint/verification-profile-types.ts
    artifact_type: source_module
  - artifact_path: src/lint/verification-profile-catalog.ts
    artifact_type: source_module
  - artifact_path: src/lint/verification-profile-safety.ts
    artifact_type: source_module
  - artifact_path: tests/verification-profile.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-167-descent-obligation-type-split.md
  requires:
    - docs/process/modes/refactor.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T21:08:15+09:00"
    tests_green_at: "2026-06-25T21:08:15+09:00"
    verdict: approve
    scope: "Extract verification-profile type definitions to a sidecar module while preserving the public re-export surface."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\verification-profile.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:07:53+09:00"
        evidence_path: tests/verification-profile.test.ts
        output_digest: "sha256:3bf8064e662b9071536985fbf4b850d478b5f7f2362e10721fd3ceeeff17324c"
      - kind: unit_test
        command: "bun run vitest run tests\\verification-profile.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:07:53+09:00"
        evidence_path: src/lint/verification-profile.ts
        output_digest: "sha256:de1e9833b9e8ba36d7fb558c4ad711420398000db24a47f9f13d8753aa33d648"
      - kind: unit_test
        command: "bun run vitest run tests\\verification-profile.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T21:07:53+09:00"
        evidence_path: src/lint/verification-profile-types.ts
        output_digest: "sha256:0078453928c4e73da41e6ec6e0386a0f2d56bea94d6b033a12c35f49e08d7602"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T21:08:03+09:00"
        evidence_path: src/lint/verification-profile-catalog.ts
        output_digest: "sha256:914fa6a5a96e7d94cf8fc4598410dfd8371efe80b18695e6b8c94497a1b4b80c"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T21:08:09+09:00"
        evidence_path: src/lint/verification-profile-safety.ts
        output_digest: "sha256:294d53ff3dbe303be1bd92315676de35ac5126040240b876fa4096e415fdc1d5"
---

# PLAN-L7-168: verification profile type split

## Objective

Reduce remaining `split-module` pressure on
`src/lint/verification-profile.ts` by extracting the shared verification
profile type model into a sidecar module.

## Scope

- Move verification profile, recommendation, gate, probe, evidence, MCP, and
  safety type definitions to `src/lint/verification-profile-types.ts`.
- Preserve the existing public API by re-exporting the moved symbols from
  `src/lint/verification-profile.ts`.
- Point catalog and safety helpers at the type sidecar to reduce internal
  coupling.

## Acceptance Criteria

- `tests/verification-profile.test.ts`, typecheck, lint, DB rebuild, and doctor
  pass.
- Public imports from `src/lint/verification-profile.ts` continue to work.
- The refactor detector no longer reports `src/lint/verification-profile.ts` as
  a `split-module` candidate.
