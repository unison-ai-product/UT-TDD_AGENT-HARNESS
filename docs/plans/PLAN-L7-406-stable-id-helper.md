---
plan_id: PLAN-L7-406-stable-id-helper
title: "PLAN-L7-406 (add-impl): stable ID helper consolidation"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-09
updated: 2026-07-09
owner: Codex
parent_design: docs/plans/PLAN-L7-405-spec-ir-detector-precision.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - stable ID helper 共通化"
generates:
  - artifact_path: docs/plans/PLAN-L7-406-stable-id-helper.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-406-stable-id-helper-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: src/stable-id.ts
    artifact_type: source_module
  - artifact_path: tests/stable-id.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-405-spec-ir-detector-precision.md
  requires:
    - docs/plans/PLAN-REVERSE-406-stable-id-helper-backfill.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L5-detailed-design/module-decomposition.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
  references:
    - docs/plans/PLAN-L7-405-spec-ir-detector-precision.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T17:04:00+09:00"
    tests_green_at: "2026-07-09T17:01:00+09:00"
    verdict: approve
    scope: "stableId helper 共通化、L4/L5/L6/L7 設計 back-fill、projection/feedback/skill/workflow consumer 置換、targeted tests と db rebuild の確認。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T16:58:00+09:00"
        evidence_path: src/stable-id.ts
        output_digest: "sha256:e0a3a0580965ece1cc130dadc5b98a82effa30245a6b046c0de98d2f79e31375"
        anchor_commit: 740f83f985da717310271e2e2d46ce2a5e4134a5
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T16:58:00+09:00"
        evidence_path: tests/stable-id.test.ts
        output_digest: "sha256:ddbd23941724d316a083f6463a71200f86f4932fd76ad292a7d5f8e7993158a7"
        anchor_commit: 740f83f985da717310271e2e2d46ce2a5e4134a5
      - kind: unit_test
        command: "bun run vitest run tests\\projection-writer.test.ts tests\\stable-id.test.ts tests\\spec-ir-projections.test.ts tests\\feedback-surface.test.ts tests\\skill-recommend.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T17:01:00+09:00"
        evidence_path: tests/stable-id.test.ts
        output_digest: "sha256:ddbd23941724d316a083f6463a71200f86f4932fd76ad292a7d5f8e7993158a7"
        anchor_commit: 740f83f985da717310271e2e2d46ce2a5e4134a5
      - kind: smoke
        command: "bun run src\\cli.ts db rebuild"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T16:59:00+09:00"
        evidence_path: .ut-tdd/harness.db
        output_digest: "sha256:5eed98b02aec042de344c6f10e6ad8ad14b2a82d26a7a47d9fed0f4c91abd61a"
---

# PLAN-L7-406: stable ID helper consolidation

## 背景

PLAN-L7-405 で spec-ir projection の ID 衝突は止めたが、同じ正規表現による ID 生成が
projection / feedback / skill / workflow に分散して残っていた。非ASCII見出しやパス由来 ID を
DB に引き込む V-model 改善では、検出器ごとの local regex copy は衝突再発と test mock drift の温床になる。

## 実装スコープ

1. `src/stable-id.ts` を低レベル helper として追加し、ASCII safe ID の後方互換を保つ。
2. 正規化で情報が落ちる場合だけ `sha256` 12 桁 suffix を付け、非ASCIIや区切り差の衝突を避ける。
3. `state-db` / `spec-ir` / `feedback` / `skill-engine` / `workflow` の local stable ID 実装を共通 helper へ寄せる。
4. テスト injected deps も同じ helper を使い、oracle 側の旧 regex copy を残さない。
5. L4/L5/L6/L7 設計へ helper の module boundary と function contract を back-fill する。

## DoD

- [x] `tests/stable-id.test.ts` が ASCII safe / hash suffix / empty sentinel を固定する。
- [x] spec-ir / feedback / skill / projection-writer の既存 targeted tests が green。
- [x] `module-drift` が `src/stable-id.ts` を孤児 module として報告しない。
- [x] `bun run tsc --noEmit` / `bun run lint` / `bun run src\cli.ts doctor` が green。

## 残リスク

`src/assets/catalog.ts` と `src/guardrail/ledger.ts` には独自 ID 正規化が残るが、現時点では asset key / guardrail
ledger 固有の責務であり、この PLAN は projection / feedback / skill / workflow の共通 row ID 生成に絞る。
