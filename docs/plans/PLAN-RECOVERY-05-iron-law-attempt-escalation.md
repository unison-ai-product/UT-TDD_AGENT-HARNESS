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
  - artifact_path: src/runtime/verb-classify.ts
    artifact_type: source_module
  - artifact_path: tests/attempt-escalation.test.ts
    artifact_type: test_code
  - artifact_path: tests/verb-classify.test.ts
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
        output_digest: "sha256:8f0c3329489e7f351ddc53dd318dc57abed9e45f3f0e355381ea4fe1916999b6"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T15:54:00+09:00"
        evidence_path: tsconfig.json
        output_digest: "sha256:290e679c492d7c229373061b313ab332394da783b08c9eff85bbb81275f96afc"
      - kind: lint
        command: "bunx biome check src\\runtime\\attempt-escalation.ts tests\\attempt-escalation.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T15:54:00+09:00"
        evidence_path: src/runtime/attempt-escalation.ts
        output_digest: "sha256:f727200a8a3c7fef3ce8f2ca97db6c9fb813085deaf9fbf955b9cd8fc5761ecb"
  - reviewer: codex (cross-provider desk review)
    review_kind: cross_agent
    reviewed_at: "2026-06-23"
    tests_green_at: "2026-06-23"
    verdict: approve
    scope: "item 2 live wiring (escalation -> 直前 session surface). Codex の cross-provider desk review が設計 (Q1=C verb 正規化、Q2=b 直前 session 限定の都度再導出) を confirm。実装は self-review + tests で substantiate。code-level 発見: session-log の summarize は Bash command を保存しないため verb 分類は write 時に実施 (設計結論は維持)。green_commands digests は evidence_path の REAL sha256 (本 repo の green-command-digest gate を自ら遵守)。"
    worker_model: claude-opus-4-8
    reviewer_model: codex
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/verb-classify.test.ts tests/attempt-escalation.test.ts tests/session-log.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23"
        evidence_path: tests/verb-classify.test.ts
        output_digest: "sha256:ed2b16fe6249ce3fe92fd14abbb122d50ed2c4d6d39562d449dc2f7b8ece5e53"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23"
        evidence_path: src/runtime/verb-classify.ts
        output_digest: "sha256:ee3149813ab470a5490091f41410c3df61d5e8ee47414ab98d0a898d061c94de"
      - kind: lint
        command: "npx biome check src/runtime/verb-classify.ts src/runtime/attempt-escalation.ts src/runtime/session-log.ts src/cli.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23"
        evidence_path: src/runtime/attempt-escalation.ts
        output_digest: "sha256:f727200a8a3c7fef3ce8f2ca97db6c9fb813085deaf9fbf955b9cd8fc5761ecb"
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
    **未分類 Bash (`(bash)` 終端) は除外**して無関係コマンドの誤併合を防ぐ。
  - `selectPrecedingSessionFile(files, current)` / `renderEscalationSignals(signals)` — 直前 session
    限定の surface 用純関数 (item 2)。
- `src/runtime/verb-classify.ts` (item 2): Bash コマンドを検証 verb (vitest/tsc/doctor/lint/...) に
  分類する純関数。未分類は null = escalation 対象外。
- `src/runtime/session-log.ts` (item 2): `summarize()` の Bash 分岐を verb 分類で enrich し、
  `parseSessionEvents` / `sessionLogFile` を export。
- `src/cli.ts` (item 2、**commit は stack 待ち**): `runSessionStartSideEffects` で直前 session を都度
  再導出し escalation を stdout へ surface (`surfaceAttemptEscalationToStdout`、独立 fail-open、
  harness.db には書かない)。実装・dogfood 済 (SessionStart で escalation ブロック発火を確認) だが、
  cli.ts は Codex が同時並行で skill-injection-at-dispatch を実装中の **hot な共有ファイル衝突**ゆえ、
  本 read 側 call の commit は **Codex の cli.ts commit の上に stack** する (§4.1)。
- 設計 descent: `debugging-and-error-recovery.md` の新節「Iron Law and 3-attempt escalation」。

## 3. AC (acceptance / substance)

- `tests/attempt-escalation.test.ts` (7 ケース): 3 連続失敗で escalate / 閾値未満で非escalate /
  ok でリセット / subject 別独立 / custom threshold / 並び順 / session events 抽出。
  実証 = `bun run vitest run tests/attempt-escalation.test.ts` → 7/7 green、`tsc --noEmit` EXIT=0。

## 4. carry / 次工程 (descent / 完了の残り)

1. **live wiring (機械発火)** — 設計確定 + 実装 + dogfood 済。Codex のクロスレビュー (desk review、
   Q1=verb 正規化 / Q2=直前 session 限定の都度再導出) で設計を確定後に実装。harness.db には書かず
   (core rebuild の入力境界を広げない)、SessionStart で直前 session の jsonl を都度再導出して stdout へ
   surface する。code-level の発見: session-log の `summarize` は Bash コマンドを保存しないため、verb
   分類は write 時 (`summarize`) に実施し read 側で grouping する (設計結論は維持)。
   - **本 commit で着地**: verb-classify / attempt-escalation surface helpers / session-log の verb
     write-side / 各 test / 本 PLAN。
   - **stack 待ち (別 commit)**: cli.ts の SessionStart read 側 call。Codex が同一 cli.ts で
     skill-injection-at-dispatch を実装中で import 領域が biome reorg で絡むため、Codex の cli.ts
     commit の上に stack して着地する (相手の in-flight を absorb しない、[[feedback_commit_finished_codex_work_dont_abandon]])。
2. **confirm**: cross_agent (Codex 設計クロスレビュー) + **実 sha256 の green_command evidence** を
   記録して confirmed 維持 (fake digest を使わない)。
3. **L6 単体テスト設計の pair** (U-FSF 隣に U-ATTEMPT / U-VERB 系) を G6 pair-freeze 対象化 (残)。

## 5. 壊さない / 再発させない

- **3 回失敗したら次の修正でなく root cause / アーキを疑う** (Iron Law)。本セッションのスパイラルを
  機械シグナルで止めるのが本 PLAN。
- source は obra/superpowers の reference。skill を複製せず UT-TDD 要件から author する。
