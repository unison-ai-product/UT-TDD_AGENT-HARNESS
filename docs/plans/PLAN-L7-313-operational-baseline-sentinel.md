---
plan_id: PLAN-L7-313-operational-baseline-sentinel
title: "PLAN-L7-313 (impl): 運用基線センチネル — ハーネス自身の経年観測と drift 検知の常設化"
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
    slot_label: "PO - 観測指標セットと drift 閾値の承認、v2 活性化時期"
  - role: tl
    slot_label: "TL - 指標の定義固定 (測り方が変わると基線が壊れる) のレビュー"
  - role: se
    slot_label: "SE - snapshot 記録 + drift 表示の実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-313-operational-baseline-sentinel.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/governance/audit-lens-catalog.md
    - docs/plans/PLAN-L7-251-observation-next-selector.md
    - docs/plans/PLAN-L7-307-ledger-aging-detection.md
---

# PLAN-L7-313 (impl): 運用基線センチネル

## Status

**version-up parked (v2)**。PO 指摘 (2026-07-03)「発見と観察の手段が薄い」の**観察・発見**面への対応。(採番注記: 当初 L7-312 で起票準備したが、同日 Codex が PLAN-L7-312-plan-reference-freshness-analyzer を先に landed したため 313 へ改番 — GR-3 番号衝突リスクのリアルタイム実例。)

## 背景

A-181 の実測基線 (doctor 63-87s / DB 60.9MB / draft 60 本 / digest 不一致 199→203 / actionable 0) は、**手動監査を走らせた日にしか存在しない**。次に誰かが測るまで劣化は不可視で、発見は「たまたま大きな監査をした日」に依存する。実際、digest 不一致は本監査中にも 199→203 へ増えた — 連続観測があれば増加傾向はとうに見えていた。

観測の消費側 (L7-251 next 選択) と滞留検出 (L7-307 aging) は起票済みだが、**基線の縦持ち (時系列 snapshot) を作る生産側**が無い。

## スコープ (1 要件: ハーネス自身の健康指標を時系列で記録し、drift を機械的に見えるようにする)

1. **指標セット v1** (定義を固定し、測り方をコード化):
   - doctor 全走秒数 + check 数 (PLAN-L7-300 の計時があれば per-check、無ければ全体のみ)
   - harness.db ファイルサイズ + telemetry 上位 5 テーブル行数
   - docs/plans/ の status 分布 (draft/confirmed/completed/archived)
   - green-command-digest 不一致件数
   - feedback surface の actionable / telemetry 件数
   - improvement backlog open 数
2. **snapshot 記録**: `ut-tdd baseline snapshot` が指標を測って `operational_baselines` テーブル (新設、append-only、これ自体は少量なので retention 不要) へ 1 行追加。実行契機は手動 + doctor 末尾での自動記録 (doctor は毎回走るので自然に時系列が溜まる。doctor 実行時間への追加コストは指標の再利用で最小化)。
3. **drift 表示**: `ut-tdd baseline trend` が直近 N snapshot の各指標推移 (前回比 / 30 日比) を表示。悪化傾向 (単調増加 3 回連続など単純規則) に ⚠ を付ける。**fail はしない** (発見の手段であり gate ではない)。
4. **監査カデンス advisory**: 最後の A-18x 監査レポート (.ut-tdd/audit/ の A-* 最新日付) から 90 日超で「全域監査の再実行を検討」を surface (監査レンズカタログ §9 と接続)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 指標定義の固定 (TL/PO — 定義変更は基線断絶なので新指標追加でのみ拡張、既存指標の測り方は変えない原則を明記) | 直列 |
| 2 | snapshot 記録 (テーブル + コマンド + doctor 末尾配線) | 直列 |
| 3 | trend 表示 + 監査カデンス advisory | 直列 |
| 4 | regression test (snapshot が指標を持つ / trend が推移を返す / 指標欠測時は null で欠測明示) | 直列 |

## DoD

- [ ] doctor 実行で operational_baselines に 1 行追加される (test 固定)
- [ ] `baseline trend` が直近推移と悪化 ⚠ を表示する (test 固定)
- [ ] 欠測指標が 0 でなく null として記録される (test 固定 — 欠測と 0 の混同は観測を殺す)
- [ ] A-18x 最新から 90 日超で監査 advisory が surface される (test 固定)

## 実装ノート (後続モデル向け)

- 触るファイル: `src/schema/harness-db.ts` (テーブル追加 — db-projection-coverage gate が新テーブルの投影登録を要求するため同時に登録)、`src/state-db/` (書き手)、`src/cli.ts` (baseline サブコマンド)、doctor 末尾配線。
- 指標の測り方は A-181 §1 の測定コマンドと一致させる (基線の連続性 — 監査と計器が同じ物差しで測る)。
- LENS-DR の原則を自身に適用: このテーブルが「書き手はあるが実運用で 0 行」にならないよう、doctor 配線 (毎回自動) を既定にする。手動専用にすると skill 発火 0 問題を繰り返す。
