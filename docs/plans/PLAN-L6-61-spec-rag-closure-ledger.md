---
plan_id: PLAN-L6-61-spec-rag-closure-ledger
title: "PLAN-L6-61 (add-design): 要求からテスト到達までの spec RAG 閉包台帳"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-43-typed-spec-trace-closure.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T21:00:52+09:00"
    tests_green_at: "2026-07-08T21:00:52+09:00"
    verdict: approve
    scope: "PLAN-L6-61 spec RAG 閉包台帳の L5/L6/L7 設計、schema/projection/CLI、対象 unit tests を確認。工程 RAG と spec RAG を分離し、DB read-model として検索・CLI へ接続した。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T20:58:00+09:00"
        evidence_path: src/state-db/spec-ir-projections.ts
        output_digest: "sha256:4212d085117f7a64114ab4c15a0e866816b11ceb9a33cbcf6843482ae4a17692"
      - kind: unit_test
        command: "bun run vitest run tests\\state-db.test.ts tests\\spec-ir-projections.test.ts tests\\projection-writer.test.ts tests\\db-projection-ingestion.test.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T20:57:00+09:00"
        evidence_path: tests/spec-ir-projections.test.ts
        output_digest: "sha256:36b6611d87aab44a3624ef2fdcc1c8d21f97b0fd79ffa94f93fa3a62819cb99d"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T20:58:00+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:2a804ffa8fe137b716e5e9f5f750159f67c04b627efb354e980c4b5c5d68fb55"
      - kind: integration_test
        command: "bun run src\\cli.ts db rebuild"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T20:58:00+09:00"
        evidence_path: docs/design/harness/L5-detailed-design/physical-data.md
        output_digest: "sha256:9586f96e0a2d9ead4bad383e7cb79474af94235eef062d234e8f02cd12cd3f82"
      - kind: smoke
        command: "bun run src\\cli.ts trace rag --id VMS-004 --json"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T20:58:00+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:2a804ffa8fe137b716e5e9f5f750159f67c04b627efb354e980c4b5c5d68fb55"
agent_slots:
  - role: tl
    slot_label: "TL - spec RAG 閉包台帳の設計、PLAN-L6-43/60 との責務分離、DB read-model 化"
generates:
  - artifact_path: docs/plans/PLAN-L6-61-spec-rag-closure-ledger.md
    artifact_type: markdown_doc
  - artifact_path: src/schema/harness-db.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-tables-spec-ir.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-indexes.ts
    artifact_type: source_module
  - artifact_path: src/state-db/spec-ir-projections.ts
    artifact_type: source_module
  - artifact_path: src/lint/db-projection-ingestion.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/state-db.test.ts
    artifact_type: test_code
  - artifact_path: tests/spec-ir-projections.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
  - artifact_path: tests/db-projection-ingestion.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L6-43-typed-spec-trace-closure.md
  requires:
    - docs/plans/PLAN-L6-43-typed-spec-trace-closure.md
    - docs/plans/PLAN-L6-60-trace-impact-traversal-command.md
  references:
    - docs/plans/PLAN-L6-52-signals-schedule-live-handover.md
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
---

# PLAN-L6-61: 要求からテスト到達までの spec RAG 閉包台帳

## 0. 背景

ZIP の `spec_check.py` 相当の価値は、要求・設計・テストの到達状態を RAG で一覧化し、未到達の仕様を検出しやすくする点にある。UT-TDD 側では `PLAN-L6-43` が typed spec の `traces_from` / `traces_to` / `tests` の片側欠落を finding 化し、`PLAN-L6-60` が ID 起点の upstream / downstream / tests impact を返す。しかし、どの仕様が「テストまで閉じているか」を DB read-model として一覧検索する台帳はまだ無い。

本 PLAN は、検出系に設計を合わせるのではなく、typed spec 設計を正本として `spec_rag_closure_entries` に投影し、検索・doctor・起票候補が同じ閉包状態を読めるようにする。`PLAN-L6-52` の `schedule_entries.rag` は工程進捗の RAG であり、本 PLAN の spec RAG は要求からテストまでの到達状態である。両者を同じ意味として扱わない。

## 1. 設計スコープ

1. `PLAN-L6-43` の typed spec trace closure finding を入力に、spec ID 単位の閉包状態を `green` / `yellow` / `red` で投影する。
2. `PLAN-L6-60` の impact traversal と同じ向き付けで upstream / downstream / tests の到達数を算出し、`impact_summary` として検索可能にする。
3. `spec_rag_closure_entries` を harness.db の rebuildable projection として追加し、authoring source を更新しない。
4. `ut-tdd trace rag [--id] [--json]` を read-only CLI として追加し、DB 再構築後に台帳を確認できるようにする。
5. `schedule_entries.rag` は工程管理表の現在地、`spec_rag_closure_entries.rag` は spec 閉包であることを L5/L6/L7 に明記する。

## 2. 受け入れ条件

- `spec_rag_closure_entries` table と index が schema / migration で作成される。
- typed spec projection から `requires_test=1` かつ test 到達 0 の row が `red` / `missing_test` になる。
- trace closure finding を持つ row は `yellow` / `partial` になり、finding が無く test 到達済みの row は `green` / `closed` になる。
- real repo rebuild で `VMS-004` など既存 typed spec が `spec_rag_closure_entries` と `search_index` に投影される。
- `ut-tdd trace rag --id <id> --json` が DB を read-only に参照し、row を JSON で返す。
- `db-projection-ingestion` は `spec_rag_closure_entries` を automatic projection として扱う。

## 3. 実装方針

- `src/state-db/spec-ir-projections.ts` に `deriveSpecRagClosureEntries` を追加する。
- flow edge は `PLAN-L6-60` の impact traversal と同じ設計方向を採用する。`traces_from` / `requires` は依存元から影響先へ反転し、`traces_to` / `tests` は宣言方向を使う。`pairs` は spec RAG の到達判定には混入しない。
- RAG 判定は deterministic にする。`requiresTypedSpecTest(kind)` が true で test 到達 0 なら red、typed-spec closure finding があれば yellow、それ以外は green。
- DB row は `spec_id`、`spec_kind`、`layer`、`sub_doc`、`rag`、`closure_status`、`requires_test`、`upstream_count`、`downstream_count`、`test_count`、`finding_count`、`impact_summary` を持つ。
- CLI は `trace impact` と同じ `trace` command group に置く。新しいトップレベル command は増やさない。

## 4. 実装結果

- harness.db schema version を 25 に上げ、`spec_rag_closure_entries` と検索用 index を追加した。
- `deriveSpecRagClosureEntries` が typed spec 宣言、relation、typed-spec closure finding から RAG row を生成する。
- `projectSpecIr` が `spec_rag_closure_entries` と `search_index` row を deterministic に投影する。
- `ut-tdd trace rag [--id] [--json]` を追加し、DB read-only で spec RAG 閉包台帳を確認できるようにした。
- L5 physical-data、L6 function-spec、L7 unit-test-design に、工程 RAG と spec RAG の責務分離を明記した。
- 対象 unit tests、typecheck、lint、DB rebuild、CLI smoke は green。full doctor は foreign `PLAN-L7-395-byte-integrity-readability-guard` の draft 実装差分が同時に存在するため、この PLAN の review evidence には含めない。
