---
layer: L6
artifact_type: design_doc
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-03-session-log.md
---

> **L6 contract marker**: `recordEvent(input: SessionHookInput) => void` and `compressPlanDigest(input: PlanDigestInput) => PlanDigest` are the unit-test-granularity contracts. DbC pre/post/invariant maps hook/session events and PLAN digest generation to U-SLOG-001..008.


## 2026-06-09 Runtime Adapter Lifecycle Addendum

- `onStop(input, deps)` records one `session_end` event with `input.plan_id ?? resolveActivePlan(deps)` before compressing the session jsonl into plan digests.
- The adapter wrapper passes its explicit `--plan` value only to the session-log lifecycle input, not to provider CLI args.
- A plan digest produced through `ut-tdd codex|claude --execute --plan <id>` must include `session_start`, `tool_use`, and `session_end` counts for `<id>`.

<!--
① 設計 (L6 機能設計) — session-log 機能。
PLAN: PLAN-L6-03-session-log (add-design)。pair (③): docs/test-design/harness/L7-unit-test-design.md §1.5 U-SLOG。
実装 (②): src/runtime/session-log.ts + src/cli.ts session/hook entrypoints + .claude/hooks/session-log.ts backward-compatible shim (PLAN-L7-01-session-log, add-impl)。
正本機能: 要件定義書 §6.8 (Issue 起点スパイン) / §6.9 のローカル観測側。
-->

# UT-TDD Agent Harness — L6 機能設計: session-log (セッションログ + PLAN 単位圧縮)

## §1 概要

Claude Code セッションの生イベントを hook で append-only に記録 (ephemeral) し、**PLAN 単位でダイジェストに圧縮** (durable) する runtime 機能。agent-guard と同じ package-local TS hook パターン (`.claude/hooks/*.ts` → `src/runtime/*.ts`、bun・環境非依存) を踏襲するが、**fail-OPEN** (guard は fail-close)。出力 = handover / audit / 失敗→仕組みループ (§8.6) の入力。

> **進捗管理 3 層 (要件 §6.8.6) における位置**: PLAN ダイジェストは **log 層**の成果物であり、**handover (§6.8.5) への入力**かつ **state DB 登録 (FR-L1-07 hook) のトリガ**。log (どう進めたか) / handover (次どうするか) / state DB (今どこまで) の結節点。

## §2 型 / schema (D-CONTRACT)

```ts
type SessionEventType = "session_start" | "tool_use" | "commit" | "plan_switch" | "session_end";

interface SessionEvent {
  ts: string;            // ISO8601、hook 受領時に付与
  session_id: string;
  plan_id: string | null; // resolveActivePlan() 結果
  event_type: SessionEventType;
  tool?: string;         // PostToolUse 時 (Edit/Write/Bash/...)
  target?: string;       // 編集 path / コマンド要約。秘匿: 値・引数は載せない (path / 要約のみ)
  outcome?: "ok" | "error";
}

interface PlanDigest {
  plan_id: string;
  sessions: string[];                       // 寄与した session_id (重複なし)
  event_counts: Partial<Record<SessionEventType, number>>;  // 未発生 type はキー無し (emptyDigest={})
  files_touched: string[];                  // 重複なし
  commits: string[];                        // commit hash (取得可能時)
  failures: { ts: string; summary: string }[];
  updated_at: string;
  session_watermarks?: Record<string, number>;  // PLAN-L7-80: session 別 畳み済み event 件数 (再 summarize 増分のみ計上)。pre-L7-80 digest は省略 = migration で updated_at から seed
}
```

**秘匿原則 + `summarize()` / `sanitize()` 仕様 (self-review I-3)**: `target` は `summarize(input)` が生成し、**ツール名 + 対象 path のみ、最大 120 文字**。Bash 引数値・ファイル内容・credential・PII を**除外**する (CLAUDE.md 禁止事項)。`failures[].summary` は durable な digest に永続化されるため、生成前に `sanitize(target)` で禁則パターン (token/key/password 様文字列、絶対 path のユーザー名等) をマスクする。`sanitize` の責務 = 禁則マスク + 120 文字 truncate。

**`updated_at` 意味論**: 「このダイジェストに含まれる**全 session 中の最終 event 時刻**」。prev マージ時は `max(prev.updated_at, ...events.ts)` (巻き戻り禁止)。
**`failures` dedupe**: キー = `ts` (ISO8601 は event 一意)。再適用で重複増殖させない。

## §3 関数 signature + DbC (src/runtime/session-log.ts)

| 関数 | signature | pre | post |
|------|-----------|-----|------|
| `resolveActivePlan` | `(deps: SessionLogDeps) => string \| null` | — | state ファイル `.ut-tdd/state/current-plan` 優先 → **state 無き時の fallback** として branch 名 capture (regex `/^(?:add\|design\|feature\|reverse\|hotfix\|poc\|refactor)\/(.+)$/`、§6.1 branch↔kind 整合) をそのまま採用 (厳密突合は state 側が持つ) → 解決不能は `null`。**throw しない** |
| `onSessionStart` | `(input, deps) => number` | — | session_start event を append。常に `0`、I/O 失敗でも throw しない (fail-open)。**③ U-SLOG-005 で被覆** |
| `recordEvent` | `(input: SessionHookInput, deps: SessionLogDeps) => void` | — | `.ut-tdd/logs/session/<session_id>.jsonl` へ 1 行 append。**never throws (fail-open)** — I/O / 解析失敗は握りつぶし warn |
| `compressPlanDigest` | `(events: SessionEvent[], planId: string, prev?: PlanDigest) => PlanDigest` | — | **純関数 (I/O なし)**。planId の events を集計。`prev` とマージ (PLAN は複数 session 跨ぎ)。再適用は **event 単位 high-watermark** で idempotent (`session_watermarks[sid]` 件数を超える増分のみ計上 = 同一 session の複数回 summarize でも過少計上しない、PLAN-L7-80 / U-SLOG-008)。pre-L7-80 digest は `updated_at` から watermark を seed (migration、既計上分の再計上なし) |
| `onPostToolUse` | `(input, deps) => number` | — | tool_use (commit 検出時 commit) event を append。常に `0` |
| `onStop` | `(input, deps) => number` | — | session の events を plan_id 別に `compressPlanDigest` し `.ut-tdd/logs/plan/<plan_id>.digest.json` を更新。**plan_id=null のみの session は digest を書かない (skip、m-3)**。常に `0` |

`SessionLogDeps` = `{ repoRoot, readFile, appendFile, writeFile, now }` (I/O とクロックを注入 → `compressPlanDigest` 以外も test 可能、`now` 注入で決定論)。

## §4 pseudocode (代表)

```text
# onPostToolUse (fail-open)
onPostToolUse(input, deps):
  try:
    plan = resolveActivePlan(deps.repoRoot)
    ev = { ts: deps.now(), session_id: input.session_id, plan_id: plan,
           event_type: detectType(input), tool: input.tool_name,
           target: summarize(input), outcome: input.outcome }
    recordEvent(ev, deps)          # 内部でも try/catch (二重 fail-open)
  catch: warn(stderr)              # 握りつぶす
  return 0                          # 常に成功 (作業を止めない)

# compressPlanDigest (純関数, idempotent)
compressPlanDigest(events, planId, prev):
  base = clone(prev) ?? emptyDigest(planId)
  for ev in events where ev.plan_id == planId:
    if base.sessions.has(ev.session_id): continue   # 既に畳んだ session は再計上しない = idempotent (I-1/m-4)
    base.event_counts[ev.event_type] += 1            # session-guard 下なので二重計上なし
    if ev.target and isPath(ev.target): base.files_touched.add(ev.target)  # set
    if ev.event_type == "commit": base.commits.add(ev.target)               # set
    if ev.outcome == "error":
      base.failures = dedupeByTs(base.failures + {ts: ev.ts, summary: sanitize(ev.target)})  # キー=ts
  for sid in distinct(events.session_id where plan_id==planId): base.sessions.add(sid)
  base.updated_at = max(prev?.updated_at ?? "", ...events.map(ev => ev.ts))  # 巻き戻り禁止 (I-1)
  return base
```

## §5 ストレージ / hook 配線

- 生: `.ut-tdd/logs/session/<session_id>.jsonl` (gitignored)
- 圧縮: `.ut-tdd/logs/plan/<plan_id>.digest.json` (gitignored、durable)
- hook 実体: `src/cli.ts` session/hook entrypoints (`.claude/hooks/session-log.ts` backward-compatible shim) (bun, 環境非依存)。**variant 分岐 = stdin JSON の `hook_event_name` を正 (SessionStart / PostToolUse / Stop) とし、CLI command (`session start` / `hook post-tool-use` / `session summary`) を fallback** に持つ (m-2)。settings.json は 3 event に対応する UT-TDD CLI command を登録し、Claude Code が渡す `hook_event_name` で handler を選ぶ。
- `.gitignore` に `.ut-tdd/logs/` を追加。
- `.claude/settings.json`: `SessionStart` / `PostToolUse(Edit|Write|MultiEdit|Bash)` / `Stop` に登録。**`blockOnFailure` を付けない (fail-open)**。

## §6 fail-open 設計 (agent-guard fail-close との対比)

| | agent-guard | session-log |
|--|-------------|-------------|
| 失敗時 | exit 2 (block)、`blockOnFailure: true` | **exit 0 (pass)**、blockOnFailure なし |
| stdin/JSON 失敗 | block (検証不能を pass させない) | warn して 0 (ログがワークフローを止めない) |
| 目的 | 安全性の強制 (守り) | 観測の記録 (非侵襲) |

## §7 V-pair / トレース

- ③ pair: `docs/test-design/harness/L7-unit-test-design.md §1.5 U-SLOG` (G6 pair freeze 対象)
- ② impl: `src/runtime/session-log.ts` + `src/cli.ts` session/hook entrypoints (`.claude/hooks/session-log.ts` backward-compatible shim) (PLAN-L7-01)
- 上位整合: 本機能の **要件 (L3) 表現は後段 Reverse (R0-R4) で back-fill / 修正** (PO 方針、bottom-up build → 上位整合)。
