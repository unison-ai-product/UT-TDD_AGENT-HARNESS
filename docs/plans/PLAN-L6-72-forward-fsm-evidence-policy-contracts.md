---
plan_id: PLAN-L6-72-forward-fsm-evidence-policy-contracts
title: "PLAN-L6-72 (add-design/function-spec): Forward FSM / transition / evidence policy契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: confirmed
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
review_evidence:
  - reviewer: "Codex wave419 design reviewer"
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-10T23:03:00+09:00"
    tests_green_at: "2026-07-10T23:00:20+09:00"
    verdict: approve
    worker_model: gpt-5
    reviewer_model: gpt-5
    scope: "FSM遷移、例外、typed evidence policy、CLI parity、ledger atomicity、property oracleを反復reviewしCritical 0 / Important 0。"
    green_commands:
      - kind: lint
        command: "bun run src/cli.ts plan lint && bunx vitest run tests/design-language.test.ts tests/coding-rules.test.ts --reporter=dot && bunx tsc --noEmit"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T23:00:20+09:00"
        evidence_path: docs/plans/PLAN-L6-72-forward-fsm-evidence-policy-contracts.md
        output_digest: "sha256:ef929a8ee12bc4ba8662869cf42b303fc40d82f0ed0df34332d43b8f6d367dec"
        anchor_commit: bc7b4a2cc0504f380adff576bdda80abfa29656c
---

# PLAN-L6-72: Forward FSM / transition / evidence policy契約

- `ForwardWorkflow.reconstruct/explain/transition`と`reduceForward(events)`を定義し、commandはevent、queryはverdict/stateを返す。
- proposed→archivedの正規遷移、blocked/superseded/rejected/reopenedの理由・revision・evidence policyをtableとして固定する。
- pair freeze前implement、Redなしimplement、trace freeze前review、review/test不足acceptを拒否する。
- evidence kind/cardinality/expiry/producer/subject revision/exit ruleをtyped policy表で固定し、policy不適合exit・別revision・stale evidenceを記録から消さずguardだけで拒否する。Red policyはexpected nonzero exitをusableにできる。
- empty event=`proposed`、sequence 1始まり連続、command/event冪等性、例外resume normal state、terminal stateを固定する。
- `workflow status|transition|explain`は共通JSON envelope/rule ID/verdictとexit 0/1/2/3を共有し、alias多義・future revision・transaction失敗をfail-closeする。
- property oracleはseed、0〜64 event、全state×command、10,000列、決定論的shrinkerを記録する。
- `U-FSM-001..007`と`P-FSM-001`で全正規遷移、skip、例外、reduction決定性、非許可状態到達不能を証明する。
