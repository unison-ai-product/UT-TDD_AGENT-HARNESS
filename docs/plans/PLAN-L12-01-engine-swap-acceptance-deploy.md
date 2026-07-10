---
plan_id: PLAN-L12-01-engine-swap-acceptance-deploy
title: "PLAN-L12-01 (verify): engine-swap acceptance / deploy readiness"
kind: verify
layer: L12
drive: fullstack
status: draft
route_signal: verification_plan
route_mode: verify
verification_gate: G12
created: 2026-07-10
updated: 2026-07-10
owner: PO / QA
parent_design: docs/test-design/harness/L12-acceptance-test-design.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
agent_slots:
  - role: qa
    slot_label: "QA - acceptance/deploy/rollback evidence実行"
generates:
  - artifact_path: docs/test-design/harness/L12-acceptance-test-design.md
    artifact_type: test_design
  - artifact_path: .ut-tdd/evidence/g12-acceptance/engine-swap.json
    artifact_type: json_config
dependencies:
  parent: docs/plans/PLAN-L4-24-declarative-vmodel-contract-right-arm.md
  references:
    - docs/plans/PLAN-L1-07-vmodel-engine-swap-requirements-delta.md
    - docs/plans/PLAN-L11-01-engine-swap-uat-review.md
---

# G12 engine-swap acceptance / deploy readiness

- case coverage: L1 AC、distribution/upgrade、migration/rollback、cross-platform、security/readability、evidence completeness。
- evidence manifest: AT-ID、command、artifact digest、environment、rollback result、approvalを保持する。
- exit criteria: mandatory AT pass、rollback rehearsal pass、known blocker 0、release decision記録。
- defect routing: acceptance spec=L3/L12、deployment design=Reverse、distribution implementation=L7、release incident=Incident。
