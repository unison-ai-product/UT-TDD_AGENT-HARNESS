---
plan_id: PLAN-L7-158-refactor-detector-precision-and-policy-extraction
title: "PLAN-L7-158: refactor detector precision and policy extraction"
kind: refactor
layer: L7
drive: db
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant refactor candidate precision and policy extraction. No public CLI/API contract, persisted schema, or workflow semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - detector precision and policy extraction"
  - role: tl
    slot_label: "TL - TDD invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-158-refactor-detector-precision-and-policy-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/runtime/agent-guard.ts
    artifact_type: source_module
  - artifact_path: src/runtime/agent-guard-policy.ts
    artifact_type: source_module
  - artifact_path: src/state-db/refactor-candidates.ts
    artifact_type: source_module
  - artifact_path: src/state-db/refactor-candidate-policy.ts
    artifact_type: source_module
  - artifact_path: src/workflow/routing-contracts.ts
    artifact_type: source_module
  - artifact_path: tests/agent-guard.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-156-top-level-reference-doc-graph-node.md
  requires:
    - docs/process/modes/refactor.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T21:29:59+09:00"
    tests_green_at: "2026-06-29T21:29:59+09:00"
    verdict: approve
    scope: "Externalize repeated route/CLI literals, extract agent guard and refactor detector policy data, and narrow medium policy candidates to precise policy surfaces."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T18:23:38+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:49a3731aead9ced7f2533912c25dcd714c165b407c7cdb134f1d27ffae7208c8"
      - kind: unit_test
        command: "bun run vitest run tests\\cli.test.ts tests\\agent-guard.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T18:43:35+09:00"
        evidence_path: tests/cli.test.ts
        output_digest: "sha256:3bcbd79405736ad55cf59e08361b646b83968d04e694f4fda5f4ab91dbd70a64"
      - kind: unit_test
        command: "bun run vitest run tests\\cli.test.ts tests\\agent-guard.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T18:43:35+09:00"
        evidence_path: tests/agent-guard.test.ts
        output_digest: "sha256:61ccce881ae834d258758e47f85a4af20a731feeb73811fa5a019c55fca59443"
      - kind: unit_test
        command: "bun run vitest run tests/cli-surface.test.ts tests/distribution-acceptance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T21:29:59+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:d9528134d8ae18ee34dc2f645f971d77feae52b82f48efa05e2833c58b59b087"
      - kind: unit_test
        command: "bun run vitest run tests\\agent-guard.test.ts tests\\workflow-contracts.test.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T18:23:31+09:00"
        evidence_path: tests/agent-guard.test.ts
        output_digest: "sha256:61ccce881ae834d258758e47f85a4af20a731feeb73811fa5a019c55fca59443"
      - kind: unit_test
        command: "bun run vitest run tests\\agent-guard.test.ts tests\\workflow-contracts.test.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T18:23:31+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:2517ed3ae8331803d1ecd330ee6e6a483be111b5cb43b5701343032949725561"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T18:24:17+09:00"
        evidence_path: src/state-db/refactor-candidates.ts
        output_digest: "sha256:0e270c1572d46850fe94dd43359a38c04b75ecc7b23a62cf8bf983f74c8f601a"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T18:24:02+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:6b90985ae0fe2e0f592e7f90f0b76186473d214a945a8c825884b365e2af0aee"
---

# PLAN-L7-158: refactor detector precision and policy extraction

## Objective

Reduce currently surfaced refactor candidates while preserving behavior and
improving detector precision.

## Scope

- Externalize repeated route command and CLI option strings.
- Move agent guard allowlist/bypass policy into a dedicated policy module.
- Move refactor detector thresholds and policy terms into a dedicated policy
  module.
- Avoid policy-externalization noise when a sidecar `*-policy.ts` module already
  exists or when a broad orchestrator is better represented by `split-module`.

## Acceptance Criteria

- `externalize-literal` candidates are eliminated.
- Refactor candidate tests cover the precision changes.
- Agent guard behavior remains unchanged.
- Targeted tests, typecheck, lint, DB rebuild, and doctor pass.
