---
plan_id: PLAN-L5-17-plan-asset-workflow-ledger-physical-data
title: "PLAN-L5-17 (add-design/physical-data): PLAN Asset v2 / Forward workflow event ledger物理設計"
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
    slot_label: "TL - immutable asset/revision/event/evidence identity"
  - role: se
    slot_label: "SE - append-only ledger、index、legacy migration"
  - role: qa
    slot_label: "QA - stale evidence、illegal sequence、rebuild identity"
generates:
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L4-23-forward-fsm-plan-asset-v2.md
  requires:
    - docs/plans/PLAN-L5-08-harness-db-feedback.md
    - docs/plans/PLAN-L5-15-feedback-lifecycle-physical-data.md
  blocks:
    - docs/plans/PLAN-L6-71-plan-asset-canonical-migration-contracts.md
    - docs/plans/PLAN-L6-72-forward-fsm-evidence-policy-contracts.md
  references:
    - docs/adr/ADR-008-forward-fsm-plan-asset-v2.md
    - docs/process/plan-asset-v2.md
---

# PLAN-L5-17: PLAN Asset v2 / workflow event ledger物理設計

## 設計範囲

- `plan_assets`、`plan_aliases`、`plan_revisions`、`workflow_transition_events`、`evidence_records`、`legacy_plan_migrations`をappend-onlyで定義する。
- `asset_id`はrename/layer変更で不変、revisionは単調増加、event/evidenceはsubject revisionとsource commit/digestへ拘束する。
- current stateはevent reductionから導出し、DB rowやfrontmatter statusを独立更新する二重真実を禁止する。
- numeric core collisionをmigration ledgerへ全件materializeし、曖昧なshort IDを自動選択しない。

## 受入条件

- revision欠番/重複、alias競合、別revision・期限切れevidence、illegal event列をL8で拒否する。
- projection全削除/rebuild後のasset/event/evidence identityとreduction結果が一致する。
- v1 adapterは情報損失をfinding化し、silent defaultでv2へ昇格しない。
