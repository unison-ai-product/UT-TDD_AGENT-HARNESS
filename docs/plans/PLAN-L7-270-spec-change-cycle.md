---
plan_id: PLAN-L7-270-spec-change-cycle
title: "PLAN-L7-270 (impl): 凍結後の仕様変更サイクル定義 (un-freeze→再 freeze + supersede 接続)"
kind: impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/process/modes/add-feature.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - 仕様変更サイクルの工程定義 (un-freeze 承認点) の承認"
  - role: tl
    slot_label: "TL - IMP-079/080 検出資産との接続レビュー"
  - role: se
    slot_label: "SE - mode doc 変更節 + un-freeze 手順の機械補助"
generates:
  - artifact_path: docs/plans/PLAN-L7-270-spec-change-cycle.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-179-deviation-model-tdd-ddd-gap-audit-2026-07-02.md
    - docs/process/modes/add-feature.md
    - src/lint/gate-confirm.ts
    - src/lint/review-evidence.ts
---

# PLAN-L7-270 (impl): 凍結後の仕様変更サイクル定義

## Status

draft 起票 (A-179 D-2)。process 定義主体のため kind=impl で起票し **PLAN-L7-263 debt 台帳へ登載 (着手時昇格)**。back-fill 意図は PLAN-REVERSE-270 (R0 メモ) で保持。

## 背景

`po_change` signal は add-feature へ routing されるが、add-feature mode は「差分追補」であり**既存確定挙動の変更 (un-freeze→再 freeze)** を定義していない。IMP-079 (freeze 偽装) / IMP-080 (un-freeze 後の stale approve 残骸) は、この未定義工程に対する検出側の継ぎ足しであることを A-179 で確認。

## スコープ

1. **add-feature mode doc へ「凍結後仕様変更」節**: un-freeze の承認点 (PO 必須)、変更対象の V-pair 再オープン範囲、再 freeze までの gate 再通過、supersede 規律 (plan-supersession) との接続。
2. **un-freeze の機械補助**: confirmed→draft 降格時に stale review evidence / gate 台帳との整合を自動確認 (IMP-080 拡張)、変更範囲の trace 到達列挙。
3. **signal 語彙**: `spec_change` / `behavior_change` token の追加是非 (po_change との統合か分離か) を PO 確定。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 変更サイクル定義 + PO 承認 | 直列 |
| 2 | mode doc 追記 + un-freeze 機械補助 | 直列 |
| 3 | regression test (un-freeze 残骸が検出される / 再 freeze 経路が通る) | 直列 |

## DoD

- [ ] add-feature mode doc に変更サイクル節が存在する
- [ ] un-freeze→再 freeze の実 repo 回帰が green (test 固定)
