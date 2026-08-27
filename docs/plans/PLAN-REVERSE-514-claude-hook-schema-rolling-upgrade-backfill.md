---
plan_id: PLAN-REVERSE-514-claude-hook-schema-rolling-upgrade-backfill
title: "PLAN-REVERSE-514: Claude hook generation schema rolling upgrade backfill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: be
status: draft
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-with-hardening
created: 2026-08-27
updated: 2026-08-27
owner: PO / TL
github_issue_id: 433
parent_design: docs/plans/PLAN-L7-514-claude-hook-schema-rolling-upgrade.md
pair_artifact: docs/test-design/harness/L7-514-claude-hook-schema-rolling-upgrade-test-design.md
backprop_decision: required
backprop_decision_reason: "旧hookのschema driftを実測し、live workspace routingとasync wakeの再起動境界へ戻す。"
agent_slots:
  - role: tl
    slot_label: "TL - generation marker driftからL6 live workspace契約へのbackprop"
  - role: qa
    slot_label: "Terra - existing request identity と cross-platform recovery 検証"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-514-claude-hook-schema-rolling-upgrade-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-514-claude-hook-schema-rolling-upgrade.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-416-active-upgrade-frontier-right-arm-gate.md
    - docs/plans/PLAN-L7-472-claude-memory-async-wake.md
    - docs/design/harness/L6-function-design/memory.md
    - docs/test-design/harness/L7-514-claude-hook-schema-rolling-upgrade-test-design.md
review_evidence: []
---

# PLAN-REVERSE-514

## R0: 観測されたgap

main更新前から生存するClaude VS Code hookが旧textまたは能力不足のv1 generation markerを保持し、現行の
`generation/v1 JSON + inbox/v3` routingへ接続できない。旧markerを互換形式と推測すると、誤workspaceへのwake、
旧generationによるclaim、既存review requestの不可視化を招く。また、すでに起動済みの旧hookは将来のsource
revisionを知り得ないため、自力でdriftを検出・更新できない。従って、更新済みdispatcher/VS Code bootstrapの
upgrade supervisorをauthorityとする再起動境界をL7でfreezeする。

## R1–R4 のbackfill契約

- **R1:** Windows/Linuxの長寿命processで、旧hookが`pid:timestamp`を書き続けて自力upgradeできないこと、
  source/schema drift、legacy text、foreign/stale/multiple marker、crash/restart途中failureを実測し、upgrade
  supervisorによる`restart_required` handoffとclaim 0を記録する。
- **R2:** #416/#422のlive workspace routingおよびasync wake契約へ、現行v1 markerの必須binding、upgrade
  supervisorのauthority、exact-one active generation、handoff replay fenceを反映する。
- **R3:** #423既存envelopeのconsume、#410既存requestのredispatchをidentity再発行なしで実走し、Linux/Windows/
  aggregateと非著者reviewを同一revisionで再検収する。
- **R4:** 上位契約へのbackprop、Forwardへの再合流、未解決のprovider permissionやPack publicationは別Issueの
 まま保持し、#433のschema upgradeだけをconfirmedへ閉じる。

Reverse R4は、旧requestの再mint、manual receipt、merge bypass、未出荷generation schemaの導入を成功条件に
含めない。v1の意味を破壊する将来schema bumpは別PLANのpair-freezeへ送る。
