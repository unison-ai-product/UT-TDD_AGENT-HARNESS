---
plan_id: PLAN-L5-24-freeze-checkpoint-reopen-physical-data
title: "PLAN-L5-24 (add-design/physical-data): Freeze checkpoint・再開放物理データ"
kind: add-design
layer: L5
sub_doc: physical-data
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-16
updated: 2026-07-16
owner: PO / Codex
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: se
    slot_label: "SE - receipt/assessment/outboxのSQLite制約"
  - role: qa
    slot_label: "QA - transaction/rebuild/reconcile oracle"
generates:
  - artifact_path: docs/plans/PLAN-L5-24-freeze-checkpoint-reopen-physical-data.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L4-31-freeze-checkpoint-reopen-architecture.md
  requires: []
  blocks:
    - docs/plans/PLAN-L7-442-freeze-checkpoint-ledger-tag-projection.md
    - docs/plans/PLAN-L7-443-reopen-impact-reverification-gate.md
  references:
    - docs/plans/PLAN-L5-23-execution-ledger-github-physical-data.md
review_evidence: []
---

# PLAN-L5-24: Freeze checkpoint・再開放物理データ

## 1. 表と制約

`freeze_checkpoints`（freeze ID、gate/scope、tag/commit/tree、receipt digest、policy、parent、状態）、`freeze_checkpoint_artifacts`（freeze ID、artifact stable ID/revision/path/digest/role）、`freeze_reopen_assessments`（assessment ID、baseline、candidate commit、closure digest、reopen_from、決定）、`freeze_reopen_impacts`（assessment、affected gate/checkpoint、reason、reverify状態）をLedger DBへ追加する。tag nameとobject OIDはUNIQUE、event参照はFK、receipt/manifestはappend-only、active anchorだけをpartial UNIQUEにする。

## 2. transaction / rebuild

`FreezeRequested` appendとtag outbox enqueue、`FreezeAnchored`とbinding/reconcile、assessment appendとinvalidated projection更新を各々atomicにする。projectionはeventとartifact manifestから再構築し、rebuildがtag writeを発生させない。外部tagの観測はinbox相当のreceiptとして保存し、remote状態で正本eventを上書きしない。

## 3. L8受入条件

- [ ] crash点でeventだけ、outboxだけ、receiptだけが残らない。
- [ ] tag timeout/retry/reconcileで同一tagを重複作成せず、別OID・移動をfinding化する。
- [ ] projection全削除/rebuild前後でfreeze/reopen/invalidated集合が一致する。
- [ ] baseline以外のassessment、閉包digest改変、未再検証merge許可を拒否する。
