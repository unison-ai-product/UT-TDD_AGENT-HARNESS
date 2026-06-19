---
plan_id: PLAN-L6-20-runtime-adapter-session-lifecycle
title: "PLAN-L6-20 (add-design): runtime adapter session lifecycle and shared hook entrypoints"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
review_evidence:
  - reviewer: claude-pmo-sonnet
    review_kind: cross_agent
    reviewed_at: "2026-06-09T10:57:49+09:00"
    tests_green_at: "2026-06-09T10:55:36+09:00"
    verdict: approve
    worker_model: codex-gpt-5
    reviewer_model: claude-pmo-sonnet
    scope: "PLAN-L6-20/L7-21/REVERSE-20 runtime adapter lifecycle; Critical/High/Important 0 after follow-up review."
agent_slots:
  - role: tl
    slot_label: "TL - shared CLI hook and adapter wrapper design"
generates:
  - artifact_path: docs/design/harness/L6-function-design/session-log.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: docs/plans/PLAN-L6-03-session-log.md
  requires:
    - docs/plans/PLAN-L6-03-session-log.md
---

# PLAN-L6-20 (add-design): runtime adapter session lifecycle and shared hook entrypoints

## §0 位置づけ

`PLAN-L6-03-session-log` の追補 add-design。session-log の hook 実体を `.claude/hooks/session-log.ts` 直接実装から package-local `src/cli.ts` entrypoint に寄せ、`ut-tdd codex|claude --execute` も同じ session lifecycle を記録する。

今回の変更は既存 session-log / handover / forced-stop の設計を置換しない。hook と runtime adapter の入口を共有化し、search cost と drift を下げるための小さな L6 増分である。

## §1 設計差分

- `.claude/settings.json` は SessionStart / PostToolUse / Stop で `src/cli.ts` の `session start` / `hook post-tool-use` / `session summary` を呼ぶ。
- `.claude/hooks/session-log.ts` は後方互換 shim とし、canonical 実装は `src/cli.ts` に集約する。
- `SessionHookInput.plan_id` を許容し、adapter wrapper が明示 PLAN を digest に渡せるようにする。
- `ut-tdd codex|claude --execute` は provider 起動前後に SessionStart / PostToolUse / Stop を記録し、handover warnings を surface する。
- `--task-file` を追加し、Windows ARG_MAX 回避を provider 非依存の adapter contract にする。
- `--plan` は harness metadata として保持し、provider CLI には `--plan-id` を渡さない。初期実装は Codex=`codex exec <task>`、Claude=`claude --print -p <task>` だったが、PLAN-L7-77 / PLAN-L7-78 で prompt 本文は両 provider とも stdin へ移した。
- Superseded by PLAN-L7-68: provider execution no longer emits legacy raw-wrapper env names. Native provider resolution and `UT_TDD_CODEX_BIN` / `UT_TDD_CLAUDE_BIN` are the supported execution path.

## §3.1 実装計画（情報源明記）

情報源:

- `docs/design/harness/L6-function-design/session-log.md`
- `docs/design/harness/L4-basic-design/function.md`
- `docs/test-design/harness/L7-unit-test-design.md`
- `src/runtime/session-log.ts`
- `src/runtime/adapter.ts`

実装先:

- `src/cli.ts`
- `src/runtime/session-log.ts`
- `src/runtime/adapter.ts`
- `.claude/settings.json`
- `.claude/hooks/session-log.ts`
- `tests/runtime-hook-entrypoints.test.ts`
- `tests/runtime-adapter.test.ts`

## §3 工程表

### Step 1: [並列] L6 design trace 更新

`session-log.md` と `function.md` に shared CLI hook / adapter wrapper / provider args の設計差分を反映する。

### Step 2: [並列] L7 test design 更新

`L7-unit-test-design.md` に U-SLOG-007 と U-ADAPTER oracle を追加し、設計とテスト設計の孤児を作らない。

### Step 3: [直列] shared CLI hook entrypoints 実装

直列理由: downstream_dependency。adapter wrapper は shared CLI の `readHookInput` / lifecycle dispatch を前提にする。

### Step 4: [直列] runtime adapter wrapper 実装

直列理由: downstream_dependency。Step 3 の lifecycle dispatch を使って provider 実行前後の session evidence を記録する。

### Step 5: [並列] tests / docs adapters 更新

runtime hook entrypoint tests、runtime adapter tests、agent guard / rule drift tests を更新する。

### Step 6: [直列] review

直列理由: downstream_dependency。typecheck / vitest / doctor が green になった後、self review と cross-agent review で freeze 可能性を確認する。

## §6 用語更新

- shared hook entrypoint: Claude hook から package-local `src/cli.ts` を呼び、session-log core を共有する入口。
- adapter lifecycle wrapper: `ut-tdd codex|claude --execute` が provider 実行を SessionStart / PostToolUse / Stop で包む機構。
- plan metadata separation: `--plan` を provider 引数ではなく harness/session-log の plan_id として使う規約。

## §8 DoD

- [x] L6 design と L7 unit test design に U-SLOG-007 / U-ADAPTER 変更が反映されている。
- [x] shared CLI hook entrypoints が temp repo で PLAN digest を生成し、explicit `--plan` では `session_start` / `tool_use` / `session_end` を同一 plan_id に集計する。
- [x] Codex / Claude adapter wrapper records lifecycle. PLAN-L7-68 supersedes the earlier raw-guard-env behavior and strips legacy wrapper env names from provider execution.
- [x] provider CLI に `--plan-id` を渡さない。
- [x] typecheck / full vitest / doctor / review が green。
