---
plan_id: PLAN-L7-423-engine-swap-domain-objects-ports
title: "PLAN-L7-423 (add-impl): engine-swap domain objects / ports / repositories"
kind: add-impl
layer: L7
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-75-engine-swap-domain-method-port-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - kernel/domain/application/port/adapter移行"
  - role: qa
    slot_label: "QA - U-DOMAIN/cycle/CQS/size gate"
generates:
  - artifact_path: docs/plans/PLAN-L7-423-engine-swap-domain-objects-ports.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-423-engine-swap-domain-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-75-engine-swap-domain-method-port-contracts.md
  requires: []
  references:
    - docs/plans/PLAN-L7-417-source-disposition-profile-projection.md
    - docs/plans/PLAN-L7-418-plan-asset-v2-adapter-migration-ledger.md
    - docs/plans/PLAN-L7-419-forward-fsm-transition-workflow-cli.md
    - docs/plans/PLAN-L7-420-vmodel-contract-compiler-registry.md
    - docs/plans/PLAN-L7-422-repository-document-disposition-closure-gate.md
    - docs/plans/PLAN-REVERSE-423-engine-swap-domain-backfill.md
---

# PLAN-L7-423

U-DOMAINをRed freezeし、共通kernelとmodule-boundary/cycle/CQS移行を所有する。417/418/419/420/422が所有するdomain機能を再実装しない。互換re-export、public API owner、migration waveを守り、cycle 0、function 80行/CC12/nesting3をhard gateにする。DoDは全consumer移行、review、Reverse-423合流である。
