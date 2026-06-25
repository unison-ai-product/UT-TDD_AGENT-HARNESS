---
plan_id: PLAN-L7-167-descent-obligation-type-split
title: "PLAN-L7-167: descent obligation type split"
kind: refactor
layer: L7
drive: agent
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant split of descent-obligation type definitions and default adjacency catalog. No doctor, DB projection, or workflow semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - descent obligation type split"
  - role: tl
    slot_label: "TL - descent invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-167-descent-obligation-type-split.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/descent-obligation.ts
    artifact_type: source_module
  - artifact_path: src/lint/descent-obligation-types.ts
    artifact_type: source_module
  - artifact_path: tests/descent-obligation.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-166-setup-template-catalog-split.md
  requires:
    - docs/process/modes/refactor.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T20:57:43+09:00"
    tests_green_at: "2026-06-25T20:57:43+09:00"
    verdict: approve
    scope: "Extract descent-obligation type definitions and default adjacency catalog to a sidecar module while preserving analyzer behavior."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\descent-obligation.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T20:56:09+09:00"
        evidence_path: tests/descent-obligation.test.ts
        output_digest: "sha256:01822bfe073715aab45d69f562d86884b2aa3497585b1031cb088dbf7c9eb589"
      - kind: unit_test
        command: "bun run vitest run tests\\descent-obligation.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T20:56:09+09:00"
        evidence_path: src/lint/descent-obligation.ts
        output_digest: "sha256:9e10ed6bb1e78391761787647ee1c1a8896f59fc32aa6d7db0d253129096b4c4"
      - kind: unit_test
        command: "bun run vitest run tests\\descent-obligation.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T20:56:09+09:00"
        evidence_path: src/lint/descent-obligation-types.ts
        output_digest: "sha256:ab277901716f72cd3da7ab0f4c75777b72a8482d51abfd76495e354a9e4452a5"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T20:57:30+09:00"
        evidence_path: src/lint/descent-obligation.ts
        output_digest: "sha256:9e10ed6bb1e78391761787647ee1c1a8896f59fc32aa6d7db0d253129096b4c4"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T20:57:33+09:00"
        evidence_path: src/lint/descent-obligation-types.ts
        output_digest: "sha256:ab277901716f72cd3da7ab0f4c75777b72a8482d51abfd76495e354a9e4452a5"
---

# PLAN-L7-167: descent obligation type split

## Objective

Reduce the remaining `split-module` pressure on
`src/lint/descent-obligation.ts` by extracting the type model and default
adjacency catalog.

## Scope

- Move descent layer/type/result interfaces and `DEFAULT_DESCENT_ADJACENCY` to
  `src/lint/descent-obligation-types.ts`.
- Keep `src/lint/descent-obligation.ts` responsible for parsing, loading,
  analysis, filtering, and messages.
- Update descent tests to import type/catalog symbols from the sidecar module.

## Acceptance Criteria

- Descent-obligation analyzer behavior remains unchanged.
- `tests/descent-obligation.test.ts`, typecheck, lint, DB rebuild, and doctor
  pass.
- The refactor detector no longer reports `src/lint/descent-obligation.ts` as a
  `split-module` candidate.
