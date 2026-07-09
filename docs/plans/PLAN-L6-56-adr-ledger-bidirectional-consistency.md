---
plan_id: PLAN-L6-56-adr-ledger-bidirectional-consistency
title: "PLAN-L6-56 (add-design): ADR↔台帳 双方向整合チェック (ZIP consistency.py 残軸)"
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
    slot_label: "TL - ADR↔台帳双方向整合の契約"
generates:
  - artifact_path: docs/plans/PLAN-L6-56-adr-ledger-bidirectional-consistency.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-44-typed-spec-ledger-and-body-sync.md
  requires: []
  references:
    - docs/plans/PLAN-L7-275-glossary-code-consistency.md
    - docs/governance/vmodel-upgrade-schedule.md
---

# PLAN-L6-56: ADR↔台帳 双方向整合チェック

## 0. 背景 (ZIP 比較監査 2026-07-08 再監査、advisor 相談済み、PO 指示による代理起票)

ZIP `consistency.py` は用語ドリフト検出と ADR ファイル↔14 台帳の双方向突合の 2 軸を持つ。
用語ドリフト軸は既存 PLAN-L7-275 (コード識別子 ↔ L0 glossary 突合、draft、vmodel-upgrade
系列外の既存起票) で別途カバーされているが、**ADR↔台帳の双方向整合軸は未フィル**。

## 1. 設計スコープ

1. ADR ファイル (`docs/adr/`) に記載された決定事項が、対応する台帳
   (typed-spec ledger / schedule authoring source 等) に反映されているかを双方向で検査する。
2. 検出方向は 2 つ: (a) ADR に書かれた決定が台帳未反映、(b) 台帳の記載が対応 ADR を
   持たない。
3. PLAN-L7-275 の用語ドリフト検出と同一 doctor group に統合できるか設計時に判断する。

## 2. 受け入れ条件 (design freeze 時)

- ADR↔台帳の双方向整合判定基準の L6 contract が固定される。
- PLAN-L7-275 との統合可否 (別 gate か同一 group か) が設計判断として記録される。
