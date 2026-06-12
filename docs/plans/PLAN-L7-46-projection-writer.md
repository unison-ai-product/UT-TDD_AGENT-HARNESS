---
plan_id: PLAN-L7-46-projection-writer
title: "PLAN-L7-46: harness.db projection-writer (record + rebuild projections)"
kind: impl
layer: L7
drive: db
parent_design: docs/design/harness/L6-function-design/function-spec.md
status: confirmed
created: 2026-06-11
updated: 2026-06-11
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: gpt-5.4
    reviewer_model: gpt-5.3-codex
    tests_green_at: "2026-06-11"
    reviewed_at: "2026-06-11"
    verdict: pass-with-fixes
    scope: "projection-writer span: recordProjectionEvent/rebuildHarnessDb idempotency, source read-only projection, unresolved joins as findings, and Phase3 output projection."
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — projection-writer / rebuild / source 非改変 invariant のレビュー (別 runtime)"
  - role: qa
    slot_label: "QA — IT-DB-01/02 (projection + join) の観点レビュー"
generates:
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires:
    - docs/plans/PLAN-L7-45-harness-db-foundation.md
    - docs/design/harness/L5-detailed-design/physical-data.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/test-design/harness/L8-integration-test-design.md
  references:
    - docs/design/harness/L5-detailed-design/module-decomposition.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-46: harness.db projection-writer

## §0 PLAN

工程表 PLAN-L7-44 の span ② (G-L7DB.A → G-L7DB.B)。state-db foundation (span ①) の上に、
docs/state/logs を harness.db の projection 行へ変換する writer を実装する。**既存 Phase 3
出力 (relation-graph / doc-export / MCP profile) の projection 配線もここに含む** (ロジックは
Phase 3 実装済、本 span は DB への射影のみ)。

## §1 Objective

- `recordProjectionEvent(event)` — normalized event → projection row (ID で queryable)。
- `rebuildHarnessDb(repoRoot)` — plan_registry / artifact_registry / model_runs / trace_edges /
  coverage / findings / gate_runs / drive_runs / hook_events を deterministic 再構築。
- 既存 relation-graph / document-export / verification-profile の出力を対応 projection table へ射影。

## §2 不変条件 (DbC、internal-processing 由来)

- **source doc を書き換えない** (projection は読み取り射影)。
- idempotent upsert (同 event 二重適用で行が重複しない、ID 安定)。
- secret / raw transcript / PII を格納しない。
- 未解消 join (例: plan_id 不在の model_run) は finding として可視化 (黙殺しない)。

## §3 工程表 (Step + 進捗)

### Step 1: [直列] IT-DB-01/02 を TDD Red 先行
直列理由: downstream_dependency
`tests/projection-writer.test.ts` に IT-DB-01 (idempotent upsert) + IT-DB-02 (cross-drive join /
未解消 join = finding) の失敗テストを置く。

### Step 2: [直列] projection-writer 実装
直列理由: downstream_dependency (span ① schema) + file_conflict (src/state-db/projection-writer.ts)
recordProjectionEvent / rebuildHarnessDb + 既存 graph/export/MCP 出力の射影を実装し Green。

### Step 3: [直列] review 前置
直列理由: downstream_dependency
source 非改変 / idempotency / secret 非格納 / 未解消 join = finding を review し evidence 記録。

## §3.1 実装計画

- 情報源: `physical-data.md` §2.7/§9.1 (projection table + join key)、`internal-processing.md`
  (recordProjectionEvent / rebuildHarnessDb の processing flow + DbC)、`L8` IT-DB-01/02。
- 既存射影元: `src/lint/relation-graph.ts` (graph_nodes/dependency_edges 等)、`src/export/document-export.ts`
  (document_export_* projection rows)、`src/lint/verification-profile.ts` (mcp/verification rows)。

## §4 DoD

- [x] IT-DB-01/02 green。
- [x] rebuild deterministic、idempotent upsert、source 非改変。
- [x] 既存 graph/export/MCP 出力が対応 table へ射影される。
- [x] 全回帰 + doctor green、review 前置 evidence。

## §6 用語更新

| term | type | definition / delta | L0 back-merge |
|---|---|---|---|
| projection-writer | new | docs/state/logs と既存 lint 出力を harness.db の projection 行へ idempotent 射影する層。source を mutate しない。 | not required; L7 scoped |
