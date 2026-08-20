---
plan_id: PLAN-REVERSE-419-forward-fsm-backfill
title: "PLAN-REVERSE-419: Forward FSM実装の設計backfill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: db
status: draft
route_signal: reverse
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-10
updated: 2026-08-20
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-419-forward-fsm-transition-workflow-cli.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - FSM/CLI実装事実をL5/L6へbackfill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-419-forward-fsm-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-419-forward-fsm-transition-workflow-cli.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-419-forward-fsm-transition-workflow-cli.md
    - docs/plans/PLAN-L6-72-forward-fsm-evidence-policy-contracts.md
    - docs/plans/PLAN-L7-418-plan-asset-v2-adapter-migration-ledger.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/344
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/342
review_evidence: []
---

# PLAN-REVERSE-419: Forward FSM実装の設計backfill

## 0. R0の目的

Forward FSMの実装差分を、既存のL6 evidence policy・reservation・migration ledgerへ必要な
設計差分だけ戻すためのReverse pairである。pair-freeze時点では実装事実を持たないため
`workflow_phase: R0`とし、R1以降へ先取りしない。

## 1. R0→R4工程

| phase | 観測・成果物 | 出口条件 |
| --- | --- | --- |
| R0 | pair-freeze、実装対象surface、既存418契約の基準を固定 | exact PLAN/候補/依存がreview済み |
| R1 | signature、storage、EvidenceRecord、reservationの差分を収集 | 実装事実と既存契約の差分表がある |
| R2 | U/P-FSM、replay、fault、typed reasonを実測 | 反例が全てfail-closeし、正例が決定的 |
| R3 | status/transition/explain/CLIの全surfaceをcross-family検収 | 同一event列のverdictとdigestが一致 |
| R4 | 必要なL6 backfillとForward routingを反映 | gap-only backfill後に親PLANへ合流 |

## 2. 境界と再利用

- exact HEAD、source revision、EvidenceRecord identityを全phaseで束縛し、current worktreeや推測を正本にしない。
- U-PA-043/U-PA-044のreservation token・3表rollback証跡を再利用し、419で新しいreservation契約を作らない。
- IMP-167など実装後に初めて判定できる不足はR1/R2で観測し、R0のpair-freezeへ混ぜない。
- `src/forward/**`、実行可能なFSM test、CLI、Pack copyはForward implementation PRの所有とし、本Reverse文書は生成しない。

## 3. Forwardへの戻り

R4でbackfill対象が無い場合も、`gap-only`と`reuse-as-is`の証跡を残す。L6を上書きせず、
後続差分は新しいsuccessor PLANへ昇格し、Forward実装のacceptanceと同じexact revisionへ束縛する。
