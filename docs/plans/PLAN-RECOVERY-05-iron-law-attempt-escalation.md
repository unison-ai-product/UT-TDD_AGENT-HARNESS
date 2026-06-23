---
plan_id: PLAN-RECOVERY-05-iron-law-attempt-escalation
title: "PLAN-RECOVERY-05 (recovery): Iron Law + 3-attempt escalation を Recovery/troubleshoot 駆動へ機械化"
kind: recovery
layer: cross
drive: fullstack
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: PM (Opus) / PO (人間)
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: aim
    slot_label: "AIM - recovery attempt escalation"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-05-iron-law-attempt-escalation.md
    artifact_type: markdown_doc
  - artifact_path: docs/skills/debugging-and-error-recovery.md
    artifact_type: design_doc
  - artifact_path: src/runtime/attempt-escalation.ts
    artifact_type: source_module
  - artifact_path: tests/attempt-escalation.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires:
    - PLAN-L7-02-forced-stop-feedback
    - PLAN-L7-110-takeover-feedback-surface
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T15:55:00+09:00"
    tests_green_at: "2026-06-23T15:54:00+09:00"
    verdict: approve
    scope: "Iron Law 3-attempt escalation pure runtime helper, Recovery PLAN, and targeted tests."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\attempt-escalation.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T15:54:00+09:00"
        evidence_path: tests/attempt-escalation.test.ts
        output_digest: "sha256:57441128bc568377bc888ffe6caba7a74b431ee0ca28c386485a85cea821f9ba"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T15:54:00+09:00"
        evidence_path: tsconfig.json
        output_digest: "sha256:56779b596caffacac585215fe4d199022242cd6e02a54544ff54049564c5db03"
      - kind: lint
        command: "bunx biome check src\\runtime\\attempt-escalation.ts tests\\attempt-escalation.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T15:54:00+09:00"
        evidence_path: src/runtime/attempt-escalation.ts
        output_digest: "sha256:acc7b8544ce71bd365b51eb171c891fcfc1a736a97fddc8845b8d0a53ca56d5b"
---

# PLAN-RECOVERY-05 (recovery): Iron Law + 3-attempt escalation

## 0. Objective (PO 承認 2026-06-23、obra/superpowers 評価の採用)

obra/superpowers の `systematic-debugging` を**評価し、skill を複製せず**、その中核規律を
UT-TDD の Recovery/troubleshoot 駆動の要件から author して取り込む
([[feedback_migration_is_requirements_driven]]、source は reference-only)。

採用した中核 2 点 (既存 Recovery skill に欠けていた差分):

1. **Iron Law** — 根本原因の調査を「修正の前段ゲート」にする (既存は anti-pattern 止まり)。
2. **3-attempt architectural escalation** — 同一 subject が 3 回連続失敗したら STOP し、
   症状追いのスパイラルを止めて root cause / アーキを疑う。

## 1. Gap (なぜ必要か)

本セッション (2026-06-23) の引き継ぎ失敗が実例: 共有 working tree を繰り返し計測し、変動する
テスト件数を都度の修正で追い、他ランタイムに帰責した (guess-and-check スパイラル)。既存
`debugging-and-error-recovery.md` には reproduce/root-cause はあるが、**3 回失敗で止める hard stop が
無かった**。

## 2. 実装 (本 PLAN で着地済)

- `src/runtime/attempt-escalation.ts`:
  - `evaluateAttemptEscalation(attempts, {threshold=3})` — 純関数。subject 別の直近連続失敗数を
    数え (ok でリセット)、threshold 以上で STOP signal を失敗数降順で返す。
  - `attemptsFromSessionEvents(events)` — session 生ログの tool_use(error/ok) から attempt 列を抽出。
- 設計 descent: `debugging-and-error-recovery.md` の新節「Iron Law and 3-attempt escalation」。

## 3. AC (acceptance / substance)

- `tests/attempt-escalation.test.ts` (7 ケース): 3 連続失敗で escalate / 閾値未満で非escalate /
  ok でリセット / subject 別独立 / custom threshold / 並び順 / session events 抽出。
  実証 = `bun run vitest run tests/attempt-escalation.test.ts` → 7/7 green、`tsc --noEmit` EXIT=0。

## 4. carry / 次工程 (descent / 完了の残り)

1. **live wiring (機械発火)**: `evaluateAttemptEscalation` の出力を `findings` へ emit し、PLAN-L7-110 の
   takeover surface 経由で次 session に届ける。emission 点 (session summary / forced-stop 隣接) は現在
   Codex が hot に触れている領域ゆえ、衝突回避のため coordinated に着手する ([[feedback_commit_finished_codex_work_dont_abandon]])。
2. **confirm**: intra_runtime_subagent レビュー + **実 sha256 の green_command evidence** を記録して
   confirmed 化 (fake digest を使わない)。draft の間は merged-plan-status が 1 件出る (想定内)。
3. **L6 単体テスト設計の pair** (U-FSF 隣に U-ATTEMPT 系) を G6 pair-freeze 対象化。

## 5. 壊さない / 再発させない

- **3 回失敗したら次の修正でなく root cause / アーキを疑う** (Iron Law)。本セッションのスパイラルを
  機械シグナルで止めるのが本 PLAN。
- source は obra/superpowers の reference。skill を複製せず UT-TDD 要件から author する。
