---
plan_id: PLAN-REVERSE-381-vmodel-spec-ir-projection-backfill
title: "PLAN-REVERSE-381: Vモデル spec IR projection design backfill closure"
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
    slot_label: "TL - spec IR projection backfill closure review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-381-vmodel-spec-ir-projection-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-381-vmodel-spec-ir-projection.md
  requires:
    - PLAN-L6-39-vmodel-spec-ir-function-contracts
    - PLAN-L5-13-vmodel-spec-ir-physical-data
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T12:44:53+09:00"
    tests_green_at: "2026-07-08T12:44:53+09:00"
    verdict: approve
    scope: "PLAN-L7-381 の add-impl 実装が、先行済み L4/L5/L6 spec IR / projection / route candidate 設計に一致していることを確認する Reverse closure。追加設計差分は不要で、forward routing は gap-only とする。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/state-db.test.ts tests/db-projection-coverage.test.ts tests/db-projection-ingestion.test.ts tests/spec-ir-projections.test.ts tests/projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T12:44:53+09:00"
        evidence_path: tests/spec-ir-projections.test.ts
        output_digest: "sha256:24716a444f44c35e72207567751efe480f9b8d47dfdf0e931536f340b4a71a6d"
---

# PLAN-REVERSE-381: Vモデル spec IR projection design backfill closure

## R0 Evidence

PLAN-L7-381 は、PLAN-L5-13 / PLAN-L6-39 で定義済みの spec IR projection table と関数契約を実装した。
実装 surface は `src/schema/harness-db-tables-spec-ir.ts`、`src/state-db/spec-ir-projections.ts`、
`src/state-db/projection-writer.ts`、および関連 tests である。

## R1 Observed Gap

L7 実装は add-feature mode の add-impl として扱う必要があるため、Reverse pairing の機械証跡が必要である。
今回の設計差分は実装前に L4/L5/L6 へ投入済みで、実装後に新たな L1-L6 設計欠落は見つかっていない。

## R2 Alignment

L7 実装は以下の既存設計に一致する。

- L4: `SpecDef` / `SpecRelation` / `ScheduleEntry` / `ActivationEntry` / `DetectorFinding` の集約境界。
- L5: `spec_defs` / `spec_relations` / `schedule_entries` / `activation_entries` / `detector_route_candidates` の物理 table / index。
- L6: loader / parser / projector / integrity / route candidate handoff の関数契約。

## R3 / R4 Outcome

追加 backfill は不要。PLAN-L7-381 は既存設計の add-impl として forward に合流し、後続 U4 は
`detector_route_candidates` と `routeFiling` SSoT の結合 surface を扱う。

## DoD

- [x] PLAN-L7-381 が L4/L5/L6 の設計に対応している。
- [x] 後続 U4 の入力 table が harness.db に投影される。
- [x] targeted vitest が green。
