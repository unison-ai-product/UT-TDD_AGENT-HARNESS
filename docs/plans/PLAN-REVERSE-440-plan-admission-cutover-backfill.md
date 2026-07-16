---
plan_id: PLAN-REVERSE-440-plan-admission-cutover-backfill
title: "PLAN-REVERSE-440: PLAN Admission保護main epoch cutoverの設計backfill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: agent
status: draft
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-with-hardening
created: 2026-07-16
updated: 2026-07-16
owner: PO / Codex / Claude
parent_design: docs/plans/PLAN-L7-440-plan-admission-cutover.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - C0保護境界とgenesis transitionの実装差分観測"
  - role: qa
    slot_label: "QA - commit edge・merge parent・protection drift oracle"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-440-plan-admission-cutover-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-440-plan-admission-cutover.md
  requires: []
  references:
    - docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
    - docs/plans/PLAN-L7-435-drive-plan-admission-impl.md
    - docs/plans/PLAN-L7-441-plan-draft-recovery-v4.md
  blocks: []
---

# PLAN-REVERSE-440: PLAN Admission保護main epoch cutoverの設計backfill

## R0観測境界

`PLAN-L7-440` の予定成果を完成事実として扱わず、保護mainの live snapshot、C0/base/tree
identity、inventory/activation/receipt/projection の原子境界、全commit edge・全merge parent検査を
観測対象として予約する。

## gap-only backfill規則

R1でL6-86契約と実装のprotection取得、artifact副作用境界、legacy ceiling、pre-push/CI parityを
比較する。R2でprotection false/403/ruleset drift、second-parent持込み、rename/delete、receipt洗浄を
実行する。R3では実観測gapだけをL6/L7 test-designへ戻し、protection未取得を許容するために設計を
弱めない。R4は別provider review、同一HEAD CI、保護main合流後の再観測を満たす場合だけForwardへ合流する。

## AC

- [ ] R0で予定成果と実観測を分離する。
- [ ] R1でC0/protection/epoch artifactの差分を全fieldで比較する。
- [ ] R2で全parent/全commit edgeとprotection failure oracleを実行する。
- [ ] R3で実際のgapだけを上流契約とL7 oracleへbackfillする。
- [ ] R4でL7-440と同一review/CI/merge anchorを記録してForwardへ合流する。
