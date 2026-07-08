---
plan_id: PLAN-REVERSE-392-memory-promotion-digest-backfill
title: "PLAN-REVERSE-392: memory 昇格 nudge / handover digest の design backfill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: db
status: draft
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-08
updated: 2026-07-08
owner: PO / Codex
agent_slots:
  - role: tl
    slot_label: "TL - handover-mechanism / memory 設計との整合 backfill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-392-memory-promotion-digest-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-392-memory-promotion-handover-digest.md
  requires:
    - PLAN-L7-189-shared-harness-memory-cross-runtime
  references:
    - PLAN-L7-366-takeover-surface-warn-actionable
    - PLAN-L7-246-feedback-event-lifecycle
review_evidence: []
---

# PLAN-REVERSE-392: memory 昇格 nudge / handover digest の design backfill

## R0 Evidence

PO 決定 (2026-07-08): handover を「DB 導出 digest + HARNESS メモリ + HEAD」の 3 点へ収束させ、
prose handover は廃止方向。共有メモリは存在したが書き込み義務がなく 0 件のままだった。

## R1 Observed Gap

- `docs/design/harness/L6-function-design/handover-mechanism.md` は digest の固定 4 段
  フォーマット (gate / HEAD 成果 / actionable 上位 / memory recall) を規定していない。
- `memory.md` (L6) は memory への書き込み契機 (昇格 nudge) を契約に含まない。
- telemetry lifecycle (TTL / auto-ack) の設計が feedback lifecycle 設計に未接続。

## R2 Alignment

エンジン載せ替え (Codex 対応中) の handover/workflow 改修と同一面。載せ替え側の新設計が
確定したら、本 backfill はそこへ合流し、L6 handover-mechanism / memory の contract 更新として
閉じる。forward routing は gap-only とする。

## R3 / R4 Outcome

未実施 (draft)。PLAN-L7-392 実装と対で閉じる。

## DoD

- [ ] L6 handover-mechanism に digest 固定フォーマットの contract が追記される。
- [ ] L6 memory に昇格 nudge の contract (fail-open) が追記される。
- [ ] telemetry TTL/auto-ack が feedback lifecycle 設計へ接続される。
