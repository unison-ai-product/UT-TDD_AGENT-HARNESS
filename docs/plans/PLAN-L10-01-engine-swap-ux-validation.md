---
plan_id: PLAN-L10-01-engine-swap-ux-validation
title: "PLAN-L10-01 (verify): engine-swap CLI/feedback UX validation"
kind: verify
layer: L10
drive: fe
status: draft
route_signal: verification_plan
route_mode: verify
verification_gate: G10
created: 2026-07-10
updated: 2026-07-10
owner: PO / QA
parent_design: docs/test-design/harness/L10-ux-validation-test-design.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
agent_slots:
  - role: qa
    slot_label: "QA - engine-swap CLI/feedback UXV実行"
generates:
  - artifact_path: docs/test-design/harness/L10-ux-validation-test-design.md
    artifact_type: test_design
  - artifact_path: .ut-tdd/evidence/g10-ux/engine-swap.json
    artifact_type: json_config
dependencies:
  parent: docs/plans/PLAN-L4-24-declarative-vmodel-contract-right-arm.md
  references:
    - docs/plans/PLAN-L1-07-vmodel-engine-swap-requirements-delta.md
    - docs/plans/PLAN-L9-01-engine-swap-system-verification.md
    - docs/plans/PLAN-L6-72-forward-fsm-evidence-policy-contracts.md
---

# G10 engine-swap UX validation

- case coverage: workflow status/transition/explain、plan migrate/validate/revise、docs audit、self-proof結果の理解性・修正可能性。
- evidence manifest: task、persona、fixture、成功率、誤操作、所要時間、CLI output digestを保持する。
- exit criteria: G9 pass後に実行し、blocked理由と次actionが一意、silent pass/hidden frontier 0、critical task成功率閾値達成。
- defect routing: UX文言/IA=L10、CLI契約=L4/L6 Reverse、runtime=L7、accessibility/security=該当設計へroute。
