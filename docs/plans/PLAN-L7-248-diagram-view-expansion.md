---
plan_id: PLAN-L7-248-diagram-view-expansion
title: "PLAN-L7-248 (impl): 図面 view 拡張 8 種 — 将来版アップデート track"
kind: impl
layer: L7
drive: db
status: draft
version_target: future
route_signal: version_deferral
route_mode: version-up
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - 将来版活性化の時期と view 優先順"
  - role: se
    slot_label: "SE - PLAN-L7-247 生成層の view 追加実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-248-diagram-view-expansion.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-247-db-driven-diagram-generation.md
    - docs/plans/PLAN-L7-243-mode-first-class-db-projection.md
    - docs/plans/PLAN-L7-246-feedback-event-lifecycle.md
---

# PLAN-L7-248 (impl): 図面 view 拡張 8 種 — 将来版アップデート track

## Status

**version-up parked** (PO 指示 2026-07-02「アップデートで起票」)。`status: draft` + `version_target: future` で将来版へ明示保全。基盤 (生成層 + screen-flow/sequence) は PLAN-L7-247 が先行し、本 PLAN は活性化時に L7-247 の view 追加として実装する。

## スコープ (L7-247 Appendix カタログの本体、実測素材つき)

| view | mermaid | DB 素材 (2026-07-02 実測) | 前提 |
|---|---|---|---|
| V-model トレース図 | flowchart (V 字) | trace_edges 1025 + descent_obligations 255 + test_artifact_edges 3116 | なし (最優先候補) |
| 工程ガント / ロードマップ進捗 | gantt | roadmap_gate_progress 20 + plan_registry 424 + drive_runs | なし |
| ER 図 (harness.db) | erDiagram | schema 定義 57 tables (schema から生成) | なし |
| PLAN 状態遷移実績 | stateDiagram-v2 | artifact_progress_events 941 | なし |
| 変更影響波及図 | flowchart 部分グラフ | impact_results 82 | なし |
| routing sankey | sankey-beta | route-approval.jsonl + drive_runs.mode | **PLAN-L7-243** (mode 投影修正) |
| 品質チャート | pie / xychart-beta | coverage 10 / feedback 流量 / test_results (0 行) | **PLAN-L7-246** + test_results ingest |
| gate タイムライン | timeline | gate_runs 7 | なし |

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | PO 活性化判断 + view 優先順確定 (version_target 除去 → add-feature 合流) | 直列 |
| 2 | 前提なし 5 view の実装 | 並列可 |
| 3 | 前提つき 3 view (L7-243/246/ingest 完了後) | 直列 |

## DoD

- [ ] 活性化時: 採択 view が diagram_artifacts に記録され中央 UI から参照可能
- [ ] 前提 PLAN 未完了の view を活性化スコープに含めない (依存順守)
