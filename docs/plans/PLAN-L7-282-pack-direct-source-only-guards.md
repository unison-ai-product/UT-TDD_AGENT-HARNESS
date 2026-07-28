---
plan_id: PLAN-L7-282-pack-direct-source-only-guards
title: "PLAN-L7-282 (refactor): Pack direct source-only test guards"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "Pack の正規 gate は test:pack と setup-smoke だが、開発中の直接 vitest 実行でも source-only docs 欠落を製品不具合として誤検知しないようにする小変更。projection や governance の仕様は変えない。"
created: 2026-07-02
updated: 2026-07-02
owner: Codex
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - Pack direct source-only test guards"
generates:
  - artifact_path: docs/plans/PLAN-L7-282-pack-direct-source-only-guards.md
    artifact_type: markdown_doc
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\plan-lint.test.ts"
        output_digest: "sha256:c284d26852c5962216b5e3f8b8238f7f6485bb9e4a49c3fccefe9f79a1afbbf0"
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\projection-writer.test.ts"
        output_digest: "sha256:90eda6ff5dfe5944db150759c31650e03a8d75f439ae287a21f508f6ca860b22"
dependencies:
  parent: docs/plans/PLAN-L7-267-pack-ci-test-boundary.md
  requires: []
  references:
    - tests/plan-lint.test.ts
    - tests/projection-writer.test.ts
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T22:06:00+09:00"
    tests_green_at: "2026-07-02T22:05:00+09:00"
    verdict: approve
    scope: "Pack direct vitest で source-only 正本 docs 前提の実リポ依存ケースだけを guard し、fixture/unit ケースは維持する。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: lint
        command: "bunx biome check --write tests\\plan-lint.test.ts tests\\projection-writer.test.ts docs\\plans\\PLAN-L7-282-pack-direct-source-only-guards.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T22:05:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:90eda6ff5dfe5944db150759c31650e03a8d75f439ae287a21f508f6ca860b22"
        anchor_commit: e3551583a1231cda3768320f54c274e16f31b197
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-02T22:05:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:90eda6ff5dfe5944db150759c31650e03a8d75f439ae287a21f508f6ca860b22"
        anchor_commit: e3551583a1231cda3768320f54c274e16f31b197
      - kind: unit_test
        command: "bun run vitest run tests\\plan-lint.test.ts tests\\projection-writer.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T22:05:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:f0ffe1459d81c6fa0bdc11aa6510e3858856c084899db702bafbef97b9a187a3"
        anchor_commit: 487ccd318a7e27f56ea35764d6204f35300d91d4
---

# PLAN-L7-282: Pack direct source-only test guards

## 背景

Pack の正式な検証境界は `test:pack` と `doctor --setup-smoke` であり、clean Pack には source 開発リポ専用の `docs/plans`、画面設計 doc、route_mode_kind debt ledger が含まれない。

ただし開発中に Pack checkout で関連 raw `vitest` を直接実行すると、source-only docs を実リポから読むケースが失敗し、Pack 配布物の不具合と誤認しやすい。

## 変更

- `tests/plan-lint.test.ts` の debt ledger 同期テストは ledger doc が存在する source repo でのみ実行する。
- `tests/projection-writer.test.ts` の実 source docs 投影ケースは、必要な `docs/plans` または画面設計 doc が存在する場合だけ実行する。
- Pack-safe fixture や通常 unit ケースは維持し、Pack の正規 gate は変更しない。

## 検証

- `bunx biome check --write tests\\plan-lint.test.ts tests\\projection-writer.test.ts`
- `bun run vitest run tests\\plan-lint.test.ts tests\\projection-writer.test.ts --reporter=dot`
- Pack checkout で関連 direct vitest run
- Pack checkout で `bun run test:pack`

## DoD

- [x] source repo では source-only 実リポ依存テストが従来どおり実行される。
- [x] clean Pack では source-only docs 欠落が direct vitest の失敗にならない。
- [x] Pack の正式検証境界を広げず、fixture/unit テストは維持される。
