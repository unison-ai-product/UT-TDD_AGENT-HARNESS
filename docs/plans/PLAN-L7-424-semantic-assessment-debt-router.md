---
plan_id: PLAN-L7-424-semantic-assessment-debt-router
title: "PLAN-L7-424 (add-impl): semantic self-assessment evaluator / debt router"
kind: add-impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-76-semantic-assessment-debt-routing-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - assessment evaluator/review/debt route projection"
  - role: qa
    slot_label: "QA - U-ASSESSと163 item false-green"
generates:
  - artifact_path: docs/plans/PLAN-L7-424-semantic-assessment-debt-router.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-424-semantic-assessment-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-76-semantic-assessment-debt-routing-contracts.md
  requires: []
  references:
    - docs/plans/PLAN-L7-467-repository-document-disposition-closure-gate.md
    - docs/plans/PLAN-L7-423-engine-swap-domain-objects-ports.md
    - docs/plans/PLAN-REVERSE-424-semantic-assessment-backfill.md
---

# PLAN-L7-424

U-ASSESSをRed freezeし、authored evidence照合、append-only review、stale判定、routeFiling委譲、DB projectionを実装する。verified創作を禁止し、163 item pending 0、partial/gap debt route 100%をDoDとする。review後Reverse-424へ合流する。

planned deliverablesは`src/semantic-assessment/{domain,application,ports,adapters}`、assessment/evidence/review/debt route正規化projection、163件aggregate query、実行可能Red/Green testである。422/423 confirmed後に`requires`へ昇格する。
