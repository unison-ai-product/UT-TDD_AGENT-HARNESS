---
plan_id: PLAN-L7-17-handover-quality
title: "PLAN-L7-17 (add-impl): handover 機構 品質増分の実装 — checkHandoverBypass/generated_by/doc_entry_count + activePlanStale/headCommit + scopeToSession/latestSessionId + readPlanMeta family 解決 (IMP-078 5 gap)"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-08
updated: 2026-06-08
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — checkHandoverBypass の純判定 (pointer 不在/署名欠落/entry mismatch) / current-plan 2 行目 updated_at の resolveActivePlan 後方互換 / headCommit 未供給時の旧挙動維持 / session scope fallback が空 handover を避けること / Stop hook 配線が fail-open を壊さないことのレビュー (claude-only は code-reviewer/pmo-sonnet 代替)"
  - role: qa
    slot_label: "QA — U-SLOG-006 (stale/commit hash) + U-HOVER-011 (bypass) + U-HOVER-012 (session scope/family 解決) が 5 gap を被覆 / 既存 U-HOVER-001〜010・U-SLOG-001〜005 後方互換を破らないこと"
generates:
  - artifact_path: src/handover/index.ts
    artifact_type: source_module
  - artifact_path: src/runtime/session-log.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/handover.test.ts
    artifact_type: test_code
  - artifact_path: tests/session-log.test.ts
    artifact_type: test_code
  - artifact_path: .claude/hooks/session-log.ts
    artifact_type: source_module
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
github_issue_id: null
dependencies:
  parent: docs/plans/PLAN-L6-16-handover-quality.md
  requires: []
  blocks: []
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-08"
    tests_green_at: "2026-06-08"
    verdict: pass
    scope: "handover 品質増分実装 (checkHandoverBypass/generated_by/doc_entry_count + activePlanStale/headCommit + scopeToSession/latestSessionId + readPlanMeta family 解決 + Stop hook 配線) のレビュー。後方互換 (U-HOVER-001〜010/U-SLOG-001〜005 全 green) + fail-open 維持を確認。typecheck 0 / vitest green 後に review。pmo-sonnet 確定 (code-reviewer は IMP-009 truncate)。claude-only TL/QA 代替"
---

# PLAN-L7-17 (add-impl): handover 機構 品質増分の実装 (IMP-078)

## §0 位置づけ

PLAN-L6-16 の機能設計を実装する add-impl。5 gap を `src/handover/index.ts` + `src/runtime/session-log.ts` + `src/cli.ts` + `.claude/hooks/session-log.ts` へ実装し、`tests/handover.test.ts` (U-HOVER-011〜012) + `tests/session-log.test.ts` (U-SLOG-006) で被覆。back-fill pairing (add-impl → Reverse 合流) は PLAN-REVERSE-16。

## §工程表

### Step 1: [直列] session-log: active-plan stale (gap②) + commit hash 捕捉 (gap③)
- 直列理由 = **file_conflict** (session-log.ts を書く)。setActivePlan 2 行目 updated_at + activePlanUpdatedAt/activePlanStale + headCommit dep + onPostToolUse commit target。nodeDeps に gitHead。

### Step 2: [直列] handover: bypass 検知 (gap①) + session scope (gap④) + family 解決 (gap⑤)
- 直列理由 = **file_conflict + downstream_dependency** (handover/index.ts を書き、Step 1 の activePlanStale を使う)。generated_by/doc_entry_count + checkHandoverBypass + scopeToSession/latestSessionId + readPlanMeta family 解決 + checkHandoverDiscipline に stale surface。

### Step 3: [直列] CLI + hook 配線
- 直列理由 = **downstream_dependency**。cli.ts に --scope-session/--session + latestSessionId、hook に gitHead + checkHandoverBypass surface。

### Step 4: [直列] tests + 全回帰
- 直列理由 = **downstream_dependency**。U-SLOG-006 + U-HOVER-011〜012 + 既存全 green + typecheck 0。

### Step 5: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。pmo-sonnet で後方互換・fail-open・bypass 検知をレビュー。通過後 review_evidence 記録 + confirmed flip + REVERSE-16 で back-fill。

## §実装計画

- **src/runtime/session-log.ts** (情報源: 既存 resolveActivePlan/onPostToolUse + L6-16 §2.7 gap②③): activePlanStale/headCommit。
- **src/handover/index.ts** (情報源: 既存 checkHandoverDiscipline/resolveHandoverScope/readPlanMeta + L6-16 §2.7 gap①④⑤): checkHandoverBypass/scopeToSession/latestSessionId/family 解決。
- **src/cli.ts** (情報源: 既存 handover command): --scope-session/--session。
- **.claude/hooks/session-log.ts** (情報源: 既存 Stop hook): gitHead + checkHandoverBypass surface。
- **tests/{handover,session-log}.test.ts** (情報源: 既存 U-HOVER/U-SLOG pattern): U-HOVER-011〜012 + U-SLOG-006。

## §6 用語更新

> L6-16 §6 (handover bypass 検知 / active-plan marker stale) を踏襲。新規語の追加なし (impl は L6-16 の語を実装)。

## §8 DoD

- [x] 5 gap を src/handover + src/runtime/session-log + src/cli + hook へ実装
- [x] U-SLOG-006 + U-HOVER-011〜012 + 既存全回帰 green / typecheck 0
- [x] review 前置 (pmo-sonnet) → 通過後 review_evidence 記録 + confirmed flip
- [x] PLAN-REVERSE-16 で back-fill pairing (add-impl → Reverse 合流)
