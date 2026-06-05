---
plan_id: PLAN-L7-02-forced-stop-feedback
title: "PLAN-L7-02 (add-impl): forced-stop フィードバック実装 — src/runtime/forced-stop.ts + session-log 拡張 + ut-tdd feedback classify/pending + 単体テスト (U-FSF)"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-02
updated: 2026-06-02
owner: PM (Opus) / PO (人間)
parent_design: docs/design/harness/L6-function-design/forced-stop-feedback.md
agent_slots:
  - role: tl
    slot_label: "TL — 実装/型/fail-open/秘匿/責務分離のレビュー (claude-only は code-reviewer 代替)"
  - role: qa
    slot_label: "QA — U-FSF テスト戦略 (L7 impl 必須 role §1.8)"
generates:
  - artifact_path: src/runtime/forced-stop.ts
    artifact_type: source_module
  - artifact_path: src/runtime/session-log.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/forced-stop.test.ts
    artifact_type: test_code
  - artifact_path: .claude/hooks/session-log.ts
    artifact_type: source_module
github_issue_id: null
dependencies:
  parent: docs/plans/PLAN-L6-04-forced-stop-feedback.md
  requires:
    - docs/plans/PLAN-L6-04-forced-stop-feedback.md
  blocks: []
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-02"
    tests_green_at: "2026-06-02"
    verdict: approve
    scope: "code-reviewer APPROVE (Critical 0)。Critical/Important/Minor 是正済 (handover 2026-06-02c §5)"
---

# PLAN-L7-02 (add-impl): forced-stop フィードバック実装

## §0 位置づけ

`PLAN-L6-04-forced-stop-feedback` (add-design) の ① 機能設計 + ③ 単体テスト設計 (U-FSF-001〜005) を ② 実装 + ④ テストコードに落とす add-impl。**Add-feature 標準ライフサイクル 経路 B** の impl 段階。完了後、後段 `PLAN-REVERSE-03` で L0 concept §2.6.1 / L3 要件 / recovery 正本へ back-fill する。

- 親設計: `docs/design/harness/L6-function-design/forced-stop-feedback.md` (parent_design 必須)。
- パターン: session-log (deps 注入 + 純粋関数分離 + fail-OPEN) を踏襲・拡張。drive=fullstack (親一致)。

## §工程表

### Step 1: session-log.ts 拡張 (② 土台)
`SessionEventType` に `"forced_stop" | "user_prompt"` 追加。`safeName` を export。`SessionLogDeps` に `listDir?: (dir) => string[]` (optional、feedback ログ走査用) 追加 + `nodeDeps` に実装。既存 U-SLOG 6 test を壊さない (optional 追加のみ)。

### Step 2: src/runtime/forced-stop.ts (② 本体)
`ForcedStopEvent` / `FeedbackEntry` / `ClassifyResult` / `Classifier` / `FeedbackCtx` 型 + `detectDanglingTurn` (純関数) / `recordForcedStop` (fail-open) / `classifyFeedback` (async、失敗時 feedback 倒し) / `recordFeedback` (feedback のみ・mistake no-op・plan_id=null skip・ts idempotent・sanitize) / `pendingRecoveryProposals` (recovery_proposed && resolved_at===undefined、不正行 skip)。`emitClassifyRequest(text)` (managed pmo-haiku への prompt+schema emit、raw API なし)。

### Step 3: tests/forced-stop.test.ts (④、TDD Red→Green)
U-FSF-001〜005 を vitest 化 (③ 設計 L7-unit-test-design.md §1.6)。deps mock で I/O/now/listDir 注入、classifier mock。fail-open / 取りこぼし倒し / 秘匿 (本文非掲載・sanitize) / plan_id=null skip / idempotent / 不正行 skip を検証。

### Step 4: ut-tdd feedback サブコマンド (src/cli.ts)
`feedback classify` (--text/stdin → 既定=分類リクエスト emit / --apply <result.json> で recordFeedback) + `feedback pending` (pendingRecoveryProposals を出力、agent 起動時参照)。意味判定は managed pmo-haiku (raw API なし、CLAUDE.md 準拠)。

### Step 5: review (self-review 前置 MUST)
`code-reviewer` (TL 代替) で実装/型/fail-open/秘匿/idempotency/責務分離をレビュー。cross-agent 不在を記録。

### Step 6: 命名テスト + 全回帰 + typecheck
`npm run typecheck` (0 errors) + `npx vitest run` (U-FSF 全 pass + 既存 78 緑維持) + 自作ファイル `npx biome check --write`。

## §実装計画

| 項目 | 情報源 |
|------|--------|
| 関数 signature / DbC / pseudocode | parent_design `forced-stop-feedback.md` §2.2-§2.3 |
| session-log 拡張 (型/safeName/listDir) | 既存 `src/runtime/session-log.ts` (SessionEventType/SessionLogDeps/nodeDeps) |
| detectDanglingTurn の from 規則 | forced-stop-feedback.md §2.3 (session_end 直後 / 無ければ events[0]) |
| classifier seam (managed pmo-haiku) | CLAUDE.md「API 直叩き禁止、契約 + CLI/hook で管理」。allowlist 内 pmo-haiku |
| 秘匿 (summary/reason) | session-log `sanitize()` 再利用 |
| CLI 配線 | 既存 `src/cli.ts` commander パターン (plan/vmodel と同形) |

## §6 用語更新 (§G.9)

L6 (PLAN-L6-04) で導入した 強制停止 / dangling turn / フィードバックログ / アテンション強度 を実装語として確定 (新規語なし、L6 定義を踏襲)。

## §7 成否

- src/runtime/forced-stop.ts + session-log.ts 拡張 + src/cli.ts feedback + tests/forced-stop.test.ts 揃い、U-FSF-001〜005 全 pass
- 既存 78 テスト緑維持、typecheck 0、fail-open / 取りこぼし倒し / 秘匿 を test で実証
- code-reviewer self-review APPROVE (Critical 0)
- 後段 `PLAN-REVERSE-03-forced-stop-feedback` (fullback) で L0 concept §2.6.1 forced_stop signal / L3 要件 / recovery 正本へ back-fill へ接続

## §8 carry / self-review 反映 (code-reviewer GO-with-fixes)

**本 PLAN で解消済 (self-review 指摘)**: Critical (FeedbackEntry.plan_id を設計と整合=`string`、null は skip 不変条件) / Important (① **hook 自動配線を実装**: `scanDanglingStops` を新設し hook shim の SessionStart で発火。`prev_session_id` 依存を避け全 session 走査 + forced_stop 既存 skip で idempotent / ② CLI `--apply` の plan_id を `resolveActivePlan` で解決 / ③ `emitClassifyRequest`+`scanDanglingStops` に U-FSF-006/007 追加=孤児0) / Minor (idempotent を ts でなく内容キーへ=実運用の二重記録防止)。

**carry (G7 後の通常保守)**: managed pmo-haiku adapter の実 dispatch は CLI emit→agent→`--apply` の 2 段運用 (raw API を持たない)。`resolved_at` 更新 (Recovery 起票/却下時に entry を resolved にする) フローの CLI 化。
