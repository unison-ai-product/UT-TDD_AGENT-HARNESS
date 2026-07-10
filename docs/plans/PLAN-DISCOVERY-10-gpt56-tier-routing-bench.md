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
| H1 | gpt-5.6-sol | **エスカレーション先** (frontier 相談 / 最上位 review gate)。Claude 側 Fable 5 と対称の GPT 側 top 帯 | gpt-5.5 (`MODEL_IDS.codex.frontier`)。参照比較として Fable 5 / Opus | gpt-5.5 に対し **品質で明確優位** (recall・false-accept 率)。優位でなければ「エスカレーション先」の意味がないため不採用 |
| H2 | gpt-5.6-terra | **主力実装帯** — 現在 gpt-5.5 が担う仕事の置換 (worker lane の底上げ兼コスト削減) | **gpt-5.5** (PO 方針 2026-07-10: 大半の実装は 5.5 で網羅できる前提。5.5 同等品質を半額で出せるかが判断点) | 5 工程で gpt-5.5 と **品質同等** (統計的に劣後しない) **かつ** $/解決タスクが下回る |
| H3 | gpt-5.6-luna | T2 軽量並列 lane (spark/mini、closing authority なし) | gpt-5.3-codex-spark / gpt-5.4-mini | 分類一致率が現職同等以上 **かつ** latency・$/タスクが現職以下 |

PO 方針 (2026-07-10): routing の将来像は **Terra = 主力 (5.5 の仕事を半額で) / Sol =
上位エスカレーション先 (Claude 側の Fable 5 と対称的な扱い)**。したがって H2 の比較相手は
gpt-5.4 ではなく gpt-5.5 本体であり、H1 は「5.5 より上か」だけを問う (同等では不採用)。
gpt-5.4 worker lane との比較は H2 成立時の付随確認に格下げする。

## 3. 測定設計: V-model 5 工程 × 機械 oracle の replay (PO 指示 2026-07-10 改訂)

測定対象は **設計・実装・テスト・レビュー・検証の 5 工程** (V-model の仕事の種類)。
private repo の完了済み成果物を問題セットにする (学習データ汚染なし)。判定は機械 oracle
を最優先し、モデル判定が必要な箇所は **別ファミリ (Claude 側) が cross-grade** する
(自画自賛バイアス排除、hybrid 原則)。

**共有コーパス**: 過去の fix commit (親 commit = 既知バグ版 / 当該 commit = 修正版) は
W3 (red 面 oracle)・W4 (既知欠陥)・W5 (誤った完了主張) の 3 工程で使い回す。

| # | 工程 | タスク | oracle (機械優先) | 主対象ペア |
|---|---|---|---|---|
| W1 | 設計 | freeze 済み上位要求から設計 doc を再生成 | vmodel doc lint / typed-spec gate 通過 + 実 freeze 済設計 (PO 承認済) との blind cross-grade (別ファミリ採点) | Sol vs gpt-5.5 / Terra |
| W2 | 実装 | spec / freeze 済テスト設計から実装 replay (親 commit へ checkout) | freeze 済テスト green (pass@1) + typecheck / lint / doctor gate 通過率、$/解決タスク | Terra vs gpt-5.4 |
| W3 | テスト | spec + 実装からテストコードを書かせる | **red/green 二面 oracle**: 修正版で green **かつ** 既知バグ版 (fix commit の親) で red になるか (バグを殺せないテストは coverage だけの器) | Terra vs gpt-5.4 / Luna |
| W4 | レビュー | 既知欠陥入りコード/diff のレビュー | 確認済み欠陥の検出 recall + false positive 率 (ノイズを撒く review gate は現職より悪い、recall 単独で判断しない) | Sol vs gpt-5.5 |
| W5 | 検証 | 完了主張 + 証跡の受入判定 (ACCEPT/REJECT) | 既知の「後で誤りと判明した主張」(supersedes / errata、修正前状態での完了主張) を REJECT し、確認済み主張を ACCEPT できるか。**false-accept 率が主指標** (検証 lane は悲観的でなければならない) | Sol vs gpt-5.5 |

補助 lane (H3 用): `ut-tdd task classify` / skill suggest / doctor finding triage 相当の
軽量分類で確定ラベルとの一致率 + latency + コスト (Luna vs spark/mini)。

W1 の設計採点だけは完全機械化できないため、構造 gate (lint) を一次 fail-close にし、
内容は「実際に freeze を通った設計」を参照解として別ファミリが blind rubric 採点する。
採点者にはどちらがどのモデルの産出物か伏せる。

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
