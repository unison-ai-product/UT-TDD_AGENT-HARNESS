---
plan_id: PLAN-L13-01-engine-swap-post-deploy-verification
title: "PLAN-L13-01 (verify): engine-swap post-deploy / SLI-SLO verification"
kind: verify
layer: L13
drive: fullstack
status: draft
route_signal: verification_plan
route_mode: verify
verification_gate: G13
created: 2026-07-10
updated: 2026-07-10
owner: PO / QA
parent_design: docs/process/evidence/g13-post-deploy-verification-design.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
agent_slots:
  - role: qa
    slot_label: "QA - post-deploy smoke/SLI-SLO evidence実行"
generates:
  - artifact_path: docs/process/evidence/g13-post-deploy-verification-design.md
    artifact_type: markdown_doc
  - artifact_path: .ut-tdd/evidence/g13-post-deploy/engine-swap.json
    artifact_type: json_config
dependencies:
  parent: docs/plans/PLAN-L4-24-declarative-vmodel-contract-right-arm.md
  references:
    - docs/plans/PLAN-L1-07-vmodel-engine-swap-requirements-delta.md
    - docs/plans/PLAN-L12-01-engine-swap-acceptance-deploy.md
---

# G13 engine-swap post-deploy / SLI-SLO verification

- case coverage: install/update smoke、doctor/status、DB rebuild、workflow transition、detector latency/error、rollback trigger。
- evidence manifest: environment/version、SLI/SLO、sample window、command、exit、alert/rollback decisionを保持する。
- exit criteria: production smoke pass、SLO内、critical finding 0、rollback不要または成功。
- defect routing: production defect=Incident/Recovery、threshold設計=NFR Reverse、runtime=L7、evidence不足=L13。
