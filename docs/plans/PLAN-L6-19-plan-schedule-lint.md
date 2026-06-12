---
plan_id: PLAN-L6-19-plan-schedule-lint
title: "PLAN-L6-19 (add-design): plan lint §工程表 最小強制 機能設計 (IMP-081)"
kind: add-design
layer: L6
drive: agent
status: confirmed
created: 2026-06-08
updated: 2026-06-08
owner: PM / Codex TL
agent_slots:
  - role: tl
    slot_label: "TL - §1.10.G.4 最小スライスの plan lint 設計"
generates:
  - artifact_path: docs/design/harness/L6-function-design/plan-schedule-lint.md
    artifact_type: design_doc
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires: []
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: cross_agent
    worker_model: codex:gpt-5.4
    reviewer_model: claude:pmo-sonnet
    tests_green_at: "2026-06-09T13:00:00+09:00"
    reviewed_at: "2026-06-09T13:10:23+09:00"
    verdict: approve
    scope: "G6 L6 completion final recheck; lint/typecheck/vitest/doctor green; L6 FR coverage and guardrail coverage reviewed"
---

# PLAN-L6-19 (add-design): plan lint §工程表 最小強制 (IMP-081)

## §0 位置づけ

`src/plan/lint.ts` stub により、§工程表の `[並列]/[直列]`、直列理由、review Step が機械強制されていなかった。§1.10.G.4 の最小スライスを plan lint に実装する。

## §3 工程表 (Step + 進捗)

### Step 1: [直列] schedule section parser 設計
直列理由: downstream_dependency
PLAN body から §工程表を抽出し、`### Step N:` 見出しを列挙する。

### Step 2: [直列] §G.4 analyzer 設計
直列理由: downstream_dependency
各 Step の `[並列]/[直列]`、直列理由 3 条件、review Step、§3.1 実装計画を検査する。

### Step 3: [直列] CLI / doctor 挙動設計
直列理由: downstream_dependency
`ut-tdd plan lint` は violation で fail、doctor も `planSchedule.ok` を `runDoctor.ok` に連動する hard/fail-close surface とする。

### Step 4: [直列] review
直列理由: downstream_dependency
self/pmo-sonnet review で full engine ではなく最小スライスに留まることを確認する。

## §3.1 実装計画

- 情報源: requirements §1.10.G.4、IMP-049、既存 `src/plan/lint.ts` stub。
- L7 で `analyzePlanSchedule`、`loadPlanScheduleDocs`、`planScheduleMessages` を実装する。

## §6 用語更新

新規 glossary term は追加しない。§工程表 は既存 PLAN 規約の機械強制として扱う。

## §8 DoD

- [ ] [並列]/[直列] 欠落、直列理由欠落、review Step 不在を検出する
- [x] `ut-tdd plan lint` と doctor hard/fail-close の一致を明記する
