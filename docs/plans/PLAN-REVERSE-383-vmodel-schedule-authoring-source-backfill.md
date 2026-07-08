---
plan_id: PLAN-REVERSE-383-vmodel-schedule-authoring-source-backfill
title: "PLAN-REVERSE-383: Vモデル工程管理表 authoring source design backfill closure"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
status: confirmed
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
agent_slots:
  - role: tl
    slot_label: "TL - schedule authoring source backfill closure"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-383-vmodel-schedule-authoring-source-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-383-vmodel-schedule-authoring-source.md
  requires:
    - PLAN-L6-39-vmodel-spec-ir-function-contracts
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T13:21:30+09:00"
    tests_green_at: "2026-07-08T13:21:30+09:00"
    verdict: approve
    scope: "PLAN-L7-383 の add-impl 実装が、U5 の上流設計差分を L1/L4/L5/L6 へ戻し、工程管理表を Workflow 集約 authoring source として閉じていることを確認する Reverse closure。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/spec-ir-projections.test.ts tests/projection-writer.test.ts tests/db-projection-ingestion.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T13:21:30+09:00"
        evidence_path: tests/spec-ir-projections.test.ts
        output_digest: "sha256:8cccd994bf72df3b7f503e043d4cc5ceb368204ae24f62c92be7c84044eb5638"
---

# PLAN-REVERSE-383: Vモデル工程管理表 authoring source design backfill closure

## R0 Evidence

PLAN-L7-383 は、工程管理表の専用 authoring source を追加し、`schedule_entries` projection がその表を第一入力として読むようにした。

## R1 Observed Gap

U3 時点では `schedule_entries` table は存在したが、入力は PLAN frontmatter 由来の fallback であり、ユーザー要求の
「工程管理表による現在地把握」と ZIP の工程表思想が専用正本として固定されていなかった。

## R2 Alignment

接続先は既存設計に一致する。

- L1: VUP-REQ-01 / VUP-REQ-03 が工程表と projection の関係を持つ。
- L4 data: `ScheduleEntry` は Workflow 集約の projection input である。
- L4 function: `FilingTarget` は現在地と工程表を入力として返す。
- L5 physical-data: `schedule_entries` は current location / RAG / blocked reason を保存する。
- L6 function-spec: `parseScheduleEntries` は source docs を rewrite しない。

## R3 / R4 Outcome

追加 backfill は PLAN-L7-383 内で完了。工程表正本、上流設計、L7 projection、tests が同一 slice で forward に合流する。

## DoD

- [x] 工程管理表が governance 正本に登録されている。
- [x] L1/L4/L5/L6 が専用工程表優先を共有している。
- [x] projection は工程表 row を PLAN fallback より優先する。
- [x] malformed row は finding 化される。
