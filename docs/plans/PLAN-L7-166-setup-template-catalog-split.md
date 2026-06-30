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
    reviewed_at: "2026-06-25T20:49:29+09:00"
    tests_green_at: "2026-06-25T20:49:29+09:00"
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
        completed_at: "2026-06-25T20:48:29+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:b2ecea5711e42b44c51983476b5c2850b9f33f6605b2005444d07cc50e174ecb"
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T20:48:29+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:3f596607761cd1ad596b671903f7355626cf8a9eb7a1fc60af933c59d2f8c1e7"
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T20:48:29+09:00"
        evidence_path: src/setup/templates.ts
        output_digest: "sha256:f424989bfc9351de34748b6563637ec55545c061936a4c2fa81970d334094d1c"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T20:48:53+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:3f596607761cd1ad596b671903f7355626cf8a9eb7a1fc60af933c59d2f8c1e7"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T20:48:55+09:00"
        evidence_path: src/setup/templates.ts
        output_digest: "sha256:f424989bfc9351de34748b6563637ec55545c061936a4c2fa81970d334094d1c"
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
