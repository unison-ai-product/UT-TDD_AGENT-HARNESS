---
plan_id: PLAN-L6-72-forward-fsm-evidence-policy-contracts
title: "PLAN-L6-72 (add-design/function-spec): Forward FSM / transition / evidence policy契約"
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
    slot_label: "SE - ForwardWorkflow/reducer/policy/CLI契約"
  - role: qa
    slot_label: "QA - illegal transition/property oracle"
generates:
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L5-17-plan-asset-workflow-ledger-physical-data.md
  references:
    - docs/plans/PLAN-L6-71-plan-asset-canonical-migration-contracts.md
  blocks:
    - docs/plans/PLAN-L7-419-forward-fsm-transition-workflow-cli.md
---

# PLAN-L6-72: Forward FSM / transition / evidence policy契約

- `ForwardWorkflow.reconstruct/explain/transition`と`reduceForward(events)`を定義し、commandはevent、queryはverdict/stateを返す。
- proposed→archivedの正規遷移、blocked/superseded/rejected/reopenedの理由・revision・evidence policyをtableとして固定する。
- pair freeze前implement、Redなしimplement、trace freeze前review、review/test不足acceptを拒否する。
- `U-FSM-001..007`と`P-FSM-001`で全正規遷移、skip、例外、reduction決定性、非許可状態到達不能を証明する。
