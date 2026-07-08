---
plan_id: PLAN-L7-385-vmodel-activation-profile-join
title: "PLAN-L7-385 (add-impl): activation profile schedule review projection"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/plans/PLAN-L6-41-vmodel-activation-profile-join.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T14:10:34+09:00"
    tests_green_at: "2026-07-08T14:10:34+09:00"
    verdict: approve
    scope: "U7b add-impl slice。activation profile authoring source を activation_entries へ投影し、schedule_entries と join した activation_schedule_reviews と search_index を生成する。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T14:10:34+09:00"
        evidence_path: src/state-db/spec-ir-projections.ts
        output_digest: "sha256:a7580e1f03e9125fbd3d6e426f8c1aec8be92f1f317ca1b1d01c59b89a235778"
      - kind: unit_test
        command: "bun run vitest run tests/spec-ir-projections.test.ts tests/projection-writer.test.ts tests/db-projection-ingestion.test.ts tests/db-projection-coverage.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T14:10:34+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:ff1e6e9bfa0b6850233f2bfba91677e12be3590598c3e733e119247858342c69"
agent_slots:
  - role: tl
    slot_label: "TL - activation schedule review projection"
  - role: se
    slot_label: "SE - spec IR projection and search index wiring"
  - role: qa
    slot_label: "QA - DB rebuild / search / doctor coverage"
generates:
  - artifact_path: docs/plans/PLAN-L7-385-vmodel-activation-profile-join.md
    artifact_type: markdown_doc
  - artifact_path: src/schema/harness-db.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-tables-spec-ir.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-indexes.ts
    artifact_type: source_module
  - artifact_path: src/lint/db-projection-ingestion.ts
    artifact_type: source_module
  - artifact_path: src/state-db/spec-ir-projections.ts
    artifact_type: source_module
  - artifact_path: tests/spec-ir-projections.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
  - artifact_path: tests/db-projection-ingestion.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-41-vmodel-activation-profile-join.md
  requires:
    - docs/plans/PLAN-REVERSE-385-vmodel-activation-profile-join-backfill.md
  references:
    - docs/plans/PLAN-L7-383-vmodel-schedule-authoring-source.md
    - docs/plans/PLAN-L7-384-route-filing-review-surface.md
---

# PLAN-L7-385: activation profile schedule review projection

## 0. 役割

本 PLAN は U7b として、activation profile と工程表を DB 上で join し、version-up wave の対象/除外/延期理由を
検索・検出可能にする。

## 1. 実装内容

1. `activation_schedule_reviews` table と index を schema registry に追加する。
2. `parseActivationEntries` が `vmodel-activation-profiles.md` を第一入力として読む。
3. `joinActivationScheduleReviews` が profile と工程表を join し、missing schedule を finding 化する。
4. `projectSpecIr` が join read-model と `search_index` row を投影する。

## 2. 不変条件

- profile / 工程表 / PLAN frontmatter は projection から更新しない。
- deferred / out_of_scope の理由欠落は finding 化する。
- search row は raw provider transcript や ZIP の生 payload を保存せず、profile metadata と現在地だけを持つ。

## 3. 受け入れ条件

- real repo rebuild で `activation_schedule_reviews` が populated になる。
- `ut-tdd search vmodel-clean-core` 相当で activation schedule review が見つかる。
- targeted vitest、`tsc --noEmit`、`db rebuild`、`doctor` が green。

## 4. 後続 slice

- U8: ZIP 99 の `spec.defines` 型宣言を HARNESS の authoring source と projection に接続する。
