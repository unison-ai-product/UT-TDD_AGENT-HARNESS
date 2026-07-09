---
plan_id: PLAN-REVERSE-405-spec-ir-detector-precision-backfill
title: "PLAN-REVERSE-405: spec-ir 検出境界精密化の設計 back-fill"
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
parent_design: docs/plans/PLAN-L7-405-spec-ir-detector-precision.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
backprop_scope:
  - layer: L6-function-design
    decision: updated
    evidence_path: docs/design/harness/L6-function-design/function-spec.md
    reason: "spec-ir の source 範囲、ID 安定化、invalid-subdoc 適用境界、short PLAN ID relation 解決を契約化する。"
  - layer: L7-unit-test-design
    decision: updated
    evidence_path: docs/test-design/harness/L7-unit-test-design.md
    reason: "U-SPECIR-R10 と既存 R2/R3 を拡張し、誤検知抑止と relation 解決を oracle 化する。"
agent_slots:
  - role: tl
    slot_label: "TL - spec-ir precision back-fill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-405-spec-ir-detector-precision-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-405-spec-ir-detector-precision.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-405-spec-ir-detector-precision.md
  requires:
    - docs/plans/PLAN-L7-405-spec-ir-detector-precision.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T15:54:00+09:00"
    tests_green_at: "2026-07-09T15:54:00+09:00"
    verdict: approve
    scope: "PLAN-REVERSE-405。L7 実装で明確になった spec-ir 検出境界を L6/L7 設計へ back-fill した。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\spec-ir-projections.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T15:54:00+09:00"
        evidence_path: tests/spec-ir-projections.test.ts
        output_digest: "sha256:ec5fd841c5f6f32d6665e30cdba27b86e126a4a55bb200a8869b352408f06ab7"
---

# PLAN-REVERSE-405: spec-ir 検出境界精密化の設計 back-fill

## R0 Evidence

HARNESS メモリ監査で、`spec-ir-invalid-subdoc` と `spec-ir-orphan-relation` の大量表示が確認された。
原因は、spec-ir projection が PLAN / test-design / typed spec / reference doc の補助 row まで
設計 doc catalog 違反として扱い、短縮 PLAN ID や存在する参照ドキュメントを解決対象に含めていなかった
ことにある。非ASCII見出し ID の ASCII 正規化衝突も、DB へ設計情報を引き込む戦略上のデータ損失だった。

## R1 Observed Gap

L6 function contract は「未知 layer/sub_doc を finding」と書いていたが、どの source kind に適用するかを
分けていなかった。L7 oracle も、short PLAN ID / reference doc / Unicode ID の境界を固定していなかった。

## R2 Alignment

設計 doc catalog の妥当性検査、PLAN dependency relation、typed spec trace、reference doc existence は
別責務である。検出器はこの責務境界に合わせ、設計 doc の不正だけを design catalog finding として出し、
存在する参照は DB read-model に引き込んで解決する。

## R3/R4 Back-fill

- `function-spec.md`: `loadSpecIrSources` / `parseSpecDefs` / `parseSpecRelations` の境界を追記。
- `L7-unit-test-design.md`: U-SPECIR-R2/R3 を拡張し、U-SPECIR-R10 を追加。
- `PLAN-L7-405`: 実装 PLAN として relation 解決、ID 安定化、invalid-subdoc scope を実装。

本 Reverse は gap-only の back-fill であり、新しい運用モードや外部 API 境界は追加しない。
