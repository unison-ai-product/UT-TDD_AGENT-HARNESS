---
plan_id: PLAN-REVERSE-406-stable-id-helper-backfill
title: "PLAN-REVERSE-406: stable ID helper 共通化の設計 back-fill"
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
parent_design: docs/plans/PLAN-L7-406-stable-id-helper.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
backprop_scope:
  - layer: L4-basic-design
    decision: updated
    evidence_path: docs/design/harness/L4-basic-design/architecture.md
    reason: "src/stable-id.ts を top-level module surface に列挙し、module-drift の設計正本へ反映する。"
  - layer: L5-detailed-design
    decision: updated
    evidence_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    reason: "stable-id helper の配置・依存方向・公開 IF を module decomposition に追加する。"
  - layer: L6-function-design
    decision: updated
    evidence_path: docs/design/harness/L6-function-design/function-spec.md
    reason: "stableId の pre/post と共有 ID 生成契約を L6 function contract 化する。"
  - layer: L7-unit-test-design
    decision: updated
    evidence_path: docs/test-design/harness/L7-unit-test-design.md
    reason: "stableId helper の collision oracle と injected deps drift 防止を L7 oracle 化する。"
agent_slots:
  - role: tl
    slot_label: "TL - stable ID helper back-fill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-406-stable-id-helper-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-406-stable-id-helper.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-406-stable-id-helper.md
  requires:
    - docs/plans/PLAN-L7-406-stable-id-helper.md
---

# PLAN-REVERSE-406: stable ID helper 共通化の設計 back-fill

## R0 Evidence

HARNESS メモリ監査と PLAN-L7-405 の修正で、非ASCII見出しを `-` へ潰す ID 生成が DB projection の
衝突を作ることが分かった。さらに同種の regex copy が projection / feedback / skill / workflow に残り、
実装と test injected deps の間にも drift 余地があった。

## R1 Observed Gap

L4/L5 は `src/` top-level module として stable ID helper を持たず、L6 は共有 ID 生成契約を明示していなかった。
そのため、新しい helper を実装すると module-drift が正しく back-fill 漏れを検出する状態だった。

## R2 Alignment

DB row ID は detector ごとの固有判断ではなく、projection read-model の基盤契約である。`stableId` は
state-db や feedback に依存しない低レベル helper とし、各 consumer は local regex copy を持たない。

## R3/R4 Back-fill

- `architecture.md`: `stable-id` を §3.1 module surface へ追加。
- `module-decomposition.md`: helper の依存末端性と公開 IF を追記。
- `function-spec.md`: `stableId` の pre/post を定義。
- `L7-unit-test-design.md`: U-SPECIR-R11 として collision / injected deps drift oracle を追加。

本 Reverse は gap-only の設計 back-fill であり、DB schema や外部 API 境界は追加しない。
