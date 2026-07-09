---
plan_id: PLAN-L7-405-spec-ir-detector-precision
title: "PLAN-L7-405 (add-impl): spec-ir detector precision and stable ID hardening"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-09
updated: 2026-07-09
owner: Codex
parent_design: docs/plans/PLAN-L6-39-vmodel-spec-ir-function-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - spec-ir 検出境界と ID 安定性の精密化"
generates:
  - artifact_path: docs/plans/PLAN-L7-405-spec-ir-detector-precision.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: src/state-db/spec-ir-projections.ts
    artifact_type: source_module
  - artifact_path: tests/spec-ir-projections.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-39-vmodel-spec-ir-function-contracts.md
  requires:
    - docs/plans/PLAN-L7-381-vmodel-spec-ir-projection.md
    - docs/plans/PLAN-REVERSE-405-spec-ir-detector-precision-backfill.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
  references:
    - docs/plans/PLAN-L7-400-feedback-surface-group-before-slice.md
    - docs/governance/context-efficiency-audit-2026-07-09.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T19:12:35+09:00"
    tests_green_at: "2026-07-09T19:12:35+09:00"
    verdict: approve
    scope: "HARNESS メモリで検出された spec-ir invalid-subdoc 大量誤検知、short PLAN ID 孤児化、reference doc 未取込、Unicode stable ID 衝突の L7 実装修正。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\spec-ir-projections.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T19:12:35+09:00"
        evidence_path: tests/spec-ir-projections.test.ts
        output_digest: "sha256:c75a927503432e96482a7a3ab8c4e2a890fa7a53f2f43be3e8b3eb4303830ef1"
        anchor_commit: 1afa132c9368fc362706db102880e020d7ba3d24
---

# PLAN-L7-405: spec-ir detector precision and stable ID hardening

## 背景

HARNESS メモリの監査で、`spec-ir-invalid-subdoc` が PLAN / test-design / typed spec 由来の補助 row
へ過剰発火し、`spec-ir-orphan-relation` も一意な短縮 PLAN ID や存在する参照ドキュメントを解決できず
大量に積まれることが分かった。さらに `stableId` が非ASCII見出しを `-` へ潰すため、DB に引き込んだ
設計情報が同一 ID として衝突する。

この PLAN は検出を弱めるのではなく、設計責務へ合わせて検出境界を精密化する。

## 実装スコープ

1. `loadSpecIrSources` が PLAN から正当に参照される `docs/governance` / `docs/adr` / `docs/process` /
   `docs/migration` を `reference_doc` として読み、存在する reference path を orphan にしない。
2. PLAN dependency relation は完全 plan_id に加え、一意な短縮 ID (`PLAN-L7-65` など) を解決する。
3. `spec-ir-invalid-subdoc` は L1-L6 design document の document row だけを対象にし、PLAN / test-design /
   typed spec / reference doc の補助 row を設計 doc catalog 違反として扱わない。
4. `stableId` は ASCII 正規化で情報が落ちる場合に hash suffix を付け、非ASCII見出しの ID 衝突を避ける。
5. L6 function contract と L7 unit oracle を更新し、検出器が設計に従う境界を固定する。

## DoD

- [x] invalid-subdoc の対象 scope を unit test で固定する。
- [x] short PLAN ID と reference doc path の relation 解決を unit test で固定する。
- [x] 非ASCII見出し由来 `spec_id` の衝突回避を unit test で固定する。
- [x] `bun run vitest run tests\spec-ir-projections.test.ts` が green。

## 残リスク

共有 stable ID helper への全局移行は本 PLAN の外に残る。今回の修正は spec-ir projection のデータ損失を先に止める。
