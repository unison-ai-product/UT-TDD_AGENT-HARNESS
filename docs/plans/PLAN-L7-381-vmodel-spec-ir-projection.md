---
plan_id: PLAN-L7-381-vmodel-spec-ir-projection
title: "PLAN-L7-381 (add-impl): Vモデル spec IR / 工程 / 活性化 / 起票候補 projection 実装"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/plans/PLAN-L6-39-vmodel-spec-ir-function-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T12:44:53+09:00"
    tests_green_at: "2026-07-08T12:44:53+09:00"
    verdict: approve
    scope: "U3 L7 add-impl slice。PLAN-L5-13 / PLAN-L6-39 の spec_defs / spec_relations / schedule_entries / activation_entries / detector_route_candidates を harness.db schema/catalog/index/projection へ実装し、db-projection-coverage が §9.9 を読むように更新した。projection は source docs を rewrite せず、detector_route_candidates は FilingTarget を創作せず non-ready candidate として routeFiling SSoT へ渡す。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T12:44:53+09:00"
        evidence_path: src/state-db/spec-ir-projections.ts
        output_digest: "sha256:451613ff14bd705d80b757fcb3b02a1fd1ea9e823fc3ddcc733ebdae32c3c811"
      - kind: unit_test
        command: "bun run vitest run tests/state-db.test.ts tests/db-projection-coverage.test.ts tests/db-projection-ingestion.test.ts tests/spec-ir-projections.test.ts tests/projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T12:44:53+09:00"
        evidence_path: tests/spec-ir-projections.test.ts
        output_digest: "sha256:24716a444f44c35e72207567751efe480f9b8d47dfdf0e931536f340b4a71a6d"
agent_slots:
  - role: tl
    slot_label: "TL - spec IR projection schema / writer integration review"
  - role: se
    slot_label: "SE - spec-ir-projections pure parser + projector implementation"
  - role: qa
    slot_label: "QA - schema coverage / ingestion / idempotency / route candidate non-ready"
generates:
  - artifact_path: docs/plans/PLAN-L7-381-vmodel-spec-ir-projection.md
    artifact_type: markdown_doc
  - artifact_path: src/schema/harness-db-tables-spec-ir.ts
    artifact_type: source_module
  - artifact_path: src/state-db/spec-ir-projections.ts
    artifact_type: source_module
  - artifact_path: tests/spec-ir-projections.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-39-vmodel-spec-ir-function-contracts.md
  requires:
    - PLAN-L5-13-vmodel-spec-ir-physical-data
    - PLAN-L4-19-vmodel-spec-ir-data
    - PLAN-L4-18-roadmap-drive-selection-hardening
    - PLAN-L6-38-router-function-contracts
    - PLAN-L6-39-vmodel-spec-ir-function-contracts
    - PLAN-L7-46-projection-writer
    - docs/plans/PLAN-REVERSE-381-vmodel-spec-ir-projection-backfill.md
  references:
    - docs/design/harness/L5-detailed-design/physical-data.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/test-design/harness/L8-integration-test-design.md
---

# PLAN-L7-381: Vモデル spec IR / 工程 / 活性化 / 起票候補 projection 実装

## 0. 役割

本 PLAN は U3 L7 として、上流で定義した宣言型 spec IR を `.ut-tdd/harness.db` の実 schema / projection / tests へ接続する。目的は、工程管理表、駆動モデル選択、設計要素、検出所見を query 可能にし、後続 U4 の DB-backed detection / 起票候補 surface の入力を作ることである。

## 1. 実装内容

1. `src/schema/harness-db-tables-spec-ir.ts` を新設し、5 table を registry 化する。
2. `SCHEMA_VERSION` を 20 へ上げ、`harness-db-catalog.ts` / `harness-db-indexes.ts` に §9.9 table/index を接続する。
3. `src/state-db/spec-ir-projections.ts` を新設し、source docs / PLAN / test-design から `spec_defs` / `spec_relations` / `schedule_entries` / `activation_entries` / `detector_route_candidates` を deterministic に作る。
4. `rebuildHarnessDb` の transaction 内に `spec-ir` phase を追加する。
5. `db-projection-coverage` が physical-data §9.9 を読むようにし、schema drift を fail-close する。

## 2. 不変条件

- DB は authoring source ではない。projection rebuild は source docs / PLAN / test-design を rewrite しない。
- `spec_relations` は semantic spec edge、`dependency_edges` は impact graph edge として分離する。
- `activation_entries.scope_status=out_of_scope|deferred` は reason 必須。理由欠落は finding 化する。
- `detector_route_candidates` は FilingTarget 決定表ではない。candidate は `routeFiling` SSoT 評価前の non-ready 入力であり、`allowed_kinds` / `layer_band` / `pairing_obligation` を創作しない。
- raw provider transcript、secret-like payload、PII-like payload は row に保存しない。

## 3. 受け入れ条件

- migration で 5 table と §9.9 index が作成される。
- real repo rebuild で `spec_defs` / `spec_relations` / `schedule_entries` / `activation_entries` が populated になる。
- orphan relation は `findings.kind=spec-ir-orphan-relation` と `detector_route_candidates.candidate_status=non_ready` へ投影される。
- `plan lint`、targeted vitest、`tsc --noEmit`、`db rebuild`、`doctor` が green。

## 4. 後続 slice

- U4: `doctor` / detector / feedback surface が `detector_route_candidates` と `routeFiling` SSoT を結合して、起票候補を人間確認可能な形で返す。
- U5: 工程管理表の専用authoring sourceを整備し、`schedule_entries` の現状粒度を PLAN frontmatter 依存から工程表正本へ移す。
