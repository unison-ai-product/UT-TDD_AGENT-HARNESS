---
plan_id: PLAN-DISCOVERY-10-gpt56-tier-routing-bench
title: "PLAN-DISCOVERY-10 (kind=poc): GPT-5.6 (Sol/Terra/Luna) レーン別 replay ベンチ — orchestration routing への組み込み判断"
kind: poc
layer: cross
workflow_phase: S1
scrum_type: hypothesis-test
drive: agent
status: draft
created: 2026-07-10
updated: 2026-07-10
owner: PM (Claude) / PO (人間)
agent_slots:
  - role: po
    slot_label: "PO — S4 routing 変更採否 (MODEL_IDS SSoT 更新 = 規範変更ゲート)"
  - role: tl
    slot_label: "TL (別 runtime) — ベンチ設計と判定基準のクロスレビュー"
  - role: se
    slot_label: "SE — S2 replay ベンチ実行 + 計測記録"
generates:
  - artifact_path: docs/plans/PLAN-DISCOVERY-10-gpt56-tier-routing-bench.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-75-cost-tiered-provider-router.md
    - docs/plans/PLAN-L7-254-judgment-gate-reviewer-tier-matrix.md
    - docs/plans/PLAN-L7-255-delegation-model-effort-injection.md
    - docs/plans/PLAN-L7-256-model-id-ssot-drift-gate.md
    - src/team/model-policy.ts
---

# PLAN-DISCOVERY-10 (kind=poc): GPT-5.6 レーン別 replay ベンチ

## 0. Objective (PO 指示 2026-07-10)

GPT-5.6 が Sol / Terra / Luna の 3 ティア構成で登場した。orchestration (tier-router /
judgment gate / 軽量並列 lane) へ組み込むため、**この harness の実レーンで現職モデルに
勝つか** を測り、routing 変更の採否を S4 で決める。

汎用ベンチスコアは routing 判断に使わない。判断はレーンごとの **現職との paired 比較**
のみで行い、明確な優位が出たティアだけ採用する (僅差なら現職維持。routing 変更自体に
コストがあるため)。

## 1. 前提 (確認済み、2026-07-10)

- Codex CLI を 0.128.0 → **0.144.1** に更新済 (npm global)。0.144.0 で GPT-5.6 ファミリ
  対応 (models.json 更新) が入っている。
- バイナリ model catalog に `gpt-5.6-sol` / `gpt-5.6-terra` / `gpt-5.6-luna` の 3 ID を確認。
- 3 モデルとも `codex exec -m <model> -s read-only` で live 疎通成功 (exit=0、応答一致)。
  本アカウントは preview アクセスあり。
- 運用上の罠 (S2 実行時に必須):
  - `codex exec` は stdin を読み続けるため、非対話実行では **stdin を閉じる**
    (`< /dev/null` 相当)。閉じないと無応答ハングする (2026-07-10 実測 20 分+)。
  - git repo 外の作業ディレクトリでは `--skip-git-repo-check` が必要。
- リスク: GPT-5.6 は limited preview 中 (GA は数週間後)。rate limit / 挙動変更の可能性が
  あるため、S2 の計測値には CLI version と実行日時を必ず添える。

## 2. 仮説表 (routing 仮説、S1 で凍結)

現職は `src/team/model-policy.ts` の `MODEL_IDS.codex` (SSoT) を基準とする。

| # | ティア | 対象レーン | 現職 (比較相手) | 採用基準 (合格ライン) |
|---|---|---|---|---|
| H1 | gpt-5.6-sol | frontier review gate / advisor 相談先 | gpt-5.5 (`MODEL_IDS.codex.frontier`) | 欠陥検出 recall が現職以上 **かつ** false positive 率が現職以下 |
| H2 | gpt-5.6-terra | T1 実装 worker lane (effort middle) | gpt-5.4 (`MODEL_IDS.codex.worker`) | pass@1 + gate 通過率が現職同等以上 **かつ** $/解決タスクが現職以下 |
| H3 | gpt-5.6-luna | T2 軽量並列 lane (spark/mini、closing authority なし) | gpt-5.3-codex-spark / gpt-5.4-mini | 分類一致率が現職同等以上 **かつ** latency・$/タスクが現職以下 |

公開情報の事前予想 (検証対象であって根拠にしない): Terra は「GPT-5.5 同等性能で約半額」
を謳うため H2 が本命。Sol は frontier 帯 ($5/$30 per 1M) で gpt-5.5 との品質差が判断点。
Luna ($1/$6) は現職 spark/mini との品質−コストのトレードオフが判断点。

## 3. 測定設計: 自リポ実績を oracle にした replay

private repo の完了済み成果物を問題セットにする (学習データ汚染なし)。判定は機械 oracle
を最優先し、モデル判定が必要な箇所は **別ファミリ (Claude 側) が cross-grade** する
(自画自賛バイアス排除、hybrid 原則)。

### Lane A — 実装 replay (H2: Terra vs gpt-5.4)

- 完了済み PLAN からテスト設計 freeze 済のもの 10–15 件を選定。親 commit に checkout し、
  spec / test design のみ渡して実装させる。
- oracle: freeze 済テスト + typecheck / lint / doctor gate。
- 指標: pass@1、gate 通過率、$/解決タスク、生成 diff サイズ。

### Lane B — レビュー欠陥検出 (H1: Sol vs gpt-5.5)

- 既知欠陥コーパス: 2026-07-09 システム全体監査の確認済みバグ、過去の errata /
  supersedes PLAN 等、**PO 確認済みラベル付き欠陥** を使う。
- 欠陥混入時点の diff をレビューさせ、検出 recall と false positive 率を測る。
- ノイズを撒く review gate は現職より悪い: recall 単独で判断しない。

### Lane C — 軽量分類 (H3: Luna vs spark/mini)

- `ut-tdd task classify` / `skill suggest` / doctor finding triage 相当のタスクで、
  確定ラベルとの一致率 + latency + コストを測る。

## 4. スケジュール

| Phase | mode | 内容 |
|---|---|---|
| S1 (本 PLAN) | serial | 仮説表・測定設計・採用基準の凍結。TL クロスレビュー |
| S2 PoC | parallel | Lane A / B / C を並列実行 (各レーン独立、レーンあたり 10–15 タスク) |
| S3 verify | serial | 計測集計、paired 比較、cross-grade 検証。claim は green_commands で裏取り |
| S4 decide | serial | decision_outcome 確定。採用ティアがあれば後継 impl PLAN (MODEL_IDS SSoT / tier roster / agent-guard family 序列の更新) を起票 |

S4 で routing 変更を採用する場合、変更本体は本 PLAN では行わず、後継の kind=impl PLAN
(PLAN-L7-256 の SSoT drift gate 配下) に routeする。agent-guard の capability family 序列
への Sol/Terra/Luna 挿入位置も、そのベンチ結果を review_evidence として決める。

## 5. S1 DoD

- [ ] 仮説表 (H1–H3) と採用基準が PO / TL レビューで凍結される。
- [ ] Lane A の replay 対象 PLAN 候補リストが確定する (freeze 済テスト設計を持つこと)。
- [ ] Lane B の既知欠陥コーパス (ラベル付き) が確定する。
- [ ] S2 実行手順 (codex exec 呼び出し形・stdin close・ログ保存先) が固定される。
