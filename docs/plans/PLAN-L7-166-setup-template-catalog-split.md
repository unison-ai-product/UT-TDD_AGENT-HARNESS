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
        output_digest: "sha256:91f2a2d6bd146b908ca47168a8102ca955f709e0c2d9df911336d818975998c5"
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T20:48:29+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:517832835f03fa606ae79b8709c6d4bd0e229b4461303aa6616cad8d92b87a2c"
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T20:48:29+09:00"
        evidence_path: src/setup/templates.ts
        output_digest: "sha256:c35a930f77a3eb1e256776c1119c2031c6024fb312bb1847e0bcf6a26fc4d5fb"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T20:48:53+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:517832835f03fa606ae79b8709c6d4bd0e229b4461303aa6616cad8d92b87a2c"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T20:48:55+09:00"
        evidence_path: src/setup/templates.ts
        output_digest: "sha256:c35a930f77a3eb1e256776c1119c2031c6024fb312bb1847e0bcf6a26fc4d5fb"
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
