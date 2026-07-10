---
plan_id: PLAN-L6-71-plan-asset-canonical-migration-contracts
title: "PLAN-L6-71 (add-design/function-spec): PLAN Asset v2 canonical parser / migration契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: "SE - PlanAsset/Revision/Evidence/Reservation契約"
  - role: qa
    slot_label: "QA - identity/revision/evidence/migration oracle"
generates:
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L5-17-plan-asset-workflow-ledger-physical-data.md
  requires: []
  blocks:
    - docs/plans/PLAN-L7-418-plan-asset-v2-adapter-migration-ledger.md
---

# PLAN-L6-71: PLAN Asset v2 canonical parser / migration契約

- `PlanRevision.create`、`PlanAsset.create/reconstruct/revise`、`EvidenceRecord.create/isUsableFor`、`PlanIdReservation.reserve`のpre/post/invariantを固定する。
- reviseは新asset+eventを返し旧instance/evidenceを変更しない。rename/layer変更でasset IDを変えない。
- v1 adapterはcanonical DTOとmigration findingを返し、numeric core collisionや情報損失を自動選択しない。
- `U-PA-001..007`でidentity、revision連続性、stale evidence、lossless conversion、reservation競合を検証する。
