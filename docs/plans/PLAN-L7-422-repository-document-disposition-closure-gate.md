---
plan_id: PLAN-L7-422-repository-document-disposition-closure-gate
title: "PLAN-L7-422 (add-impl): repository document disposition auditor / closure gate"
kind: add-impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-23
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-74-repository-docs-disposition-auditor-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - snapshot/shard/materialize/reference closure CLI"
  - role: qa
    slot_label: "QA - U-DOCLEDGER Red→Green"
generates:
  - artifact_path: docs/plans/PLAN-L7-422-repository-document-disposition-closure-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-422-repository-document-ledger-backfill.md
    artifact_type: markdown_doc
  - artifact_path: src/document-disposition/application/capture-repository-docs-snapshot.ts
    artifact_type: source_code
  - artifact_path: src/document-disposition/domain/canonical-frame.ts
    artifact_type: source_code
  - artifact_path: src/document-disposition/domain/repository-docs-snapshot.ts
    artifact_type: source_code
  - artifact_path: src/document-disposition/ports/git-object-snapshot.ts
    artifact_type: source_code
  - artifact_path: tests/document-disposition/capture-repository-docs-snapshot.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-74-repository-docs-disposition-auditor-contracts.md
  requires: []
  references:
    - docs/plans/PLAN-L7-417-source-disposition-profile-projection.md
    - docs/plans/PLAN-L7-418-plan-asset-v2-adapter-migration-ledger.md
    - docs/plans/PLAN-REVERSE-422-repository-document-ledger-backfill.md
---

# PLAN-L7-422

U-DOCLEDGERをRed freezeし、Git object snapshot、shard materialize、validator、typed reference closure、生成reportを実装する。baseline 3d232e9c/921を不変保持し以後をdelta化する。DoDはpending/orphan/phantom 0、review、Reverse-422合流である。

planned deliverablesは`docs/governance/repository-document-disposition/**`の921件materialized ledger、`src/document-disposition/{domain,application,ports,adapters}`、正規化DB schema/projection、write/query分離CLI、実行可能Red/property/mutation testである。既存relation graphは検証済みedgeのconsumerに限定しoracleにしない。
