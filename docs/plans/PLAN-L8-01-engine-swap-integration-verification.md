---
plan_id: PLAN-L8-01-engine-swap-integration-verification
title: "PLAN-L8-01 (verify): engine-swap integration verification"
kind: verify
layer: L8
drive: fullstack
status: draft
route_signal: verification_plan
route_mode: verify
verification_gate: G8
created: 2026-07-10
updated: 2026-07-10
owner: PO / QA
parent_design: docs/test-design/harness/L8-integration-test-design.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
agent_slots:
  - role: qa
    slot_label: "QA - IT-VMSOURCE/PLANASSET/WORKFLOW/CONTRACT/DOCLEDGER/SELFPROOF実行"
generates:
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
  - artifact_path: .ut-tdd/evidence/g8-integration/engine-swap.json
    artifact_type: json_config
dependencies:
  parent: docs/plans/PLAN-L4-24-declarative-vmodel-contract-right-arm.md
  references:
    - docs/plans/PLAN-L1-07-vmodel-engine-swap-requirements-delta.md
    - docs/plans/PLAN-L5-16-vmodel-source-profile-physical-data.md
    - docs/plans/PLAN-L5-22-detector-self-proof-receipt-physical-data.md
---

# G8 engine-swap integration verification

- case coverage: `IT-VMSOURCE-01..02`, `IT-PLANASSET-01`, `IT-WORKFLOW-01`, `IT-VMCONTRACT-01`, `IT-DOCLEDGER-01..02`, `IT-MODULE-01`, `IT-ASSESS-01`, `IT-SELFPROOF-01`。
- evidence manifest: command、exit、IT-ID、commit/revision、digest、selected/deferred、findingを記録する。
- exit criteria: 全mandatory IT pass、defer期限内、rebuild identity差分0、blocking doctor finding 0。
- defect routing: test設計=L8、L5/L6契約=Reverse、実装=L7、構造劣化=Refactor、regression=Recovery。
