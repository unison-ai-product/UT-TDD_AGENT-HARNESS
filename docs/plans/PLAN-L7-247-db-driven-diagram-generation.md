---
plan_id: PLAN-L7-247-db-driven-diagram-generation
title: "PLAN-L7-247 (impl): DB 依存関係からの図面自動生成 (画面遷移図 / シーケンス図 / view 別サブグラフ)"
kind: impl
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
  - role: se
    slot_label: "SE - graph export の view 拡張 (screen-flow / sequence) + diagram_artifacts 書き込み"
  - role: tl
    slot_label: "TL - 図種別ごとのデータ源選定と mermaid 方言 (stateDiagram/sequenceDiagram) レビュー"
  - role: po
    slot_label: "PO - 対象図種の優先順 (遷移図/シーケンス図/他) と中央 UI 描画接続時期"
generates:
  - artifact_path: docs/plans/PLAN-L7-247-db-driven-diagram-generation.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - src/lint/relation-graph.ts
    - src/lint/tool-adapter.ts
    - docs/design/harness/L2-screen/screen-flow.md
---

# PLAN-L7-247 (impl): DB 依存関係からの図面自動生成

## Status

draft 起票 (PO 要望 2026-07-02「遷移図・シーケンス図を DB の依存関係判定から自動生成できないか」)。

## 背景 — 素材は揃っていて生成層だけが無い

実測 (2026-07-02、harness.db):

- `screens` = 15 行 / `screen_trace` = 85 行 — **画面遷移図の素材が投影済み**
- `dependency_edges` = 1020 / `trace_edges` = 1020 / `graph_nodes` = 1172 — 依存関係の全量
- `workflow_runs` (serialize_after 順序) / `hook_events` (session 時系列) / `gate_runs` — **シーケンス図の素材**
- `diagram_artifacts` = **0 行** — 生成図の受け皿テーブルは schema 設計済み (A-124 図化 DB projection 化、tool-adapter.ts:308 が DiagramArtifactProjectionRow を定義) だが書き手未実装 (tool-adapter は lint-wiring 唯一の DEFERRED、IMP-033/PLAN-L7-50 R8)
- 既存の生成実装は relation graph の flowchart のみ (`ut-tdd graph export --format mermaid|dot`、実走 2086 行出力確認済み)

要件上は新 FR 不要: requirements §7 (A-124 addendum) が「横断 relation graph / 図化」を FR-L1-05/06/07/17-20/24/49/50 の拡張として整理済み。画面系は FR-L1-29 (L2 画面設計ワークフロー) の成果物 (遷移図) に対応。

## スコープ

1. **画面遷移図**: `screens` + `screen_trace` → mermaid `stateDiagram-v2` / flowchart。`ut-tdd graph export --view screen-flow`。
2. **シーケンス図**: 対象を指定して mermaid `sequenceDiagram` を生成 — (a) team run (workflow_runs の serialize_after 順序: se→tl→qa)、(b) session 時系列 (hook_events)、(c) gate 通過順 (gate_runs)。`--view sequence --subject <plan|session|team>`。
3. **view 別サブグラフ**: 既存 relation graph の全量出力 (1172 node は人間可読性が低い) に layer / 種別 / 起点 filter を追加 (`--view layer:L4` / `--from <node>` 到達可能部分グラフ)。
4. 生成物を `diagram_artifacts` へ記録 (path/format/source_view/updated_at) — 中央 UI (Phase B) の描画データ源として接続可能にする。deferred の tool-adapter 経路 (外部図化ツール) とは独立の内蔵生成とし、adapter 統合は将来 track。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 図種別×データ源の設計確定 (TL) + PO 優先順 | 直列 |
| 2 | screen-flow view 実装 (最小: 15 画面 85 trace) | 直列 |
| 3 | sequence view 実装 | 2 と並列 |
| 4 | subgraph filter + diagram_artifacts 記録 + test | 直列 |

## DoD

- [ ] `graph export --view screen-flow` が実 DB から遷移図 mermaid を出力 (test 固定)
- [ ] sequence view が serialize_after 順序を正しく再現 (test 固定)
- [ ] 生成実行が diagram_artifacts に記録され `db-projection-ingestion` が認識

## Appendix: view backlog — DB 素材から描ける図種カタログ (2026-07-02 実測、PO 優先順待ち)

本 PLAN のスコープ (遷移図/シーケンス図/subgraph filter) の先に、同じ生成層で追加できる view。素材件数は実 DB 計測値。

| 図種 | mermaid 方言 | DB 素材 (実測) | 価値 / 備考 |
|---|---|---|---|
| V-model トレース図 (FR→設計→実装→テスト降下鎖の V 字可視化) | flowchart | trace_edges 1025 + descent_obligations 255 + test_artifact_edges 3116 | 柱6 の目視化。要件単位の片肺 (右腕欠落) が図で見える — 監査系 (A-174) の常設化 |
| 工程ガント / ロードマップ進捗 | gantt | roadmap_gate_progress 20 + plan_registry 424 + drive_runs (started/completed) | 工程管理表 mission (中央 UI の本義) に直結 |
| ER 図 (harness.db 自身) | erDiagram | schema/harness-db-tables-*.ts (57 tables、DB でなく schema 定義から生成) | physical-data.md 手書き図の自動対、schema drift の目視化 |
| PLAN 状態遷移実績 | stateDiagram-v2 | artifact_progress_events 941 | draft→confirmed→completed の実遷移とボトルネック滞留 |
| 変更影響波及図 (起点→影響) | flowchart 部分グラフ | impact_results 82 + impact_rules | verify recommend mermaid の拡張 (既存 view の filter 強化) |
| routing 実績 sankey (signal→mode 流量) | sankey-beta | route-approval.jsonl + drive_runs.mode | **PLAN-L7-243 (mode 投影修正) 完了後**でないと mode 軸が不正確 |
| 品質チャート (被覆/合否/流量) | pie / xychart-beta | coverage 10 / feedback_events (流量は **PLAN-L7-246 完了後**) / test_results **0 行 = ingest 未実装のため pass 率系は前提整備が先** | 中央 UI ダッシュボードのデータ源 |
| gate 通過タイムライン | timeline | gate_runs 7 | freeze 履歴の時系列表示 |
