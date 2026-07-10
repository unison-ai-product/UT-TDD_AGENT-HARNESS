---
plan_id: PLAN-L5-19-repository-document-disposition-ledger
title: "PLAN-L5-19 (add-design/physical-data): repository全docs disposition ledger詳細設計"
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
    slot_label: "TL - baseline/final snapshot、disposition、delta境界"
  - role: se
    slot_label: "SE - shard schema、typed edge、生成view"
  - role: qa
    slot_label: "QA - 921件exactly-once、phantom、rename、orphan負系"
generates:
  - artifact_path: docs/governance/repository-document-disposition/manifest.yaml
    artifact_type: yaml_config
  - artifact_path: docs/governance/repository-document-disposition/entries/index.yaml
    artifact_type: yaml_config
  - artifact_path: docs/governance/repository-document-disposition-ledger.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L4-25-repository-docs-engine-swap-audit.md
  blocks:
    - docs/plans/PLAN-L6-74-repository-docs-disposition-auditor-contracts.md
  references:
    - docs/plans/PLAN-L5-16-vmodel-source-profile-physical-data.md
    - docs/plans/PLAN-L5-18-vmodel-contract-right-arm-physical-data.md
    - docs/governance/document-system-map.md
---

# PLAN-L5-19: repository全docs disposition ledger詳細設計

## 基準点と正本

監査baselineは不変に`HEAD 3d232e9c`へ固定する。tracked `docs/**` 921件、`HEAD:docs` tree OID
`310ec6de57cf8313096ea4c0fd95e1cff3db5a48`、`git ls-tree -r -z --name-only 3d232e9c -- docs` raw stream SHA-256
`02b618ce268ca68a7b6636b9aa9216d157c21da45a633b0fbab73126e0f47382`である。本baselineを再採取で上書きせず、
本commit以後の新規/更新/削除/renameはexplicit deltaへmaterializeする。

## 設計範囲

- `manifest.yaml`にschema version、baseline/final snapshot、raw NUL hash algorithm、delta一覧を持つ。
- zone別shardに全pathをmaterialized recordとしてexactly once記載し、selectorやdetector推測を正本にしない。
- recordはblob/digest、zone、disposition、reason、targets、plan IDs、impact tags、provenance、application statusを持つ。
- Markdown ledgerは生成view。DBは検索用projectionで、authoring sourceではない。

## 受入条件

- missing/duplicate/phantom/case-fold collision、理由/target/PLAN欠落、未台帳add/delete/renameを拒否する。
- final path集合をbaselineとexplicit deltaから再構築でき、pending 0かつtyped cross-reference orphan 0のみ完了とする。
-旧前提検出はcanonical assertionに限定し、archive/history/否定文/negative fixtureを誤検知しない。
