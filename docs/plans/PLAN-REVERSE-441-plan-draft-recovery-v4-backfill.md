---
plan_id: PLAN-REVERSE-441-plan-draft-recovery-v4-backfill
title: "PLAN-REVERSE-441: PLAN Draft強制終了recovery v4の設計backfill"
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
parent_design: docs/plans/PLAN-L7-441-plan-draft-recovery-v4.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - durable journal/publisher/recovery実装差分観測"
  - role: qa
    slot_label: "QA - F0-F9/FX kill pointとfencing oracle"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-441-plan-draft-recovery-v4-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-441-plan-draft-recovery-v4.md
  requires: []
  references:
    - docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
    - docs/plans/PLAN-L7-435-drive-plan-admission-impl.md
  blocks: []
---

# PLAN-REVERSE-441: PLAN Draft強制終了recovery v4の設計backfill

## R0観測境界

`PLAN-L7-441` の未実装sourceはrelation graphで `generates` edgeの `planned` lifecycleとして追跡し、
実装済みsource (`materialized`) と混同しない。R0ではjournal v4 event/current、artifact child stream、fsync/rename境界、fencing、
assessment digest、recovery CLIとgateの実挙動を観測対象として固定する。

## gap-only backfill規則

R1でL6-86とjournal/publisher/recovery実装の永続フィールド・副作用順序を比較する。R2でF0〜F9/FX、
partial publish、backup欠落、event/current改ざん、ledger後crashを実行する。R3では実観測gapだけを
L6契約とL7 test-designへ戻し、receiptだけでcommitを許可するために設計を弱めない。R4は別provider
review、同一HEAD CI、recovery clearanceの検証を満たす場合だけForwardへ合流する。

## AC

- [ ] R0でpending artifactとmaterialized artifactを区別する。
- [ ] R1で永続field、fencing、publisher遷移、gate責務の差分を比較する。
- [ ] R2で全kill pointと改ざんoracleを実行する。
- [ ] R3で実際のgapだけを上流契約とL7 oracleへbackfillする。
- [ ] R4でL7-441と同一review/CI/merge anchorを記録してForwardへ合流する。
