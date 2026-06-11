---
plan_id: PLAN-L7-47-search-metrics-feedback
title: "PLAN-L7-47: harness.db search index + skill metrics + feedback engine"
kind: impl
layer: L7
drive: db
status: draft
created: 2026-06-11
updated: 2026-06-11
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — search/metrics/feedback の DbC と auto-approve 不可 invariant のレビュー (別 runtime)"
  - role: qa
    slot_label: "QA — IT-SEARCH-01 / DB-03 / FEEDBACK-01 の観点レビュー"
generates:
  - artifact_path: src/search/index.ts
    artifact_type: source
  - artifact_path: src/feedback/engine.ts
    artifact_type: source
  - artifact_path: tests/search-feedback.test.ts
    artifact_type: test
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires:
    - docs/plans/PLAN-L7-46-projection-writer.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/design/harness/L5-detailed-design/if-detail.md
    - docs/test-design/harness/L8-integration-test-design.md
  references:
    - docs/design/harness/L5-detailed-design/physical-data.md
    - https://www.sqlite.org/fts5.html
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-47: harness.db search + skill metrics + feedback

## §0 PLAN

工程表 PLAN-L7-44 の span ③ (G-L7DB.B → G-L7DB.C、④⑤と並列)。projection (span ②) の上に
検索 / skill メトリクス / フィードバック生成を実装する。設計の柱3 (フィードバック機構) の主要面。

## §1 Objective

- `findReference(query)` + `search_index` 維持 → `ut-tdd find` (ranked rows、exact ID 優先)。
- `computeSkillMetrics()` → firing/acceptance rate を `quality_signals` 格納 → `ut-tdd metrics skill`。
- `emitFeedbackEvents()` → 繰り返し finding / drift を `feedback_events` 化 → `ut-tdd feedback list`。

## §2 不変条件 (DbC)

- search は **read-only** (DB 不在は rebuild を要求、source mutate しない)。
- skill metrics: recommendation を分母に。**missing logs は finding** (fabricated success にしない)。
- feedback: **自動 event が PLAN を auto-approve しない** (replanning input であって承認でない)。
- secret / transcript body を出力・格納しない。

## §3 工程表 (Step + 進捗)

### Step 1: [直列] IT-SEARCH-01 / DB-03 / FEEDBACK-01 を TDD Red 先行
直列理由: downstream_dependency
`tests/search-feedback.test.ts` に 3 IT の失敗テスト (ranked find / firing rate / feedback 可視・
auto-approve 不可) を置く。

### Step 2: [直列] search-index + skill metrics + feedback-engine 実装
直列理由: downstream_dependency (span ② projection) + file_conflict (src/search, src/feedback 新規)
findReference / computeSkillMetrics / emitFeedbackEvents + CLI 3 本を実装し Green。

### Step 3: [直列] review 前置
直列理由: downstream_dependency
read-only / missing logs=finding / auto-approve 不可 / secret 非出力 を review し evidence 記録。

## §3.1 実装計画

- 情報源: `internal-processing.md` (findReference/computeSkillMetrics/emitFeedbackEvents DbC)、
  `if-detail.md` (`find` / `metrics skill` / `feedback list` 出力契約)、`physical-data.md`
  (search_index / quality_signals / feedback_events / skill_invocations / skill_recommendations)、
  `L8` IT-SEARCH-01 / DB-03 / FEEDBACK-01。
- search は SQLite FTS5 (rebuildable external/contentless index、authoring source ではない)。

## §4 DoD

- [ ] IT-SEARCH-01 / DB-03 / FEEDBACK-01 green。
- [ ] `find` / `metrics skill` / `feedback list` runnable、不変条件維持。
- [ ] 全回帰 + doctor green、review 前置 evidence。

## §6 用語更新

| term | type | definition / delta | L0 back-merge |
|---|---|---|---|
| feedback engine | new | open findings / quality signals を `feedback_events` (replanning input) へ変換する層。PLAN を auto-approve しない。 | not required; L7 scoped |
