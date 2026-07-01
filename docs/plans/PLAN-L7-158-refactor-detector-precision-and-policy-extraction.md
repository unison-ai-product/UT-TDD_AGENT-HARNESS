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
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
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
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:76825939ad6fd3e16a3c4225beada88354d62666a8deade364be07280e0c3320"
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
        output_digest: "sha256:d63d4b93fa5ff137ea1dd3b44177af15915c7274fa4d84d2b2b2fc99c0d71f7c"
      - kind: unit_test
        command: "bun run vitest run tests/cli-surface.test.ts tests/distribution-acceptance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T22:01:00+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:c0c33af74e47d02355d431cbfa1a04b87b84d7db31bd852ae18ea4e6b4c636f2"
      - kind: unit_test
        command: "bun run vitest run tests\\agent-guard.test.ts tests\\workflow-contracts.test.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T18:23:31+09:00"
        evidence_path: tests/agent-guard.test.ts
        output_digest: "sha256:d63d4b93fa5ff137ea1dd3b44177af15915c7274fa4d84d2b2b2fc99c0d71f7c"
      - kind: unit_test
        command: "bun run vitest run tests\\agent-guard.test.ts tests\\workflow-contracts.test.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T18:23:31+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:0b0bff7c2fdea2a365d20b26d36478896d707bf891a6caa386b846a5b9375e55"
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
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:88c712454d05fc8ec4a543682eedbc235ef5f08302dd358eff73defd08a27c23"
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
