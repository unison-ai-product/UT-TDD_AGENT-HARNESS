---
plan_id: PLAN-L5-16-vmodel-source-profile-physical-data
title: "PLAN-L5-16 (add-design/physical-data): Vモデル source disposition / semantic item / profile 物理設計"
kind: add-design
layer: L5
sub_doc: physical-data
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - source/item/target/profile identity と authoring/projection 境界"
  - role: se
    slot_label: "SE - table/index/rebuild/default+overlay 物理設計"
  - role: qa
    slot_label: "QA - 109/163/21/8 exactly-once と orphan 負系"
generates:
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L4-22-vmodel-source-disposition-profile-ssot.md
  requires:
    - docs/plans/PLAN-L5-13-vmodel-spec-ir-physical-data.md
  blocks:
    - docs/plans/PLAN-L6-70-source-catalog-profile-resolver-contracts.md
  references:
    - docs/governance/vmodel-source-manifest.md
    - docs/governance/vmodel-semantic-item-catalog.md
    - docs/governance/vmodel-item-target-ledger.md
    - docs/governance/vmodel-document-scale-profiles.md
---

# PLAN-L5-16: source disposition / semantic item / profile 物理設計

## 設計範囲

- authored Markdown の source 109、item 163、category 21、profile 8を安定IDで保持し、DBは再構築可能なprojectionに限定する。item→targetは`vmodel-item-target-ledger.md`の163件materialized recordだけを読み、source edgeから推論しない。
- `vmodel_sources`、`vmodel_semantic_items`、`vmodel_source_item_edges`、`vmodel_item_target_edges`、`vmodel_profiles`、`vmodel_profile_overrides`を定義する。
- disposition理由、target/PLAN、profile default+override、provenance hashをnullableにせず、unknown IDと同優先度競合をfail-closeする。
- `SpecDef`/`SpecRelation`とのjoin keyを固定し、既存projectionを第二の正本にしない。

## 受入条件

- rebuild前後で109/163/21/8、edge ID、finding IDが一致する。
- 欠番、重複、理由なしdisposition、source/item/target orphan、unknown profile、overlay競合のL8 oracleを持つ。
- detectorが欠落判断を補完せず、invalid inputを空集合へ変換しない。
