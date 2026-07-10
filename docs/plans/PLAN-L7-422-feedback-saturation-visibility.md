---
plan_id: PLAN-L7-422-feedback-saturation-visibility
title: "PLAN-L7-422 (troubleshoot): feedback 可視性の飽和是正 — unresolved-join 602 件の恒久不可視解消 + SessionStart digest 無言欠落の検出"
kind: troubleshoot
layer: L7
drive: db
status: draft
route_signal: incident
route_mode: incident
created: 2026-07-10
updated: 2026-07-10
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
backprop_decision: not_required
backprop_decision_reason: "既存 feedback surface (PLAN-L7-110/137/400/403) の可視性欠陥修正であり、新規 L0/L1 要件ではない。"
agent_slots:
  - role: aim
    slot_label: "AIM — unresolved-join の飽和検出 gate / bucket 設計 + digest 欠落検出設計"
  - role: se
    slot_label: "SE — 実装 + regression test"
  - role: tl
    slot_label: "TL — 既存 grouping/cap 方針 (L7-400/403) との整合レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-422-feedback-saturation-visibility.md
    artifact_type: markdown_doc
  - artifact_path: src/feedback/surface.ts
    artifact_type: source_module
  - artifact_path: tests/feedback-surface.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-400-feedback-surface-group-before-slice.md
    - docs/plans/PLAN-L7-403-feedback-surface-context-efficiency.md
    - docs/plans/PLAN-L7-144-warn-remediation-parity-and-join.md
    - docs/governance/context-efficiency-audit-2026-07-09.md
review_evidence: []
---

# PLAN-L7-422 (troubleshoot): feedback 可視性の飽和是正

## 背景 (2026-07-10 品質基盤全件監査所見)

- **F-1**: `unresolved-join` finding (severity=warn) は全件が単一 signal_type
  へ collapse し、session-start digest では 1 行 count=602 に要約される
  (`src/feedback/surface.ts` grouping + `session-start-digest.ts` slice(0,5))。
  source が消えないため lifecycle 上 closed にならず恒久 open。「DB は乖離を
  検知しているが、人にもゲートにも個別には届かない」状態が機構的に固定化。
- **F-2**: SessionStart hook は timeout 5 秒 + fail-open のため、DB rebuild
  を要する等で 5 秒を超えると引き継ぎ feedback digest が**無言で欠落**する。
  「引き継ぎ feedback は harness.db から確実に surface」という正本経路
  (PLAN-L7-110) の不変条件が遅延時に静かに破れる。

## 工程表

### Step 1: [直列] unresolved-join 602 件の性質棚卸し
- 直列理由 = **downstream_dependency** (是正戦略が棚卸し結果に依存)。
- 発生源 (stale hook_events / provider handover の plan 参照) を分類し、
  「解決可能 (参照修正)」「恒久 stale (source 側 archive が筋)」を仕分ける。

### Step 2: [並列] 飽和検出 gate
- 単一 signal_type の open 件数が閾値超過で doctor warn になる飽和検出 check
  を追加 (恒久 open の山を gate 面へ可視化)。bucket 分割 or ドリルダウン
  コマンド (`ut-tdd feedback list --signal unresolved-join` 等) の個票到達性
  を確認・整備。

### Step 3: [並列] SessionStart digest 欠落検出
- digest 生成の成否/所要時間を `.ut-tdd/logs/` へ記録し、doctor が「直近
  セッションで digest 欠落 (timeout/失敗)」を報告する check を追加。
  fail-open 設計自体は維持 (起動を block しない)。

### Step 4: [直列] 回帰確認
- 直列理由 = **verification_gate**。feedback-surface / session digest の
  regression test green + doctor exit 0。

## AC

- [ ] unresolved-join の個票へ CLI で到達できることが実走で確認済み。
- [ ] 飽和検出 check が real-repo regression test で検出動作を実証済み。
- [ ] digest 欠落 (timeout シミュレーション) が doctor で検知される。
