---
plan_id: PLAN-L7-419-forward-fsm-transition-workflow-cli
title: "PLAN-L7-419 (add-impl): Forward FSM transition engine / workflow CLI"
kind: add-impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-72-forward-fsm-evidence-policy-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - ForwardWorkflow/reducer/policy/ledger/CLI"
  - role: qa
    slot_label: "QA - U-FSM/P-FSM Red→Green"
generates:
  - artifact_path: docs/plans/PLAN-L7-419-forward-fsm-transition-workflow-cli.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-419-forward-fsm-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-72-forward-fsm-evidence-policy-contracts.md
  requires: []
  references:
    - docs/plans/PLAN-L7-418-plan-asset-v2-adapter-migration-ledger.md
    - docs/plans/PLAN-REVERSE-419-forward-fsm-backfill.md
---

# PLAN-L7-419

U-FSM-001..007/P-FSM-001をRed freezeし、append-only event/reducer/policyと`workflow status|transition|explain`を実装する。state直書き、Red/trace/review evidence回避を禁止する。DoDは全surface同一verdict、rebuild決定性、review、Reverse-419合流である。

419は418のidentity/evidence/reservation port確定後に開始する。draft中はschedule predecessorで順序を強制し、418 confirmed後に`requires`へ昇格する。planned deliverablesは`src/forward/{domain,application,ports,adapters}`、event/evidence projection、CLI registrar、実行可能Red/property testである。
