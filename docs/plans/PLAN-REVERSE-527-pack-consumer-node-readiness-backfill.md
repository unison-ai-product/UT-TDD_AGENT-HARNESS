---
plan_id: PLAN-REVERSE-527-pack-consumer-node-readiness-backfill
title: "PLAN-REVERSE-527: consumer Node readiness backfill"
kind: reverse
layer: cross
drive: agent
route_signal: design_gap
route_mode: reverse
status: confirmed
workflow_phase: R4
confirmed_reverse_type: design
created: 2026-08-31
updated: 2026-08-31
owner: Codex / Luna
forward_routing: gap-only
promotion_strategy: reuse-as-is
github_issue_id: 471
parent_design: docs/plans/PLAN-L7-527-pack-consumer-node-readiness.md
pair_artifact: docs/test-design/harness/L7-pack-consumer-node-readiness-test-design.md
agent_slots:
  - role: qa
    slot_label: "QA - Bun probeとNode range guardの単軸変異を検証する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-527-pack-consumer-node-readiness-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/setup-solo-team.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/test-design/harness/L7-pack-consumer-node-readiness-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-527-pack-consumer-node-readiness.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md
    - docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    - docs/design/harness/L6-function-design/setup-solo-team.md
    - docs/test-design/harness/L7-unit-test-design.md
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
2. Node constraint guard (missing/invalid `engines.node`、missing `nodeVersion`、および
   below/above-range) を常時trueへ変えると、`U-PACKBUN-002` の各負系 fixtureが typed
   blocking check の name/message と `readiness.ok=false` を個別に検証してRedになる。
3. Bun checkまたは導入案内を戻すと `U-PACKBUN-002` がRedになる。
4. `ci.requires`または`rollback.commands`へBun実行形を1件戻すと、readiness全体を走査する
   `U-PACKBUN-002` がRedになる。

## R3

親PLANのS1-a境界と、backprop targetである L6 `docs/design/harness/L6-function-design/setup-solo-team.md`
の U-SETUP-012/U-SETUP-013、global L7 `docs/test-design/harness/L7-unit-test-design.md` の
U-SETUP-012/U-SETUP-013/AT-DIST-001、および paired test design を照合する。`PLAN-L6-93-node-bootstrap-contract.md`
との Node bootstrap 境界も併せて確認し、Bun readiness と Bun transitional fixture を混同しない。

## R4

不足が実証された場合だけ、上記 L6/global L7 backprop targets と paired test design、ならびに
`PLAN-L6-93-node-bootstrap-contract.md` へ差分を戻し、Forwardへ `gap-only` で再合流する。
S1-b (#496) は current main `f38b78d8` に landing 済みであり、generated-hook の Node化を
S1-aの実装前提として扱う。ただしS1-aのreadiness証跡だけをBun BANまたはreleasable完了の
証拠にはせず、#472/#473の別スライスを引き続き要求する。
