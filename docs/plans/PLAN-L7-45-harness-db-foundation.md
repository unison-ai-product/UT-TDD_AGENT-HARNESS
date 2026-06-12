---
plan_id: PLAN-L7-45-harness-db-foundation
title: "PLAN-L7-45: harness.db state-db foundation (adapter + migration + schema)"
kind: impl
layer: L7
drive: db
parent_design: docs/design/harness/L6-function-design/function-spec.md
status: confirmed
created: 2026-06-11
updated: 2026-06-11
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
    tests_green_at: "2026-06-11"
    reviewed_at: "2026-06-11"
    verdict: pass-with-fixes
    scope: "state-db foundation (adapter/migration/schema/maintenance/IT-DB-01) の正しさ・SQL injection・設計整合・scope 境界・テスト substance。Critical 0。指摘の識別子検証単一正本化・maintenance テスト・userVersion round-trip・index §9.3 整合・orphan guard を反映済。"
agent_slots:
  - role: tl
    slot_label: "TL — state-db adapter / migration / schema のレビュー (別 runtime)"
  - role: qa
    slot_label: "QA — IT-DB-01 基盤 (idempotent upsert) の観点レビュー"
generates:
  - artifact_path: src/state-db/index.ts
    artifact_type: source_module
  - artifact_path: src/state-db/migration.ts
    artifact_type: source_module
  - artifact_path: src/state-db/maintenance.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db.ts
    artifact_type: source_module
  - artifact_path: tests/state-db.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires:
    - docs/design/harness/L5-detailed-design/physical-data.md
    - docs/design/harness/L5-detailed-design/module-decomposition.md
    - docs/test-design/harness/L8-integration-test-design.md
    - docs/plans/PLAN-L5-08-harness-db-feedback.md
  references:
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - https://www.sqlite.org/fts5.html
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-45: harness.db state-db foundation

## §0 PLAN

工程表 PLAN-L7-44 の span ① (entry → G-L7DB.A)。`.ut-tdd/harness.db` の接続・migration・
全 projection table schema を実装し、`ut-tdd db status` / `ut-tdd db rebuild` を runnable にする。
凍結済 L5 設計 (physical-data §2.7 基本 7 + §9.1 拡張 10 table) の forward 実装。

## §1 Objective

- `bun:sqlite` first / Node fallback adapter (`src/state-db/index.ts`)。
- deterministic migration (`src/state-db/migration.ts`) — schema version + 全 table DDL。
- table schema の単一正本 (`src/schema/harness-db.ts`、zod + DDL 整合)。
- CLI: `db status` (schema version + freshness + orphan count) / `db rebuild` (deterministic 再構築)。

## §2 不変条件 (DbC、L5-08 / if-detail 由来)

- DB path は `.ut-tdd/` 配下に限定 (repo 外書込み禁止)。
- `rebuild` は deterministic (同入力→同 projection)。
- **secret / raw transcript / PII を schema に持たない・格納しない**。
- `db status` は secret メタデータを出力しない。

## §3 工程表 (Step + 進捗)

### Step 1: [直列] L8 IT-DB-01 を TDD Red 先行で起こす
直列理由: downstream_dependency
`tests/state-db.test.ts` に IT-DB-01 (table 作成 + idempotent upsert 基盤) の失敗テストを置く。

### Step 2: [直列] adapter + migration + schema 実装
直列理由: file_conflict (src/state-db を新規作成) + downstream_dependency (Step 1 oracle)
`bun:sqlite`/Node fallback、migration DDL、harness-db schema を実装し Red→Green。

### Step 3: [直列] CLI db status/rebuild 配線
直列理由: file_conflict (src/cli.ts) + downstream_dependency
`src/cli.ts` に `db status` / `db rebuild` を追加 (出力契約 = if-detail §)。

### Step 4: [直列] review 前置
直列理由: downstream_dependency
別 runtime `frontier-reviewer` / 不能時 `intra_runtime_subagent` で schema⇔physical-data 整合・
secret 非保存・deterministic rebuild を review し evidence に残す。

## §3.1 実装計画

- 情報源: `physical-data.md` §2.7 / §9.1 (table/PK/join key/invariant)、`module-decomposition.md`
  (state-db 責務・依存方向 = schema にのみ依存、CLI adapter を import しない)、`if-detail.md`
  (`db status/rebuild` 出力契約)、`L8-integration-test-design.md` IT-DB-01。
- adapter は `bun:sqlite` を first、不在時 Node fallback (ADR-001 cross-runtime 方針)。

## §4 DoD

- [x] IT-DB-01 基盤 green (table 作成 + idempotent upsert)。
- [x] `ut-tdd db status` / `ut-tdd db rebuild` runnable、deterministic。
- [x] schema⇔physical-data 整合、secret/PII 非格納。
- [x] 全回帰 + typecheck + lint + doctor green、review 前置 evidence。

## §6 用語更新

| term | type | definition / delta | L0 back-merge |
|---|---|---|---|
| state-db adapter | new | `.ut-tdd/harness.db` への bun:sqlite-first / Node-fallback 接続層。migration と schema 単一正本を持つ。 | not required; L7 scoped |
