---
plan_id: PLAN-L5-20-engine-swap-module-decomposition
title: "PLAN-L5-20 (add-design/module-decomposition): engine-swap aggregate / module / port分解"
kind: add-design
layer: L5
sub_doc: module-decomposition
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/design/harness/L5-detailed-design/module-decomposition.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - bounded context/aggregate/class採否/依存方向"
  - role: se
    slot_label: "SE - domain/application/port/adapter small module分割"
  - role: qa
    slot_label: "QA - cycle/god object/CQS/invalid state oracle"
generates:
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L4-26-engine-swap-object-method-design.md
  requires:
    - docs/plans/PLAN-L4-21-domain-vo-coding-constraints.md
  references:
    - docs/plans/PLAN-L5-16-vmodel-source-profile-physical-data.md
    - docs/plans/PLAN-L5-17-plan-asset-workflow-ledger-physical-data.md
    - docs/plans/PLAN-L5-18-vmodel-contract-right-arm-physical-data.md
  blocks:
    - docs/plans/PLAN-L6-75-engine-swap-domain-method-port-contracts.md
---

# PLAN-L5-20: engine-swap aggregate / module / port分解

## 採用境界

- 状態とlifecycleを持つ`PlanAsset`、`ForwardWorkflow`をaggregate classとする。
- `VModelContract`と`DocumentDispositionCatalog`はvalidated aggregate、`PlanRevision`/`EvidenceRecord`/各IDはimmutable VOとする。
- `ProfileOverlayResolver`はstateless domain service、self-proofはpure DTO/function+I/O portで構成し、汎用Manager classを作らない。

## moduleと依存方向

`kernel`→各`domain`→`application`→`ports`←`adapters`、CLI/doctorをcomposition rootとする。domain間はbranded ID/DTOだけで参照し、domainからfilesystem/SQLite/doctorをimportしない。現行`LintResult`逆依存、detect/adapter type cycle、巨大lint/projection moduleは移行対象として明示する。

## 受入条件

- module責務、public API、I/O端点、互換re-export、migration waveを固定し、cycle 0をL8で検証する。
- 新規function 80 nonblank lines、CC12、nesting 3を上限とし、既存超過は別debtへ送る。
- aggregate command/query分離、public method 7以下、invalid state生成不能をtest IDへ結ぶ。
