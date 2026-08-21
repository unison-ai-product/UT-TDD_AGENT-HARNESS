---
plan_id: PLAN-REVERSE-496-pack-independent-consumer-runtime-backfill
title: "PLAN-REVERSE-496: consumer runtime隔離契約の上流合流"
kind: reverse
layer: cross
drive: agent
workflow_phase: R1
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
status: draft
created: 2026-08-21
updated: 2026-08-21
owner: PM / Codex
parent_design: docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - S4実装差分のL6受入契約へのbackfill判定"
  - role: qa
    slot_label: "QA - A/B隔離、digest再計算、escapeとprocess非干渉を再検収する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-496-pack-independent-consumer-runtime-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
    - docs/plans/PLAN-L6-102-release-promotion-rollback-gate.md
    - docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/362
review_evidence: []
---

# PLAN-REVERSE-496: consumer runtime隔離契約の上流合流

## 1. R1〜R2対象

- PF5のsealed aggregateをconsumerへ受け渡す際の、path/mode/content独立digest再計算。
- canonical releaseId derivationをmaterializer version/source revision/artifact digestへ束縛し、coherent fake
  identity replayを拒否すること。
- consumer/runtime rootのcanonical namespaceとsymlink/junction escape fail-close。
- configuration、DB、Memory、PLAN、lock、hook、receipt、evidence、historyのlayoutをproduct-local runtime rootへ固定すること。
- product identity、manifest、receipt、planの三者束縛と異version共存。
- A prior stateを持つupgrade/rollback中にBの実process、bytes、mode、path、state/historyを不変にする観測。
- artifact unavailable、unknown version、receipt mismatch、局所faultのwrite/process 0。

## 2. R3〜R4

R3では非著者reviewerがsource fallback、共有state、digest申告値の信用、parent symlink escape、B process
汚染を攻撃する。R4では実測で必要と判明した差分だけを`PLAN-L6-101`とL7 test-designへ戻し、PF1〜PF5や
promotion gateの契約を変更しない。
