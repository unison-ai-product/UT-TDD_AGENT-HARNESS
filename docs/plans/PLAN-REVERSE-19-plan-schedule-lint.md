---
plan_id: PLAN-REVERSE-19-plan-schedule-lint
title: "PLAN-REVERSE-19 (reverse): plan lint §工程表 最小強制の back-fill (IMP-081)"
kind: reverse
layer: cross
drive: agent
status: confirmed
created: 2026-06-08
updated: 2026-06-08
owner: PM / Codex TL
workflow_phase: R4
forward_routing: gap-only
promotion_strategy: reuse-as-is
confirmed_reverse_type: design
agent_slots:
  - role: tl
    slot_label: "TL - §工程表 lint 実装をテスト設計と governance carry へ戻す"
generates:
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-20-plan-schedule-lint.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:58:00+09:00"
    reviewed_at: "2026-06-09T17:00:00+09:00"
    verdict: approve
    scope: "Plan-schedule lint reverse back-fill reviewed after lint/typecheck/vitest/doctor green; no additional runtime change."
---

# PLAN-REVERSE-19 (reverse): plan lint §工程表 最小強制 back-fill (IMP-081)

## §0 位置づけ

PLAN-L7-20 の add-impl を上流へ戻し、U-PLANSCH oracle と full engine carry を L7 unit test design / governance に trace する。

## §3 工程表 (Step + 進捗)

### Step 1: [直列] L7-unit test design back-fill
直列理由: file_conflict
U-PLANSCH oracle を L7 unit test design へ反映する。

### Step 2: [直列] full engine carry 整理
直列理由: downstream_dependency
§1.10 全強制は今回スコープ外として後続 carry に残す。

### Step 3: [直列] review
直列理由: downstream_dependency
self/pmo-sonnet review で add-impl -> reverse pairing と back-fill 範囲を確認する。

## §3.1 実装計画

- 情報源: PLAN-L7-20、`tests/plan-lint.test.ts`、`docs/improvement-backlog.md` IMP-081。
- 本 Reverse は runtime 実装を追加しない。

## §6 用語更新

新規 glossary term は追加しない。

## §8 DoD

- [x] PLAN-L7-20 を dependencies.requires に持つ
- [x] U-PLANSCH が L7 unit test design に trace されている
