---
plan_id: PLAN-L6-76-semantic-assessment-debt-routing-contracts
title: "PLAN-L6-76 (add-design/function-spec): semantic assessment / debt routing契約"
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
  - role: tl
    slot_label: "TL - evidence sufficiency / verdict / debt route policy"
  - role: qa
    slot_label: "QA - false-green、pending、gap route oracle"
generates:
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L5-21-semantic-assessment-debt-routing-physical-data.md
  references:
    - docs/plans/PLAN-L6-74-repository-docs-disposition-auditor-contracts.md
    - docs/plans/PLAN-L6-75-engine-swap-domain-method-port-contracts.md
  blocks:
    - docs/plans/PLAN-L7-424-semantic-assessment-debt-router.md
---

# PLAN-L6-76: semantic assessment / debt routing契約

- `evaluateSemanticItem(input, policy)`はauthored evidenceだけを照合し、verified/partial/gap/profile conditional/NA/pendingを創作しない。
- verifiedはdesign+runtime+test/evidence、partial/gapはseverity/owner/debt PLAN/next transition、conditional/NAは理由/profile/承認を要求する。
- `routeAssessmentDebt`は`routeFiling` SSoTへ委譲し、layer/kind/pairingをlocal heuristicで決めない。
- source/revision/digest変更でverifiedをstaleへ戻し、163件集計とpending 0を決定論的に返す。
