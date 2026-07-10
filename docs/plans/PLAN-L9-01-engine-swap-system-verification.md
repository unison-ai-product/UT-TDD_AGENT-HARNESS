---
plan_id: PLAN-L9-01-engine-swap-system-verification
title: "PLAN-L9-01 (verify): engine-swap system verification"
kind: verify
layer: L9
drive: fullstack
status: draft
route_signal: verification_plan
route_mode: verify
verification_gate: G9
created: 2026-07-10
updated: 2026-07-10
owner: PO / QA
parent_design: docs/test-design/harness/L9-system-test-design.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
agent_slots:
  - role: qa
    slot_label: "QA - ST-ENGINE-01..08 system verification"
generates:
  - artifact_path: docs/test-design/harness/L9-system-test-design.md
    artifact_type: test_design
  - artifact_path: .ut-tdd/evidence/g9-system/engine-swap.json
    artifact_type: json_config
dependencies:
  parent: docs/plans/PLAN-L4-24-declarative-vmodel-contract-right-arm.md
  references:
    - docs/plans/PLAN-L1-07-vmodel-engine-swap-requirements-delta.md
    - docs/plans/PLAN-L8-01-engine-swap-integration-verification.md
    - docs/plans/PLAN-L4-22-vmodel-source-disposition-profile-ssot.md
    - docs/plans/PLAN-L4-28-design-detection-self-proof.md
---

# G9 engine-swap system verification

- case coverage: `ST-ENGINE-01..08`をwhole-system CLI/DB/doctor/CI surfaceで実行する。
- evidence manifest: ST-ID、environment、command、exit、revision/digest、defect routeを保持する。
- exit criteria: G8 pass後に実行し、L4↔L9 pair、109/163/21/8、docs pending/orphan 0、semantic pending 0、mutation survivor 0。
- defect routing: system test=L9、L4契約=Reverse、L7 wiring=add-impl修正、regression=Recovery。
