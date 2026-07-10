---
plan_id: PLAN-L11-01-engine-swap-uat-review
title: "PLAN-L11-01 (verify): engine-swap UAT / stakeholder review"
kind: verify
layer: L11
drive: fullstack
status: draft
route_signal: verification_plan
route_mode: verify
verification_gate: G11
created: 2026-07-10
updated: 2026-07-10
owner: PO / QA
parent_design: docs/process/evidence/g11-uat-review-design.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
agent_slots:
  - role: qa
    slot_label: "QA - PO scenario/UAT evidence運用"
generates:
  - artifact_path: docs/process/evidence/g11-uat-review-design.md
    artifact_type: markdown_doc
  - artifact_path: .ut-tdd/evidence/g11-uat/engine-swap.json
    artifact_type: json_config
dependencies:
  parent: docs/plans/PLAN-L4-24-declarative-vmodel-contract-right-arm.md
  references:
    - docs/plans/PLAN-L1-07-vmodel-engine-swap-requirements-delta.md
    - docs/plans/PLAN-L10-01-engine-swap-ux-validation.md
---

# G11 engine-swap UAT / stakeholder review

- case coverage: engine-swap要求、全docs判断、163 item意味適合、workflow/PLAN再利用性、運用可視性をPO scenarioで検収する。
- evidence manifest: scenario/AC、reviewer、revision、decision、open defect、approval scopeを保持する。
- exit criteria: mandatory UAT pass、未承認scope 0、open blocker 0、PO検収責任を明記する。
- defect routing: 要求誤り=L1/L3、設計誤り=Reverse、実装=L7、verification不足=L8-L10へroute。
