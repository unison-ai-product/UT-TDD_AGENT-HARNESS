---
plan_id: PLAN-L7-425-independent-detector-meta-verifier
title: "PLAN-L7-425 (add-impl): independent detector meta-verifier / mutation receipts"
kind: add-impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-77-detector-compiler-meta-verifier-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - independent process verifier/receipt store/CLI"
  - role: qa
    slot_label: "QA - U/I/M-SP全mutation kill"
generates:
  - artifact_path: docs/plans/PLAN-L7-425-independent-detector-meta-verifier.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-425-detector-meta-verifier-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-77-detector-compiler-meta-verifier-contracts.md
  requires: []
  references:
    - docs/plans/PLAN-L7-420-vmodel-contract-compiler-registry.md
    - docs/plans/PLAN-L7-421-generic-right-arm-doctor-gate.md
    - docs/plans/PLAN-L7-424-semantic-assessment-debt-router.md
    - docs/plans/PLAN-REVERSE-425-detector-meta-verifier-backfill.md
---

# PLAN-L7-425

U/I/M-SPをRed freezeし、独立ProcessRunner/Hasher/ReceiptStore、mutation corpus runner、CLI/doctor/CI surface parityを実装する。対象detector verdictをoracleに再利用せず、receipt無しruleを未統制とする。DoDはmutation survivor 0、false-positive 0、review、Reverse-425合流である。

planned deliverablesは`src/self-proof/{domain,application,ports,adapters}`、receipt/fixture/surface/mutation正規化projection、外部process runner、CLI/doctor/CI wiring、実行可能Red/Green/mutation testである。420/421/424 confirmed後に`requires`へ昇格する。
