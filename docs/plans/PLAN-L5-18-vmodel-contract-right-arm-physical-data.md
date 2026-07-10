---
plan_id: PLAN-L5-18-vmodel-contract-right-arm-physical-data
title: "PLAN-L5-18 (add-design/physical-data): 宣言型Vモデルcontract / right-arm evidence物理設計"
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
    slot_label: "TL - layer/gate/pair/exit/defect route identity"
  - role: se
    slot_label: "SE - contract registry/evidence manifest/projection schema"
  - role: qa
    slot_label: "QA - G8-G14欠落、重複、stale evidence oracle"
generates:
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L4-24-declarative-vmodel-contract-right-arm.md
  blocks:
    - docs/plans/PLAN-L6-73-vmodel-contract-compiler-right-arm-contracts.md
  references:
    - docs/plans/PLAN-L5-16-vmodel-source-profile-physical-data.md
    - docs/plans/PLAN-L5-17-plan-asset-workflow-ledger-physical-data.md
    - docs/process/vmodel-contract.yaml
    - docs/process/design-detection-self-proof.md
---

# PLAN-L5-18: 宣言型Vモデルcontract / right-arm evidence物理設計

## 設計範囲

- L0-L14、G0.5/G1-G14、V-pair、成果物、case、evidence policy、exit criteria、defect route、approval/profileを同一revisionで保持する。
- authored YAMLを正本、compiled registryとDBを派生物とし、source hash/generated digest/revisionを結合する。
- L8-L14 evidence manifestはcase ID、producer、commit、digest、実行時刻、expiry、verdict、defect routeを必須にする。

## 受入条件

- layer/gate exactly-once、pair/例外、G8-G14 manifest欠落をL8でfail-closeする。
- design freezeとprogram acceptを別状態として保存し、draft/archived/unrelated PLANを完了証拠に数えない。
- contract再生成とDB rebuildでrule ID、digest、right-arm不足集合が一致する。
