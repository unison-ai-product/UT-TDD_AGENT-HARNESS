---
plan_id: PLAN-L7-166-setup-template-catalog-split
title: "PLAN-L7-166: setup template catalog split"
kind: refactor
layer: L7
drive: agent
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant split of setup built-in GitHub templates and generated file catalog. No setup workflow, CLI/API, GitHub operation, or persisted schema changed."
agent_slots:
  - role: se
    slot_label: "SE - setup template catalog split"
  - role: tl
    slot_label: "TL - setup invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-166-setup-template-catalog-split.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/index.ts
    artifact_type: source_module
  - artifact_path: src/setup/templates.ts
    artifact_type: source_module
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-164-agent-slots-roster-split.md
  requires:
    - docs/process/modes/refactor.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "Extract setup built-in templates and common file catalog to a sidecar module while preserving setup behavior."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:e03138134a1de98563afa34fc86f4ac9277212c7c3d079a2b0bb376984e2fbfe"
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:030151e36c3335657631865015465b686360a5c079baf3203b1b51432d592e2c"
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/setup/templates.ts
        output_digest: "sha256:be6c00ee9b0794f02d95717d3bbebe4f869fb1c5c457417cd566cc462aa57e28"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:030151e36c3335657631865015465b686360a5c079baf3203b1b51432d592e2c"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/setup/templates.ts
        output_digest: "sha256:be6c00ee9b0794f02d95717d3bbebe4f869fb1c5c457417cd566cc462aa57e28"
---

# PLAN-L7-166: setup template catalog split

## Objective

Reduce the remaining `split-module` pressure on `src/setup/index.ts` by moving
the built-in GitHub setup templates and common generated-file catalog out of the
runtime orchestration module.

## Scope

- Move `TemplateSet`, `BUILTIN_GITHUB_TEMPLATES`, and `COMMON_FILES` to
  `src/setup/templates.ts`.
- Keep `src/setup/index.ts` responsible for detection, planning, emission,
  state recording, branch-protection application, and node deps.
- Update setup tests to import the template type from the sidecar module.

## Acceptance Criteria

- Setup behavior remains unchanged.
- `tests/setup.test.ts`, typecheck, lint, DB rebuild, and doctor pass.
- The refactor detector no longer reports `src/setup/index.ts` as a
  `split-module` candidate.
