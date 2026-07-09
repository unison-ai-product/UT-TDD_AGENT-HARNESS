---
plan_id: PLAN-L7-223-cli-distribution-registrar-extraction
title: "PLAN-L7-223 (impl): CLI distribution registrar extraction"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-07-02
updated: 2026-07-02
owner: Codex
route_signal: code_smell
route_mode: refactor
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "Codex - CLI distribution registrar extraction"
  - role: qa
    slot_label: "Codex - distribution CLI regression fence"
generates:
  - artifact_path: docs/plans/PLAN-L7-223-cli-distribution-registrar-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/cli/distribution.ts
    artifact_type: source_module
  - artifact_path: tests/cli-distribution-registrar.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-218-setup-distribution-module-extraction.md
  requires:
    - docs/plans/PLAN-L7-157-distribution-clean-pull.md
    - docs/plans/PLAN-L7-221-github-ci-policy-gate.md
references:
  - src/cli.ts
  - src/cli/distribution.ts
  - tests/cli-distribution-registrar.test.ts
  - tests/cli-surface.test.ts
  - tests/distribution-acceptance.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T13:05:00+09:00"
    tests_green_at: "2026-07-02T13:05:00+09:00"
    verdict: approve
    scope: "Behavior-preserving CLI distribution extraction: distribution plan/sync-plan/sync-stage/sync-pack/release-plan/package command wiring moves from src/cli.ts to src/cli/distribution.ts while the root CLI only registers the command group."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T13:05:00+09:00"
        evidence_path: src/cli/distribution.ts
        output_digest: "sha256:394cf50bc881e5653fccbbba58af69954cdd227ed9fdf26395c2a415f54fb1e6"
        anchor_commit: a661410be5ffd4e9112a7dbfa0bb58138fa45e51
      - kind: unit_test
        command: "bun run vitest run tests\\cli-distribution-registrar.test.ts tests\\cli-surface.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T13:05:00+09:00"
        evidence_path: tests/cli-distribution-registrar.test.ts
        output_digest: "sha256:650cf1a038682b0fd40243bdfaa62dfdd70b7cbcbc0982dc4362354db828ecfd"
        anchor_commit: a661410be5ffd4e9112a7dbfa0bb58138fa45e51
---

# PLAN-L7-223: CLI distribution registrar extraction

## 目的

`src/cli.ts` は UT-TDD の全コマンドを束ねる入口だが、clean Pack distribution の `plan` / `sync-plan` / `sync-stage` / `sync-pack` / `release-plan` / `package` wiring まで同じ file に抱えていた。distribution は Pack repo や GitHub release という配布境界を扱うため、通常の harness runtime command と責務が異なる。

この slice では distribution command group を `src/cli/distribution.ts` へ分離し、`src/cli.ts` は `registerDistributionCommands(program)` を呼ぶだけにする。

## 変更

- `src/cli/distribution.ts` を追加し、distribution subcommand registration と CLI 専用 helper を移す。
- `collectDistributionCandidatePaths` と `copyCleanDistributionArtifact` を distribution registrar 側へ移し、Pack artifact materialization の詳細を root CLI から外す。
- Pack repo の既定値は registrar 内の `PACK_REPO` 定数に集約する。
- `src/cli.ts` から distribution 専用 import と 500 行級の command block を削除する。

## デグレ対策

- `tests/cli-distribution-registrar.test.ts` で切り出し先 registrar を直接確認し、`tests/cli-surface.test.ts` の distribution command surface も維持する。
- `bun run typecheck` で registrar の Commander 型・import 境界を確認する。
- full doctor の `lint-wiring` / `impl-plan-trace` / `regression-expansion` で新規 module が runtime path と PLAN generates に接続されることを確認する。
