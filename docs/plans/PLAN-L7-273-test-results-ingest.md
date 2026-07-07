---
plan_id: PLAN-L7-273-test-results-ingest
title: "PLAN-L7-273 (add-impl): テスト実行結果の DB ingest (test_results 0 行解消、Red/Green 一次証跡)"
kind: add-impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - ingest 境界 (どの実行を一次証跡とするか) と provenance 設計レビュー"
  - role: se
    slot_label: "SE - vitest reporter/JSON 出力 → test_results projection 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-273-test-results-ingest.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires: []
  references:
    - .ut-tdd/audit/A-179-deviation-model-tdd-ddd-gap-audit-2026-07-02.md
    - docs/plans/PLAN-L7-272-red-first-activation.md
    - docs/plans/PLAN-L7-262-skill-telemetry-provenance.md
---

# PLAN-L7-273 (add-impl): テスト実行結果の DB ingest

## Status

draft 起票 (A-179 T-2、A-176 既知の継承)。正規形 = parent: PLAN-L7-44 (harness-db master、drive 一致) + Reverse pairing = PLAN-REVERSE-273。

## 背景

`test_results` テーブルは schema 実在・**0 行** (書き手未実装 — diagram_artifacts/memory_entries と同型の設計済み未着地)。Red/Green の実行結果が DB に入らないため、TDD ループの機械観測が green_commands digest (自己申告 + 事後 hash) 頼み。pass 率系の品質チャート (PLAN-L7-248) や Red-first 自動刻印 (PLAN-L7-272) の前提でもある。

## スコープ

1. **ingest 経路**: vitest の JSON reporter 出力 (or run wrapper) から test_results へ投影 (実行時刻 / 対象 / pass・fail 数 / duration / session_id)。provenance 明示 ([[feedback_verification_strategy_design_time_logging]]: projection 単独を verified と認めない — 実行由来のみを一次証跡とする)。
2. **接続**: red_at/green_at の自動刻印候補 (L7-272)、品質チャート (L7-248)、regression-expansion の実測強化。
3. CI 実行分の ingest は `gh run` 由来と local 由来を provenance で区別。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | ingest 境界 + provenance 設計 (TL) | 直列 |
| 2 | reporter → projection 実装 | 直列 |
| 3 | regression test (実行が行を生む / 非実行で増えない) | 直列 |

## DoD

- [ ] `bun run test` 実行後に test_results が実行由来の行を持つ (test 固定)
- [ ] provenance 無しの行が混入しない (test 固定)
