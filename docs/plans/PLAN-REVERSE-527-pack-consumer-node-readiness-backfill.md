---
plan_id: PLAN-REVERSE-527-pack-consumer-node-readiness-backfill
title: "PLAN-REVERSE-527: consumer Node readiness S1-a backfill"
kind: reverse
layer: cross
drive: agent
workflow_phase: R1
confirmed_reverse_type: fullback
status: draft
created: 2026-08-31
updated: 2026-08-31
owner: Codex / Luna
forward_routing: L6/L7
promotion_strategy: reuse-as-is
github_issue_id: 471
agent_slots:
  - role: tl
    slot_label: "TL - S1-a の readiness 証跡を親契約へ戻す"
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
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/471
backprop_decision: required
backprop_decision_reason: "readiness の Bun 到達不能と engines.node 判定を親の Pack/consumer 契約へ戻すため。"
review_evidence: []
---

# PLAN-REVERSE-527: consumer Node readiness S1-a backfill

## 1. 戻し先

S1-a の実測結果を `PLAN-L7-522` §2.2 の readiness 契約へ戻す。生成 template、source CI、
sealed Node producer の責務は戻し先に含めず、それぞれ #470、#472、#473 の境界へ残す。

## 2. 戻し条件

- Bun executable と Bun home を隔離した clean consumer の実 CLI setup が成功する。
- `engines.node` の npm semver rangeを supported / below / above の独立oracleで検証する。
- Node readinessの判定に別の固定versionを持たず、consumer manifestを正本とする。
- exact HEADのCIと非著者closing reviewが揃うまでR4確定を主張しない。
