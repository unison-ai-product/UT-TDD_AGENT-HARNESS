---
plan_id: PLAN-L7-159-policy-sidecar-extraction-sweep
title: "PLAN-L7-159: policy sidecar extraction sweep"
kind: refactor
layer: L7
drive: db
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant sidecar policy extraction for existing lint/runtime gates. No public CLI/API contract, persisted schema, or workflow semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - policy sidecar extraction"
  - role: tl
    slot_label: "TL - gate invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-159-policy-sidecar-extraction-sweep.md
    artifact_type: markdown_doc
  - artifact_path: src/gate/review-tier.ts
    artifact_type: source_module
  - artifact_path: src/gate/review-tier-policy.ts
    artifact_type: source_module
  - artifact_path: src/lint/codex-hook-adapter.ts
    artifact_type: source_module
  - artifact_path: src/lint/codex-hook-adapter-policy.ts
    artifact_type: source_module
  - artifact_path: src/lint/proposal-document-coverage.ts
    artifact_type: source_module
  - artifact_path: src/lint/proposal-document-coverage-policy.ts
    artifact_type: source_module
  - artifact_path: tests/codex-hook-adapter.test.ts
    artifact_type: test_code
  - artifact_path: tests/gate-review-tier.test.ts
    artifact_type: test_code
  - artifact_path: tests/proposal-document-coverage.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-158-refactor-detector-precision-and-policy-extraction.md
  requires:
    - docs/process/modes/refactor.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T19:05:09+09:00"
    tests_green_at: "2026-06-25T19:04:52+09:00"
    verdict: approve
    scope: "Extract sidecar policy modules for review tier, Codex hook adapter, and proposal document coverage lint."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\gate-review-tier.test.ts tests\\codex-hook-adapter.test.ts tests\\proposal-document-coverage.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T19:04:17+09:00"
        evidence_path: tests/gate-review-tier.test.ts
        output_digest: "sha256:dcf1847da140deed0001426cc67711b82306528b12b10c5f5a7a76a30ae5fc06"
      - kind: unit_test
        command: "bun run vitest run tests\\gate-review-tier.test.ts tests\\codex-hook-adapter.test.ts tests\\proposal-document-coverage.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T19:04:17+09:00"
        evidence_path: tests/codex-hook-adapter.test.ts
        output_digest: "sha256:a068692d6ad82311b908e1bef8464eebeb2a526ce144f4805070c6b60d866406"
      - kind: unit_test
        command: "bun run vitest run tests\\gate-review-tier.test.ts tests\\codex-hook-adapter.test.ts tests\\proposal-document-coverage.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T19:04:17+09:00"
        evidence_path: tests/proposal-document-coverage.test.ts
        output_digest: "sha256:b83eb982966a0e6fa019a4fd2bf59e2284cec83a168268f5c845e34243fb8fb1"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T19:04:52+09:00"
        evidence_path: src/gate/review-tier.ts
        output_digest: "sha256:12d3c3b2f7c44765b760db084030bb98939e1fa399dc89f0870f74009e37c666"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T19:04:43+09:00"
        evidence_path: src/lint/proposal-document-coverage.ts
        output_digest: "sha256:ce9e78e072731ca2f3da364e0cfb1584e887ef205f7b14c319c6a79502cba4ee"
---

# PLAN-L7-159: policy sidecar extraction sweep

## Objective

Reduce `externalize-policy` refactor candidates by extracting policy data from
small lint/runtime gate modules into sidecar policy modules.

## Scope

- Move review-tier judgment gate/checklist policy to `review-tier-policy.ts`.
- Move Codex required hook policy to `codex-hook-adapter-policy.ts`.
- Move proposal document coverage routing/evidence/gate policy to
  `proposal-document-coverage-policy.ts`.
- Preserve public re-exports where existing tests or callers depend on them.

## Acceptance Criteria

- Existing gate behavior remains unchanged.
- Targeted tests cover each sidecar policy module.
- `externalize-policy` candidate count decreases.
- Targeted tests, typecheck, lint, DB rebuild, and doctor pass.
