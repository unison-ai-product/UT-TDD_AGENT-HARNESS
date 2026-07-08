---
plan_id: PLAN-L6-51-substance-fill-gate
title: "PLAN-L6-51 (add-design): 中身充足 fill gate (ZIP coverage --strict 相当)"
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
parent_design: docs/plans/PLAN-L6-46-typed-spec-phase-layer-alignment.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - fill gate 契約 (coverage != substance の機構化)"
  - role: qa
    slot_label: "QA - false positive 許容度と粒度乖離情報表示の検証設計"
generates:
  - artifact_path: docs/plans/PLAN-L6-51-substance-fill-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-46-typed-spec-phase-layer-alignment.md
  requires:
    - docs/plans/PLAN-L7-390-typed-spec-phase-layer-alignment-gate.md
  references:
    - docs/governance/vmodel-upgrade-schedule.md
---

# PLAN-L6-51: 中身充足 fill gate (ZIP coverage --strict 相当)

## 0. 背景 (ZIP 比較監査 2026-07-08、PO 指示による代理起票)

ZIP の `coverage --strict` (fill gate) 相当が未起票。done 宣言なのに記入率が低い・裸の
TBD/TODO・プレースホルダ残を fail-close する層で、「coverage ≠ substance」教訓
(2026-06-08) の機構化そのもの。現状 artifact_progress_yellow が 979 件 open のまま
telemetry に滞留しており、done 主張と中身の突合が機械化されていない。

## 1. 設計スコープ

1. done/confirmed 宣言 artifact に対し、記入率 (表セル充足)・裸 TBD/TODO・プレース
   ホルダ残を検出して doctor gate で fail-close する。
2. 粒度乖離 (詳細宣言なのに薄い / 簡易宣言なのに厚い) は**情報表示に留め赤にしない**
   (ZIP と同じ扱い、false positive を gate に入れない)。
3. 既存 readability gate (mojibake fail-close)・artifact progress read model と統合し、
   多重検出を避ける。

## 2. 受け入れ条件 (design freeze 時)

- fill gate の判定基準 (閾値・対象 block 種別・除外規約) が L6 contract として固定される。
- real-repo regression: 既知の done 済み文書群で false positive 0 を test で substantiate する
  (prose 断言禁止、PLAN-L7-89 claim discipline)。
