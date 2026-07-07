---
plan_id: PLAN-L7-251-observation-next-selector
title: "PLAN-L7-251 (impl): 現在観測からの進め方選択 (検出系×handover×memory の合成 next 層)"
kind: impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/handover-mechanism.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - 進め方選択肢の提示様式と「選択は人間」原則の確認"
  - role: tl
    slot_label: "TL - 観測源の合成設計 (重み/根拠提示) と memory_entries 投影境界のレビュー"
  - role: se
    slot_label: "SE - next 合成 CLI + 選択記録 + memory_entries 書き手"
generates:
  - artifact_path: docs/plans/PLAN-L7-251-observation-next-selector.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-246-feedback-event-lifecycle.md
    - src/runtime/detect.ts
    - src/feedback/surface.ts
    - .ut-tdd/audit/A-156-research-recovery-finding-route-ledger.md
    - docs/plans/PLAN-L7-243-mode-first-class-db-projection.md
    - docs/plans/PLAN-L7-249-operational-checklist-output.md
    - docs/plans/PLAN-L7-250-layer-question-catalog.md
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
---

# PLAN-L7-251 (impl): 現在観測からの進め方選択 (合成 next 層)

## Status

draft 起票 (PO 発案 2026-07-02:「検出系・ハンドオーバー・メモリの現在観測から進め方を選択できる連携系が欲しい」)。

## 背景 — 観測面は複数あるが「進め方の選択」に合成されていない

現状の実測:

- `ut-tdd status` の `next:` は **mode 別の固定文字列** (`src/runtime/detect.ts:45 nextActionForMode`) で観測非依存。
- SessionStart feedback surface / `feedback pending` / A-156 ledger 候補 / handover / advisor は**それぞれ別面**で、束ねて「いま何から進めるか」の選択肢にする層が無い。
- `memory_entries` テーブルは schema 実在だが **0 行 = 書き手未実装** (diagram_artifacts と同型の設計済み未着地)。
- 観測の質は先行 PLAN に依存: feedback open が stale だらけ (A-176 F-A) のままでは推薦が腐るため **PLAN-L7-246 を requires に置く**。mode 軸の集計は PLAN-L7-243 後に正確化。

## スコープ

1. **観測合成**: actionable feedback (lifecycle 済) + A-156 ledger 未処理候補 + outstanding (draft/defer/version-up parked) + roadmap_gate_progress + handover carry (feedback_events 系) + memory_entries を単一ビューに合成。
2. **進め方選択肢の提示**: `ut-tdd next` (名称は実装時確定) が **2-5 個の選択肢を根拠 (evidence 参照) 付き prose** で提示 — 各選択肢は接続先 (mode / PLAN / 推奨コマンド) を持つ。内部番号でなく平易な言葉 (PO 提示規約準拠)。
3. **選択の記録と接続**: 人間 (or 上位 agent) の選択を DB へ記録し、route eval / plan use へ接続。**自動実行はしない** (選択は人間、gate 通過 ≠ 安全の原則)。選択履歴が後から「なぜこの順で進めたか」の監査証跡になる。
4. **memory_entries の実体化**: 何を repo-native memory として投影するか (improvement_log / 教訓 / PO 決定録) の境界設計 + 書き手実装。agent-private memory (repo 外) は取り込まず、参照ポインタに留める (境界は TL レビュー)。
5. **status 統合**: `status` の固定 next を本機構の要約 (最上位候補 1 件) で置換。
6. 連携先: L7-249 (checklist = 運用観点の観測源) / L7-250 (elicit = 未回答質問も「進め方候補」の一種として合成可能)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 観測源インベントリと合成設計 (TL、重み・根拠様式) | 直列 |
| 2 | memory_entries 投影境界の確定 + 書き手 | 直列 |
| 3 | next 合成 CLI + 選択記録 + status 統合 | 直列 |
| 4 | regression test (観測が変わると選択肢が追従 / 自動実行しないこと) | 直列 |

## DoD

- [ ] `next` が実観測に基づく選択肢を根拠付きで提示 (固定文字列でないことを test 固定)
- [ ] 選択が記録され routing へ接続される (自動実行なしを test 固定)
- [ ] memory_entries に書き手が存在し 0 行固定でなくなる
