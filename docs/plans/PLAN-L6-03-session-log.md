---
plan_id: PLAN-L6-03-session-log
title: "PLAN-L6-03 (add-design): session-log 機能設計 — セッションログ hook + PLAN 単位ダイジェスト圧縮 (関数 signature + DbC + ③ 単体テスト設計)"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-02
updated: 2026-06-02
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 関数 signature / DbC / 圧縮契約 / fail-open 方針のレビュー (claude-only は code-reviewer 代替)"
generates:
  - artifact_path: docs/design/harness/L6-function-design/session-log.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
github_issue_id: null
dependencies:
  parent: docs/plans/PLAN-L6-01-function-spec.md
  requires: []
  blocks: []
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

# PLAN-L6-03 (add-design): session-log 機能設計

## §0 位置づけ

既存 harness (agent-guard hook + `src/runtime/`) に **セッションログ機能**を **Add-feature (経路3)** として足す設計差分。`kind=add-design` (L6 機能設計粒度) で関数 signature + DbC + 圧縮契約 + ③ 単体テスト設計を確定し、`PLAN-L7-01-session-log` (add-impl) が実装する。**bottom-up build → 後段 Reverse (R0-R4) で L3 要件定義側へ設計修正**する方針 (PO 2026-06-02)。

- 正本機能: 要件定義書 §6.8 PLAN git ライフサイクル (Issue 起点スパイン) / §6.9 CI 起動単位。本 PLAN はその **ローカル観測側 (session→PLAN ダイジェスト)** を実装する機能設計。
- 親設計: `PLAN-L6-01-function-spec` (§1.2 runtime に agent-guard。session-log はその兄弟 runtime hook)。
- 駆動モデル: **Add-feature** (`feature_addition` signal)。drive=fullstack (親一致)。

## §1 要求 (この機能が満たすこと)

1. **記載**: Claude Code セッション中の生イベント (tool 実行 / 編集 / Bash / commit) を hook で append-only に逐次記録し、各イベントに **active PLAN を tag** する。
2. **プラン単位で圧縮**: PLAN 区切り (セッション終了 / PLAN 切替 / 完了) で、その PLAN 分の生イベントを **1 ダイジェスト**に要約 (何をしたか・触ったファイル・commit・主な判断/失敗・件数) して畳む。生ログ = ephemeral、PLAN ダイジェスト = durable。
3. **fail-OPEN**: ログ失敗で作業を止めない (guard と逆。常に exit 0)。
4. handover (`.ut-tdd/handover/`) / 失敗→仕組みループ (§8.6) / audit への接続点を提供する。

## §2 機能設計 (L6 粒度、generates: session-log.md に詳細)

### §2.1 イベント schema (D-CONTRACT 縮退)

```text
SessionEvent = {
  ts: string (ISO8601, hook 受領時に付与),
  session_id: string,
  plan_id: string | null,          # resolveActivePlan() の結果
  event_type: "session_start" | "tool_use" | "commit" | "plan_switch" | "session_end",
  tool?: string,                   # PostToolUse 時 (Edit/Write/Bash 等)
  target?: string,                 # 編集 path / コマンド要約 (秘匿: 値は載せない)
  outcome?: "ok" | "error",
}
PlanDigest = {
  plan_id: string,
  sessions: string[],              # 寄与した session_id
  event_counts: Record<event_type, number>,
  files_touched: string[],
  commits: string[],               # commit hash (取得可能時)
  failures: { ts, summary }[],
  updated_at: string,
}
```

### §2.2 関数 signature (src/runtime/session-log.ts、§1.2 runtime に追加)

| 関数 | signature | DbC |
|------|-----------|-----|
| `resolveActivePlan` | `(repoRoot: string) => string \| null` | state ファイル (`.ut-tdd/state/current-plan`) 優先、無ければ branch 名 (`add/<plan>` 等) から解決。解決不能は null (throw しない) |
| `recordEvent` | `(input: SessionHookInput, deps: SessionLogDeps) => void` | **never throws (fail-open)**。`.ut-tdd/logs/session/<session_id>.jsonl` へ 1 行 append。I/O 失敗は握りつぶす |
| `compressPlanDigest` | `(events: SessionEvent[], planId: string, prev?: PlanDigest) => PlanDigest` | **純関数** (I/O 無し)。同一 (plan, session) の再適用で idempotent。prev とマージ (PLAN は複数 session を跨ぐ) |
| `onSessionStart` / `onPostToolUse` / `onStop` | `(input, deps) => number` | hook handler。常に 0 を返す (fail-open)。onStop が compressPlanDigest を呼び `.ut-tdd/logs/plan/<plan_id>.digest.json` を更新 |

### §2.3 ストレージ / 配置

- 生: `.ut-tdd/logs/session/<session_id>.jsonl` (gitignored)
- 圧縮: `.ut-tdd/logs/plan/<plan_id>.digest.json` (gitignored、durable な per-PLAN 記録)
- hook 実体: `.claude/hooks/session-log.ts` (bun, 環境非依存, agent-guard パターン)。判定/圧縮本体 = `src/runtime/session-log.ts`
- `.gitignore` に `.ut-tdd/logs/` を追加

### §2.4 fail-open 設計 (guard との対比)

agent-guard は fail-CLOSE (`blockOnFailure: true`、block=exit 2)。session-log は **fail-OPEN**: stdin 読取失敗 / JSON 解析失敗 / I/O 失敗 すべてで **exit 0** (warn を stderr に出すのみ)。ログがワークフローを止めてはならない。`.claude/settings.json` の当該 hook は `blockOnFailure` を付けない。

## §3 ③ 単体テスト設計 (generates: L7-unit-test-design.md、pair G7)

| U-ID | 対象 | DoD |
|------|------|-----|
| U-SLOG-001 | `resolveActivePlan` | state ファイル優先 / branch fallback / 解決不能=null |
| U-SLOG-002 | `recordEvent` | 正常 append / **不正入力でも throw せず exit 0 (fail-open)** |
| U-SLOG-003 | `compressPlanDigest` | events→digest 集計正当 / 同一 session 再適用で idempotent / prev マージ |
| U-SLOG-004 | `onStop` | session 終了で plan digest が生成/更新される |

## §工程表

### Step 1: 機能設計 doc 起草
`docs/design/harness/L6-function-design/session-log.md` に §2 の関数 signature + DbC + 圧縮契約 + ストレージ + fail-open 方針を記述。function-spec.md §1.2 runtime 表に session-log 行を参照追記。

### Step 2: ③ 単体テスト設計
`docs/test-design/harness/L7-unit-test-design.md` に §3 の U-SLOG-001..004 を追記 (① 設計とペア)。

### Step 3: review (self-review 前置 MUST)
claude-only のため `code-reviewer` (Senior Staff、TL 代替) で signature/DbC/fail-open/圧縮契約をレビュー。cross-agent 不在を記録。

### Step 4: 命名テスト + 全回帰
`npx vitest run tests/plan-id-naming.test.ts` + `npx vitest run`。

## §実装計画

| 項目 | 情報源 |
|------|--------|
| イベント/ダイジェスト schema | 自設計 (要件定義書 §6.8 Issue スパイン + handover/audit 既存構造から) |
| 関数 signature / DbC | 既存 `src/runtime/agent-guard.ts` パターン踏襲 (hook entry + 判定本体分離) |
| fail-open 方針 | agent-guard (fail-close) との対比で PO 指示「ログは作業を止めない」 |
| active PLAN 解決 | 要件定義書 §6.1 branch↔kind + §6.8.2 (1 Issue=1 PLAN=1 branch) |
| ストレージ配置 | 既存 `.ut-tdd/` 構造 + `.gitignore` 規約 (audit/state は gitignored) |

## §6 用語更新 (§G.9 living glossary)

| 用語 | 定義 | 導入層 |
|------|------|--------|
| セッションログ (session log) | Claude Code セッション中の生イベントの append-only 記録 (ephemeral) | L6 |
| PLAN ダイジェスト (plan digest) | PLAN 単位に圧縮 (要約) した durable な作業記録。handover/audit/失敗ループへ接続 | L6 |
| fail-open hook | 失敗してもワークフローを止めない hook (exit 0)。guard の fail-close と対の概念 | L6 |
| active PLAN 解決 | イベントを紐づける現在 PLAN を state/branch から決定する処理 | L6 |

→ L0 §10 用語集へ back-merge (§G.9)。

## §7 成否

- generates 2 件 (session-log.md / L7-unit-test-design.md 追記) が揃い ①⇔③ ペア成立 (G6 pair freeze 対象)
- code-reviewer self-review APPROVE (Critical 0)
- 命名テスト + 全回帰 pass
- 後段 `PLAN-L7-01-session-log` (add-impl) へ接続、最終的に Reverse で L3 要件側へ修正 (PO 方針)
