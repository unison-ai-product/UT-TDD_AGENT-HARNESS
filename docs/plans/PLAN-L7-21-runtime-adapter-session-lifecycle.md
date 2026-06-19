---
plan_id: PLAN-L7-21-runtime-adapter-session-lifecycle
title: "PLAN-L7-21 (add-impl): runtime adapter session lifecycle and shared hook entrypoints"
kind: add-impl
layer: L7
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
parent_design: docs/design/harness/L6-function-design/session-log.md
agent_slots:
  - role: tl
    slot_label: "TL - adapter wrapper implementation review"
  - role: qa
    slot_label: "QA - U-SLOG-007 and adapter oracle coverage"
generates:
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/runtime/session-log.ts
    artifact_type: source_module
  - artifact_path: src/runtime/adapter.ts
    artifact_type: source_module
  - artifact_path: .claude/settings.json
    artifact_type: config
  - artifact_path: .claude/hooks/session-log.ts
    artifact_type: source_module
  - artifact_path: tests/runtime-hook-entrypoints.test.ts
    artifact_type: test_code
  - artifact_path: tests/runtime-adapter.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-20-runtime-adapter-session-lifecycle.md
  requires:
    - docs/plans/PLAN-L6-20-runtime-adapter-session-lifecycle.md
---

# PLAN-L7-21 (add-impl): runtime adapter session lifecycle and shared hook entrypoints

## §0 位置づけ

`PLAN-L6-20` の add-impl。shared CLI hook entrypoints と runtime adapter lifecycle wrapper を TypeScript core に実装し、Claude settings と tests を更新する。

## §1 実装差分

- `src/cli.ts` に `session start` / `session summary` / `hook post-tool-use` を追加する。
- `ut-tdd codex|claude --execute` を SessionStart / PostToolUse / Stop で包む。
- `--task-file` を追加し、task 本文を file から読む。
- Windows で Claude Code native binary を解決し、bash shim / PATH guard の不安定さを回避する。
- `.claude/settings.json` を shared CLI entrypoint へ切り替え、`.claude/hooks/session-log.ts` を shim 化する。
- `src/runtime/adapter.ts` は provider args を Codex=`exec <task>`、Claude=`--print -p <task>` にする初期契約で開始した。PLAN-L7-77 / PLAN-L7-78 以降の現在契約は Codex=`exec -`、Claude=`--print --input-format text`、prompt 本文は `AdapterPlan.stdin` に保持し、`plan_id` は provider args ではなく `AdapterPlan.plan_id` に保持する。

## §3.1 実装計画（情報源明記）

情報源:

- `PLAN-L6-20`
- `docs/design/harness/L6-function-design/session-log.md`
- `docs/test-design/harness/L7-unit-test-design.md` U-SLOG-007 / U-ADAPTER-001
- real CLI smoke: `ut-tdd codex --execute` / `ut-tdd claude --execute`

## §3 工程表

### Step 1: [直列] CLI lifecycle entrypoints

直列理由: downstream_dependency。adapter wrapper と Claude settings は shared lifecycle entrypoints に依存する。

### Step 2: [直列] adapter wrapper execution

直列理由: downstream_dependency。Step 1 の dispatch 経路を使って provider 実行を記録する。

### Step 3: [並列] Claude settings / shim migration

settings を shared CLI に切り替え、旧 hook file は shim として維持する。

### Step 4: [並列] unit tests

U-SLOG-007 と U-ADAPTER-001 の fake provider tests を追加する。

### Step 5: [直列] review

直列理由: downstream_dependency。検証 green 後に self review / cross-agent review を実施する。

## §6 用語更新

PLAN-L6-20 の用語を実装語として踏襲する。新規 glossary term は追加しない。

## §8 DoD

- [x] temp repo で shared CLI hook lifecycle が PLAN digest を作り、explicit `--plan` の digest に `session_start` / `tool_use` / `session_end` が入る。
- [x] fake Codex / fake Claude で adapter wrapper が lifecycle と raw guard env を記録する。
- [x] `--task-file` が provider task 本文に展開される。
- [x] `--plan` が provider args に混入しない。
- [x] typecheck / full vitest / doctor / review が green。
