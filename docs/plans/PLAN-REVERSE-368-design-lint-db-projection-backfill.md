---
plan_id: PLAN-REVERSE-368-design-lint-db-projection-backfill
title: "PLAN-REVERSE-368: 設計 lint DB 投影の design backfill closure"
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
    slot_label: "TL - design lint DB projection backfill closure"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-368-design-lint-db-projection-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/plans/PLAN-L7-368-design-lint-db-projection.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-368-design-lint-db-projection.md
  requires:
    - docs/design/harness/L6-function-design/function-spec.md
---

# PLAN-REVERSE-368: 設計 lint DB 投影の design backfill closure

## R0 Evidence

PLAN-L7-368 は既存 file-driven 設計 lint を DB 投影 fact へ接続し、`findings` / `coverage` から検出状態を検索可能にした。

## R1 Observed Gap

設計品質 lint は doctor message としては存在していたが、DB projection へ閉じておらず、pair-freeze orphan や設計品質違反数を `harness.db` から query できなかった。

## R2 Alignment

- L6 `function-spec.md` に `projectDesignPairFreezeFindings` / `projectDesignQualityCoverage` / `checkDesignDetection` 契約を追加した。
- L7 `unit-test-design.md` に U-DESIGNDB-R1..R4 を追加し、DB 投影と doctor gate の oracle を固定した。
- 既存 file-driven lint は判定正本として残し、DB-driven `design-detection` は投影 fact の欠落・blocked・open orphan だけを見る。

## R3 / R4 Outcome

追加 backfill は PLAN-L7-368 内で Forward 合流する。DB schema は増やさず、既存 `findings` / `coverage` を使う。

## DoD

- [x] L6 function contract が DB 投影と doctor gate の責務を定義している。
- [x] L7 oracle が design-quality coverage と pair orphan finding を固定している。
- [x] Forward 実装 PLAN が Reverse closure を参照している。
