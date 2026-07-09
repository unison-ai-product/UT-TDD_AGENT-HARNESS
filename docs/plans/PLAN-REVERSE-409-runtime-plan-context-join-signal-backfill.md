---
plan_id: PLAN-REVERSE-409-runtime-plan-context-join-signal-backfill
title: "PLAN-REVERSE-409: runtime PLAN context join signal separation back-fill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
status: confirmed
created: 2026-07-09
updated: 2026-07-09
owner: Codex
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
parent_design: docs/plans/PLAN-L7-409-runtime-plan-context-join-signal.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
backprop_scope:
  - layer: L6-function-design
    decision: not_impacted
    evidence_path: docs/design/harness/L6-function-design/function-spec.md
    reason: "feedback_events の unresolved-join 除外責務と PLAN-L7-144 の work-context 除外方針は既存。今回の差分は local runtime state の signal 種別分離であり、L6 正本の新契約追加は不要。"
  - layer: L7-unit-test-design
    decision: updated
    evidence_path: tests/projection-writer.test.ts
    reason: "一意な短縮 PLAN ID 解決、stale runtime context と true unresolved join の分離を unit oracle として固定する。"
agent_slots:
  - role: tl
    slot_label: "TL - runtime PLAN context back-fill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-409-runtime-plan-context-join-signal-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-409-runtime-plan-context-join-signal.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-409-runtime-plan-context-join-signal.md
  requires:
    - docs/plans/PLAN-L7-409-runtime-plan-context-join-signal.md
---

# PLAN-REVERSE-409: runtime PLAN context join signal separation back-fill

## R0 Evidence

HARNESS メモリ監査と real DB projection で、`unresolved-join` が 797 件残ることを確認した。件数の大半は
gitignored な `.ut-tdd/logs/**` / `.ut-tdd/handover/**` 由来の `PLAN-L7-39` / `PLAN-L7-40` bare numeric
runtime context だった。

## R1 Observed Gap

`PLAN-L7-144` は audit-cycle ID と compound work-context を single PLAN foreign key として扱わないよう
除外した。しかし local runtime state に残る bare numeric PLAN context は、true missing PLAN と同じ
`unresolved-join` として投影され続け、feedback surface で原因の異なる signal が混ざっていた。

## R2 Alignment

source projection table の具体的な missing PLAN は引き続き `unresolved-join` とする。一方、runtime log
または runtime 派生 table (`hook_events` / `test_runs` / `trouble_events` / `guardrail_decisions`) に残る
bare numeric PLAN context は、削除せず `stale-runtime-plan-context` として分離する。これにより DB は
local runtime state の古さを可視化しつつ、本物の join 欠落を埋もれさせない。

## R3/R4 Back-fill

- `src/state-db/projection-writer.ts`: 一意な短縮 PLAN ID の論理解決、runtime context stale 分類を追加。
- `tests/projection-writer.test.ts`: short PLAN 解決と stale/true unresolved の分離を oracle 化。

本 Reverse は gap-only の back-fill であり、local runtime state の削除や historical log の改変は行わない。
