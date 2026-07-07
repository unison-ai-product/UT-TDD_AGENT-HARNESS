---
plan_id: PLAN-L7-320-ci-failure-ingestion
title: "PLAN-L7-320 (impl): CI 失敗の還流 — gh run 結果を harness.db へ ingest し SessionStart/status で拾えるようにする"
kind: impl
layer: L7
drive: db
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期 (Codex の CLI 抽出完了後が安全)"
  - role: tl
    slot_label: "TL - ingest 境界 (どの run を拾うか) と provenance 設計レビュー"
  - role: se
    slot_label: "SE - gh run ingest + surface 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-320-ci-failure-ingestion.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires: []
  references:
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/plans/PLAN-L7-273-test-results-ingest.md
    - docs/plans/PLAN-L7-313-operational-baseline-sentinel.md
    - docs/plans/PLAN-L7-246-feedback-event-lifecycle.md
---

# PLAN-L7-320 (impl): CI 失敗の還流

## Status

**version-up parked (v2)**。PO 指示 (2026-07-03)「GitHub CI で落ちてるケースがあるから拾えるように」。既知 carry「CI は失敗を agent へ自動還流しない」(A-175 #14、PO 延期) の解除起票。

## 背景 (実測 2026-07-03)

- 当該 PR branch (`work/l10-l14-local-close`) の harness-check が **01:47Z から 7 連続 failure** していたが、どのオーケストレータにも surface されず、PO の人手指摘で発覚した (`gh run list` 実測)。
- 失敗内訳 (run 28635615975): tests/cli-surface.test.ts ×2 (delegation dry-run の JSON 空) + tests/cited-command-existence.test.ts ×1 (`codex` コマンド未登録)。ローカル追試で前者は Codex の後続 commit により回復済み、**後者は現 HEAD でも red** — CLI delegation 抽出 (L7-284〜286 系) の進行中回帰であり、担当は当該作業者 (Codex)。
- 構造問題: CI 結果は GitHub 側にのみ存在し、harness.db・SessionStart・status のどれにも流れない。「検出器は在るが読者がいない」= LENS-DE の CI 版。

## スコープ (1 要件: CI の成否がオーケストレータの定常観測に自動で入るようにする)

1. **ingest**: `ut-tdd ci pull` が `gh run list --json` から直近 N run (branch / workflow / conclusion / url / head_sha / created_at) を `ci_runs` テーブル (新設) へ投影。provenance = `gh` 由来のみ (推測値なし)。gh 未認証/オフラインは欠測として明示 (0 件と区別)。
2. **surface**: SessionStart と `ut-tdd status` に「現 branch の直近 CI: 成否 + 連続 failure 数 + 最古 failure 時刻 + url」を 1 行表示。failure 時は actionable (telemetry ではない) として feedback surface の gate bucket に載せる (L7-246 の actionable→routing 接続に相乗り)。
3. **鮮度**: pull の自動契機は SessionStart hook (失敗しても session を止めない fail-open、ただし欠測を明示)。手動 `ci pull` はいつでも可。
4. **sentinel 接続**: L7-313 の指標セットに「連続 CI failure 数」を追加 (基線 doc に追記)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | ingest 境界 (branch scope / N 件 / 欠測表現) の設計 (TL) | 直列 |
| 2 | ci_runs テーブル + `ci pull` 実装 (db-projection-coverage への登録含む) | 直列 |
| 3 | SessionStart / status surface + actionable 接続 | 直列 |
| 4 | regression test (failure が surface される / green は 1 行 / 欠測が 0 件と区別される) | 直列 |

## DoD

- [ ] `ci pull` 後、現 branch の CI failure が SessionStart 出力に actionable として現れる (test 固定 + 実走 evidence)
- [ ] gh 不通時に「欠測」表示となり、古いデータが黙って残らない (fetched_at 表示、test 固定)
- [ ] ci_runs の行が全件 gh 由来 provenance を持つ (test 固定)

## 実装ノート (後続モデル向け)

- 触るファイル: `src/schema/harness-db.ts` (ci_runs)、`src/state-db/` (書き手)、`src/cli.ts` (ci pull — **Codex の CLI 抽出完了後に着手**、それまでは登録ヘルパの新形式に従う)、`src/feedback/surface.ts`。
- `gh` は PATH 前提 (既存 memory: CI 状態は `gh run list` で直接確認、の機械化)。JSON parse は `--json conclusion,headBranch,...` の明示フィールドで固定し、gh 出力形式変化に脆くしない。
- 即効の運用代替 (本 PLAN 活性化まで): 着手プロトコルに「`gh run list --limit 5` で現 branch の CI を確認」を明記済み (戦略 doc §4.1)。
