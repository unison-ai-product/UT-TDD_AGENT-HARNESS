---
plan_id: PLAN-REVERSE-429-spec-ir-detector-scope-backfill
title: "PLAN-REVERSE-429 (reverse): spec-ir detector scope 精密化の上位整合 backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
status: draft
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-13
updated: 2026-07-13
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-429-spec-ir-detector-scope.md
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - PLAN-L7-429 実装後に L6 function contract / L7 unit oracle へ backfill する範囲を確認"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-429-spec-ir-detector-scope-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-429-spec-ir-detector-scope.md
  requires: []
---

# PLAN-REVERSE-429: spec-ir detector scope 精密化の上位整合 backfill

## 0. 位置づけ

`PLAN-L7-429-spec-ir-detector-scope` は `PLAN-L7-405-spec-ir-detector-precision` が固定した
検出境界を、2026-07-13 triage で確定した 2 系統の構造的誤検知 (メタ doc 除外漏れ / relation
spec依存-evidence参照の未分離) に対して精密化する add-impl である。add-impl が単独で着地
しないよう、本 Reverse は実装後に L6 function contract、L7 unit oracle へ実装事実を backfill
するためのペアとして起票する。

## 1. R0-R4 方針

- R0: L7 実装 (`shouldValidateDesignSubDoc` メタ doc 除外、`parseSpecRelations` の
  spec依存/evidence参照分離) が `PLAN-L7-405` / `PLAN-L6-39-vmodel-spec-ir-function-contracts.md`
  の既存契約と矛盾しないかを確認する。
- R1: 実装中に変わった除外条件・path prefix allowlist (`pair_artifact: self` は REVERSE-12 規定通り
  orphan のまま除外しない) を
  L6 function contract (`docs/design/harness/L6-function-design/function-spec.md`) へ戻す。
- R2: `tests/spec-ir-projections.test.ts` の負系 fixture を L7 単体テスト設計
  (`docs/test-design/harness/L7-unit-test-design.md`) へ同期する。
- R3: evidence reference を relation 解決対象外とした結果、実在しない evidence path を指す
  PLAN の欠落検出が弱まっていないか (PLAN-L7-429 §7 残リスク) を PO/TL 観点で検証する。
- R4: 本件で新規用語 (spec依存 relation / evidence参照 relation の区別) を L0 用語集へ
  back-merge するか、既存 spec-ir 用語の拡張に留めるかを確定する。

## 2. DoD

- [ ] PLAN-L7-429 が confirmed になった後、実装事実を L6 function contract / L7 unit test
      design へ同期する。
- [ ] spec依存 relation と evidence参照 relation の区別を L0 用語集へ back-merge する要否を
      判定する。
- [ ] doctor / plan lint / targeted tests (`tests/spec-ir-projections.test.ts`) の green
      evidence を review_evidence に記録する。
- [ ] PLAN-L7-429 §7 残リスク (evidence 欠落検出の弱化可能性) の対応要否を判定する。
