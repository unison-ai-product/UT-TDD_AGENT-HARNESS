---
plan_id: PLAN-L7-404-design-doc-cross-integrity-gate
title: "PLAN-L7-404 (add-impl): design-doc-cross-integrity doctor gate"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-09
updated: 2026-07-09
owner: Codex
parent_design: docs/plans/PLAN-L6-59-design-doc-cross-integrity-check.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - 設計 doc 横断整合性 gate 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-404-design-doc-cross-integrity-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-404-design-doc-cross-integrity-backfill.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/spec-ir-projections.ts
    artifact_type: source_module
  - artifact_path: src/doctor/db-projection.ts
    artifact_type: source_module
  - artifact_path: src/doctor/check-definition-groups.ts
    artifact_type: source_module
  - artifact_path: src/doctor/profiles.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/spec-ir-projections.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-59-design-doc-cross-integrity-check.md
  requires:
    - docs/plans/PLAN-L6-59-design-doc-cross-integrity-check.md
    - docs/plans/PLAN-REVERSE-404-design-doc-cross-integrity-backfill.md
  references:
    - docs/plans/PLAN-L4-20-document-catalog-scale-profile-ssot.md
    - docs/plans/PLAN-L6-43-typed-spec-trace-closure.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T13:26:00+09:00"
    tests_green_at: "2026-07-09T13:26:00+09:00"
    verdict: approve
    scope: "PLAN-L7-404。L6-59 の設計 doc 横断整合性契約を spec-ir projection と doctor full profile へ接続する実装 slice。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\spec-ir-projections.test.ts tests\\doctor.test.ts --testNamePattern \"design doc cross|duplicate typed spec|dependency cycles\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T13:26:00+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:96e6920003cef323b11c7d09967b5627639fc3e489c50001b4ef4019fee4907b"
---

# PLAN-L7-404: design-doc-cross-integrity doctor gate

## 背景

`PLAN-L6-59` で固定した設計 doc 横断整合性契約を、実際の `spec-ir` projection と `doctor`
full profile に接続する。目的は ZIP `cmd_check` 相当の「全 doc 横断で見る」検出を HARNESS の
DB 駆動 gate として持たせること。

## 実装スコープ

1. `document_catalog_entries` と typed spec projection (`spec_defs` / `spec_relations`) から、
   doc 単位の定義元と依存 edge を組み立てる。
2. 同一 `spec_id` が複数の設計 doc で定義された場合に `design-doc-duplicate-definition` を出す。
3. forward dependency 系 relation を doc edge に畳み込み、doc 間循環を
   `design-doc-dependency-cycle` として出す。同一 doc 内の自己参照は対象外にする。
4. `doctor` full profile に `design-doc-cross-integrity` を追加し、DB projection 由来の gate として
   fail-close させる。

## DoD

- [x] 重複定義と doc 間循環の unit oracle が追加される。
- [x] `doctor` full profile に `design-doc-cross-integrity` が表示される。
- [x] typed-spec trace closure と module import dependency drift へ責務を重複させない。
