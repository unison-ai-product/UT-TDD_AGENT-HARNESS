---
plan_id: PLAN-L6-73-vmodel-contract-compiler-right-arm-contracts
title: "PLAN-L6-73 (add-design/function-spec): Vモデルcontract compiler / generic right-arm契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: "SE - contract aggregate/compiler/registry契約"
  - role: qa
    slot_label: "QA - exactly-once/drift/right-arm oracle"
generates:
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L5-18-vmodel-contract-right-arm-physical-data.md
  requires:
    - docs/plans/PLAN-L6-69-active-upgrade-frontier-right-arm-contract.md
  references:
    - docs/plans/PLAN-L6-70-source-catalog-profile-resolver-contracts.md
    - docs/plans/PLAN-L6-72-forward-fsm-evidence-policy-contracts.md
  blocks:
    - docs/plans/PLAN-L7-420-vmodel-contract-compiler-registry.md
    - docs/plans/PLAN-L7-421-generic-right-arm-doctor-gate.md
---

# PLAN-L6-73: Vモデルcontract compiler / generic right-arm契約

- `VModelContract.create(dto)`はL0-L14/G0.5-G14 exactly-once、pair/例外、evidence/exit/defect routeを一括検証する。
- `compileVModelContract(contract)`はdetector registry、doctor definitions、roadmap obligationsを同じrule identityから生成する。
- 欠落判断を推測せず、source/generated digest driftはdetector起動前にfail-closeする。
- `U-VMC-001..005`、`I-VMC-001`で重複/欠落、pair、推測補完禁止、3 surface同一identityを検証する。
