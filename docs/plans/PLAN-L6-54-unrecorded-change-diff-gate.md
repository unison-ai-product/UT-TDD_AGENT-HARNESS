---
plan_id: PLAN-L6-54-unrecorded-change-diff-gate
title: "PLAN-L6-54 (add-design): 記録なき変更検出 (ZIP diff_report 相当)"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-44-typed-spec-ledger-and-body-sync.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - 記録なき変更検出の契約 (ledger sync gate との境界確認)"
  - role: se
    slot_label: "SE - 意味単位 diff の投影設計"
generates:
  - artifact_path: docs/plans/PLAN-L6-54-unrecorded-change-diff-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-44-typed-spec-ledger-and-body-sync.md
  requires:
    - docs/plans/PLAN-L7-388-typed-spec-ledger-body-sync-gate.md
  references:
    - docs/governance/vmodel-upgrade-schedule.md
    - docs/plans/PLAN-L6-52-signals-schedule-live-handover.md
---

# PLAN-L6-54: 記録なき変更検出 (ZIP diff_report 相当)

## 0. 背景 (ZIP 比較監査 2026-07-08 再監査、advisor 相談済み、PO 指示による代理起票)

`ut-tdd advisor` (claude-fable-5) に相談し、6 件の追加 gap のうち本件を最優先と判定。
既存 `relation-graph.ts` / `change-impact.ts` は影響クエリのみで、「実体は変わったのに
台帳/PLAN へ未反映」を fail-close で検出する機構を持たないことを src grep で確認済み
(不在確認: `unrecorded change` / `semantic diff` 相当のマッチなし)。
typed-spec ledger/body-sync gate (L6-44/L7-388) は既存宣言との整合検証であり、
**変更差分そのものの検出**とは目的が異なる — 台帳が正しく更新されている前提で走る
gate であって、更新漏れそのものを検出する層ではない。この違いを本 PLAN で埋める。

## 1. 設計スコープ (ZIP 仕様の HARNESS 翻訳)

1. 意味単位 (ID の追加/削除・改版履歴) での差分を、旧 snapshot (git rev もしくは
   前回投影) と現在の docs/spec_defs projection の間で機械算出する。
2. 差分が検出されたのに history / PLAN / typed-spec ledger のいずれにも記録がない場合、
   fail-close (「記録なき変更」finding) とする。
3. ledger/body-sync gate (L6-44) とは独立 gate とし、二重検出にならないよう検出対象
   (宣言整合 vs 変更差分そのもの) を明確に分離する。

## 2. 受け入れ条件 (design freeze 時)

- 意味単位 diff の schema と「記録なき変更」判定基準の L6 contract が固定される。
- L6-44 ledger/body-sync gate との検出範囲の非重複が設計レベルで説明される。
