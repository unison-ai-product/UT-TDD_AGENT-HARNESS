---
plan_id: PLAN-L7-04-handover-mechanism
title: "PLAN-L7-04 (add-impl): handover 記録機構の実装 — src/handover + ut-tdd handover / plan use CLI + session-log 限定 amendment (current-plan 活性化) + U-HOVER ④"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-04
updated: 2026-06-04
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 関数実装の DbC 充足 / 二層 (CURRENT.json vs md) 境界 / 循環 import 回避 (current-plan writer の配置) / dry-run 非破壊のレビュー (claude-only は code-reviewer 代替)"
  - role: qa
    slot_label: "QA — U-HOVER-001〜007 ④ テストコードが ③ 設計を漏れなく被覆 / Red→Green / 境界・非破壊・sanitize の oracle 実装"
generates:
  - artifact_path: src/handover/index.ts
    artifact_type: source_module
  - artifact_path: tests/handover.test.ts
    artifact_type: test_code
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/runtime/session-log.ts
    artifact_type: source_module
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
github_issue_id: null
dependencies:
  parent: docs/plans/PLAN-L6-06-handover-mechanism.md
  requires: []
  blocks: []
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-04"
    tests_green_at: "2026-06-04"
    verdict: approve
    scope: "code-reviewer 全6周 APPROVE。循環 import 回避 / dry-run 非破壊 / sanitize 確認 (handover 2026-06-04)"
---

# PLAN-L7-04 (add-impl): handover 記録機構の実装

## §0 位置づけ

`PLAN-L6-06-handover-mechanism` (add-design ①③) が確定した設計を実装する add-impl。先行 add-impl (`PLAN-L7-01-session-log` / `PLAN-L7-03-setup-solo-team`) と同型 — U-HOVER を先行 ④ テストコード化 (Red) → `src/handover/index.ts` (②) を Green → CLI (`ut-tdd handover` / `ut-tdd plan use`) 配線 → session-log 限定 amendment (Gap B 活性化)。

- 親: `PLAN-L6-06-handover-mechanism` (drive=fullstack 一致)。
- 駆動モデル: **Add-feature** (bottom-up build。後段 `PLAN-REVERSE-05` で上位整合 back-fill)。

## §1 実装する契約 (L6 §2.3 の 9 関数 + session-log amendment)

`src/handover/index.ts` に `resolveHandoverScope` / `buildPointer` / `scaffoldFromDigests` / `renderHandoverScaffold` / `handoverStale` / `writePointer` / `runHandover` を実装 (設計 §2.2 型 + §2.3 DbC 準拠)。`HandoverDeps` は `src/setup` の `SetupDeps` / `src/runtime/session-log` の `SessionLogDeps` と同型注入 (repoRoot / now / readText / writeText / listDir)。`sanitize` は session-log から import 再利用 (新規実装しない)。

### §1.1 実装上の精緻化 (循環 import 回避)

設計 §2.3 は `setActivePlan` / `inferPlanFromCommit` を handover の関数として論理グルーピングしたが、両者は **current-plan (= session-log が `resolveActivePlan` で読む state)** を対象とし、**session-log の `onPostToolUse` から呼ばれる**。session-log が handover を import すると循環するため、**実装は `src/runtime/session-log.ts` に置き (current-plan は session-log の責務)、handover は import して再利用**する。設計の二層責務・DbC は不変 (配置のみの精緻化)。

### §1.2 session-log 限定 amendment (Gap B 配線)

`src/runtime/session-log.ts`:
- `setActivePlan(planId, deps)` / `inferPlanFromCommit(message)` を追加 (設計 §2.3 DbC)。
- `onPostToolUse` の `isCommit` 経路で `inferPlanFromCommit(command)` が非 null なら `setActivePlan` で current-plan 更新 (best-effort / fail-open、`-F -` heredoc は no-op)。
- `resolveActivePlan` 本体・既存 U-SLOG-001〜005 の挙動は不変。

## §工程表

### Step 1: ④ テストコード (Red 先行)
`tests/handover.test.ts` に U-HOVER-001〜007 を in-memory mock deps (now 固定で決定論、`tests/setup.test.ts` パターン) で実装。setActivePlan/inferPlanFromCommit は session-log import で round-trip 検証。未実装ゆえ Red。

### Step 2: ② 実装 (Green)
`src/handover/index.ts` + session-log amendment を実装し U-HOVER を Green に。`npx vitest run tests/handover.test.ts`。

### Step 3: CLI 配線
`src/cli.ts` に `ut-tdd handover [--dry-run] [--complete] [--plan <id>]` と `ut-tdd plan use <id>` を追加 (setup/feedback コマンドのパターン踏襲)。`ut-tdd plan use --clear` で current-plan clear。

### Step 4: review (review 前置 MUST)
claude-only のため `code-reviewer` (TL/QA 代替) で DbC 充足 / 循環 import 回避の妥当性 / dry-run 非破壊 / sanitize defense-in-depth / 既存 session-log 非回帰をレビュー。cross-agent 不在を evidence 記録。

### Step 5: 全回帰 + CLI スモーク
`npx vitest run` (既存 92 + U-HOVER) + `bun src/cli.ts handover --dry-run` / `bun src/cli.ts plan use <id>` スモーク。

## §実装計画

| 項目 | 情報源 |
|------|--------|
| 9 関数の signature / DbC / 型 | `docs/design/harness/L6-function-design/handover-mechanism.md` §2.2-§2.3 |
| U-HOVER-001〜007 oracle | `docs/test-design/harness/L7-unit-test-design.md` §1.8 |
| deps 注入 / nodeDeps / in-memory mock | `src/setup/index.ts` (nodeSetupDeps) + `tests/setup.test.ts` (mockDeps) |
| sanitize / PlanDigest 型 / resolveActivePlan / onPostToolUse | `src/runtime/session-log.ts` (import 再利用 + amendment) |
| CLI subcommand パターン | `src/cli.ts` (setup / feedback の commander 配線) |
| current-plan の配置 (循環回避) | §1.1 (session-log が current-plan の owner) |

## §6 用語更新 (§G.9)

L6-06 §6 で宣言済の 4 用語 (handover 機械ポインタ / handover scaffold / plan_id 活性化 / handover stale) を実装が materialize。新規用語の追加なし (impl PLAN は L6 用語を実体化するのみ)。L0 §10 back-merge は後段 Reverse。

## §7 成否

- U-HOVER-001〜007 が ④ テストで Green (孤児 0、③ 設計被覆)
- 全回帰 pass (既存 92 を壊さない = session-log amendment が非回帰)
- code-reviewer review APPROVE (Critical 0、特に 循環 import 回避 / dry-run 非破壊 / sanitize / 既存 session-log 非回帰)
- CLI スモーク (`handover --dry-run` 非破壊 / `plan use` round-trip) OK
- 後段 `PLAN-REVERSE-05-handover-mechanism` で §6.8.5/§6.8.6 詳細 + 要件 CURRENT.md→.json 同期 + L4 整合 + L0 §10 用語 back-fill
