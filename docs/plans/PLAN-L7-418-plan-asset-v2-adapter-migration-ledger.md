---
plan_id: PLAN-L7-418-plan-asset-v2-adapter-migration-ledger
title: "PLAN-L7-418 (add-impl): PLAN Asset v2 canonical adapter / migration ledger"
kind: add-impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-71-plan-asset-canonical-migration-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - PlanAsset/Revision/Evidence/Reservationとv1 adapter"
  - role: qa
    slot_label: "QA - U-PA-001..007 Red→Green"
generates:
  - artifact_path: docs/plans/PLAN-L7-418-plan-asset-v2-adapter-migration-ledger.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-418-plan-asset-v2-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-71-plan-asset-canonical-migration-contracts.md
  requires: []
  references:
    - docs/plans/PLAN-REVERSE-418-plan-asset-v2-backfill.md
---

# PLAN-L7-418

U-PA-001..007をRed freezeし、immutable aggregate/VO、canonical v1 adapter、collision migration ledger、採番予約を実装する。情報損失と曖昧short IDはfail-closeする。DoDはlegacy全件変換、collision全件判断、旧revision不変、review、Reverse-418合流である。

planned deliverablesは`src/kernel`、`src/plan-asset/{domain,application,ports,adapters}`、reservation/migration schema、dry-run CLI、実行可能Red/Green testである。実体作成と同時にfrontmatter `generates`へ昇格する。
