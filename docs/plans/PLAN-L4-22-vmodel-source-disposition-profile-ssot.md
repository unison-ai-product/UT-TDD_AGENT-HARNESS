---
plan_id: PLAN-L4-22-vmodel-source-disposition-profile-ssot
title: "PLAN-L4-22 (add-design): 109 source→163 item→HARNESS target disposition/profile SSoT"
kind: add-design
layer: L4
sub_doc: data
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L5
agent_slots:
  - role: tl
    slot_label: "TL - source/item/target 3集約と disposition 語彙の設計判断"
  - role: se
    slot_label: "SE - provenance/profile/default+override/projection 境界"
  - role: qa
    slot_label: "QA - exactly-once、orphan 0、silent omission 0 の負系 oracle"
generates:
  - artifact_path: docs/governance/vmodel-source-manifest.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-document-disposition-catalog.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-semantic-item-catalog.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-source-target-edges.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-semantic-item-self-assessment.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-document-catalog.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-document-scale-profiles.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/data.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires:
    - docs/plans/PLAN-L4-20-document-catalog-scale-profile-ssot.md
  blocks: []
  references:
    - docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md
    - docs/governance/vmodel-upgrade-schedule.md
---

# PLAN-L4-22: 109 source→163 item→HARNESS target disposition/profile SSoT

## 1. 問題

baseline `origin/main@71a023b2` の`vmodel-document-catalog.md`はHARNESS target slot 20件、scale profileは3定義+21判定であり、checked ZIP の
番号付き source document 109件、semantic catalog item 163件、category 21件、profile 8件を表していない。粒度を同じ
「カタログ」として扱うと、未対応を検出できず、detector が設計判断を補完する false-green が生じる。

## 2. 設計範囲

1. ZIP provenance を hash・entry count・安全性・取得時刻で固定する。
2. `ZIP-DOC-001..109` を exactly once inventory し、`adopt|merge|reference|defer|not_applicable|reject` を付与する。
3. 163 semantic itemをsource documentとHARNESS target slotへjoinし、21 categoryを分類軸として保持する。
4. 8 profile を `size` (PoC/Standard/Enterprise) と `product` (Web/Mobile/Desktop/CLI/APIService) の直交軸として定義する。
5. profile は default+override で決定論的に解決し、detector は authored decision を補完しない。
6. harness.db は authoring source を上書きしない再構築可能な read-model に限定する。

## 3. 受入条件

- ZIP provenance は SHA-256 `47b9a900ac99e093a1750f68f34c00e3bbd78c13a070d57dcdaba9ae50a274a8`、624 files、109 docs、163 items、21 categories、8 profiles と一致する。
- 001..109 の欠番・重複・未 disposition が0件である。
- 163 itemが少なくとも1 source documentまたは理由付きmeta sourceへ結び付き、source→item→targetを検索できる。
- `defer` は既存 PLAN、`not_applicable|reject|reference|merge` は理由、`adopt|merge` は target artifact または起票PLANを持つ。
- profile definition は8件 exactly、size 3件/product 5件で、unknown profile/item は fail-close する。
- DB rebuild 後に source=109、item=163、category=21、profile=8、理由なしjoin orphan=0を検証できる。
- itemの存在/target接続を実装の正しさとみなさず、163件すべてをPLAN-L4-27の意味・実装・test/evidence監査へ接続する。

## 4. 降下先

L5 physical schema、L6 parser/resolver/invariant、L7 projection/doctor、L9 system verification を後続起票する。
