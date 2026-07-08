---
plan_id: PLAN-L6-50-execution-assignment-ledger
title: "PLAN-L6-50 (add-design): ID 単位実行割当台帳 (ZIP assign 相当)"
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
parent_design: docs/plans/PLAN-L6-42-typed-spec-declaration-source.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - 実行割当台帳の設計契約"
  - role: se
    slot_label: "SE - typed spec 宣言からの台帳導出設計"
generates:
  - artifact_path: docs/plans/PLAN-L6-50-execution-assignment-ledger.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-42-typed-spec-declaration-source.md
  requires:
    - docs/plans/PLAN-L7-386-typed-spec-declaration-projection.md
  references:
    - docs/governance/vmodel-typed-spec-definitions.md
    - docs/governance/vmodel-upgrade-schedule.md
---

# PLAN-L6-50: ID 単位実行割当台帳 (ZIP assign 相当)

## 0. 背景 (ZIP 比較監査 2026-07-08、PO 指示による代理起票)

修正版 ZIP (vmodel-docgen-clean) の運用サイクル②「実行割当 (`assign.py` / `docs/assign.yaml`)」に
相当する機構が U0-U12d の起票に含まれていない。左翼の typed spec 宣言 (U8) と V 字対から
**ID 単位の実行タスク台帳**を導出し、実行記録の正本にする層が抜けている。
現状の PLAN 粒度 review_evidence では ID 粒度の実行証跡を持てない。

## 1. 設計スコープ (ZIP 仕様の HARNESS 翻訳)

1. typed spec 宣言 (spec_defs projection) と V 字対から、実装タスク (対応設計 / 完了条件
   テスト / V 字対) と検証タスク (トレース元 / 検証レベル) を ID 単位で導出する。
2. **証跡必須**: done/pass/fail には検証可能アンカー (テストコマンド / PR# / パス) 最低 1 つ。
   証跡なし完了主張は fail-close (「確認しました」だけを拒否)。
3. **冪等マージ**: 既存記録温存・新 ID 追加・宣言から消えた ID は archived へ退避 (監査証跡)。
4. authoring source は tracked file、検索 surface は harness.db projection (U5/U8 と同型)。

## 2. 受け入れ条件 (design freeze 時)

- 台帳 schema (実装/検証タスク・status・evidence・archived) の L6 contract が固定される。
- doctor gate (証跡なし done、宣言外 ID、非冪等更新の検出) の gate-id が定義される。
