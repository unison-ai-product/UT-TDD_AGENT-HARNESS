---
plan_id: PLAN-L7-417-source-disposition-profile-projection
title: "PLAN-L7-417 (add-impl): source disposition / semantic catalog / profile projection"
kind: add-impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-70-source-catalog-profile-resolver-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - catalog/profile domainとprojection実装"
  - role: qa
    slot_label: "QA - U-DISP/U-PROFILE/I-DISP Red→Green"
generates:
  - artifact_path: docs/plans/PLAN-L7-417-source-disposition-profile-projection.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-417-source-disposition-profile-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-70-source-catalog-profile-resolver-contracts.md
  requires: []
  references:
    - docs/plans/PLAN-REVERSE-417-source-disposition-profile-backfill.md
    - docs/governance/vmodel-item-target-ledger.md
---

# PLAN-L7-417

U-DISP/U-PROFILEをRed freeze後、catalog/profile domain、authoring loader、DB projectorをsmall moduleで実装する。manifest宣言件数との整合を検証し、109/163/21/8を恒久定数化しない。DoDはtargeted/full regression、rebuild identity差0、cross-agent review、Reverse-417合流である。

planned deliverablesは`src/disposition/{domain,application,ports,adapters}`、`src/profile/{domain,application,ports,adapters}`、DB schema/projection、実行可能Red/Green test、item-target ledger validationである。実体作成と同時にfrontmatter `generates`へ昇格する。
