---
plan_id: PLAN-REVERSE-527-pack-consumer-node-readiness-backfill
title: "PLAN-REVERSE-527: consumer Node readiness backfill"
kind: reverse
layer: cross
drive: agent
route_signal: design_gap
route_mode: reverse
status: draft
workflow_phase: R0
confirmed_reverse_type: design
created: 2026-08-31
updated: 2026-08-31
owner: Codex / Luna
github_issue_id: 471
parent_design: docs/plans/PLAN-L7-527-pack-consumer-node-readiness.md
pair_artifact: docs/test-design/harness/L7-pack-consumer-node-readiness-test-design.md
agent_slots:
  - role: qa
    slot_label: "QA - Bun probeとNode range guardの単軸変異を検証する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-527-pack-consumer-node-readiness-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-527-pack-consumer-node-readiness.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md
    - docs/test-design/harness/L7-pack-consumer-node-readiness-test-design.md
backprop_decision: required
backprop_decision_reason: "readiness の Bun 到達不能と engines.node 判定を親の Pack/consumer 契約へ戻すため。"
review_evidence: []
---

# PLAN-REVERSE-527

## R0

Forward実装と対でR1へ移り、Red→Greenを束縛する。

## R2 mutation

1. readinessへ `bunOk` のANDを戻すと `U-PACKBUN-001` がRedになる。
2. Node range判定を常時trueへ変えると `U-PACKBUN-002` のunsupported fixtureがRedになる。
3. Bun checkまたは導入案内を戻すと `U-PACKBUN-002` がRedになる。

R3で親PLANのS1-a境界と照合し、R4でForwardへ戻す。
