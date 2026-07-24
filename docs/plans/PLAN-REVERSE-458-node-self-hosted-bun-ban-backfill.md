---
plan_id: PLAN-REVERSE-458-node-self-hosted-bun-ban-backfill
title: "PLAN-REVERSE-458: Node self-hosted Bun permanent-ban implementation backfill"
kind: reverse
layer: cross
drive: fullstack
status: draft
route_signal: drift
route_mode: reverse
workflow_phase: R0
confirmed_reverse_type: design
created: 2026-07-23
updated: 2026-07-23
owner: PO / Codex
github_issue_id: 152
parent_design: docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - Node self-host実装からL4-L6契約へのgap-only backfillとForward再合流判定"
  - role: qa
    slot_label: "QA - Bun process zero、Node bootstrap receipt、Linux/Windows証拠の照合"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-458-node-self-hosted-bun-ban-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
  requires: []
  references:
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/design/harness/L6-function-design/function-spec.md
  blocks: []
---

# PLAN-REVERSE-458: Node self-hosted Bun permanent-ban implementation backfill

## 1. 目的

Issue #152のD0-Nで確定したNode control plane設計をForwardへ合流した後、`PLAN-L7-458`の`add-impl`で得た実装事実をR0-R4で上位設計へ戻す。実装を設計承認の根拠にはせず、設計との差分だけをgapとして扱う。Issue #153のbootstrap envelopeはreceipt、review、Node matrixを免除しない。

## 2. R0-R4

- R0: Node executable identity、compiled ESM、package-lock、SQLite adapter、Bun finding、runtime process観測を収集する。
- R1: 実装が公開するbootstrap / detector / receipt契約を観測する。
- R2: ADR-001とL4-L6のNode control-plane節へ照合し、設計済み契約と実装固有詳細を分離する。
- R3: 設計差分、未観測境界、Bun残存負債をPO検証へ出す。
- R4: gapの設計反映、L7 test trace、Linux/Windows/aggregate evidenceを揃え、Forward reviewへ再合流する。

## 3. 不変条件

- PoC実装を捨てて設計から再降下した経路はRedesign、採用実装から設計を追従させる本工程はReverseとして混同しない。
- Bun依存をallowlistでGreen化しない。既存負債は`NonCompliant`、観測不能は`Indeterminate`として保持する。
- 実装結果でL4-L6を自動改訂せず、差分採択後にのみ設計を更新する。
