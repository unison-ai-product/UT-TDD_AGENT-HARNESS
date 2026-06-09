---
layer: L6
artifact_type: design_doc
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-04-forced-stop-feedback.md
---

> **L6 contract marker**: `classifyFeedback(input: FeedbackInput) => FeedbackClassification` and `recordFeedback(input: FeedbackRecordInput) => FeedbackRecordResult` are the unit-test-granularity contracts. DbC pre/post/invariant maps forced-stop evidence to U-FSF-001..007.

<!--
① 設計 (L6 機能設計) — forced-stop フィードバック機能。
PLAN: PLAN-L6-04-forced-stop-feedback (add-design)。pair (③): docs/test-design/harness/L7-unit-test-design.md §1.6 U-FSF。
実装 (②): src/runtime/forced-stop.ts + src/runtime/session-log.ts 拡張 + src/cli (ut-tdd feedback classify) (PLAN-L7-02-forced-stop-feedback, add-impl)。
土台: session-log (session-log.md)。Recovery 接続: concept §2.5 / §2.6.1 (後段 Reverse で forced_stop signal 正本化)。
-->

# UT-TDD Agent Harness — L6 機能設計: forced-stop フィードバック (強制停止推定 + フィードバックログ + Haiku 意味解析 + Recovery 起票提示)

## §1 概要

ユーザーによる**強制停止 (ESC/Ctrl+C/Stop) は最高 severity の負シグナル** (罵倒含む = AI が相当やらかした証拠) として扱い、(1) session-log の event 列から強制停止を**推定検出**し、(2) 停止後メッセージを **Haiku サブコマンド**で意味解析して**是正フィードバックのみ**を durable に記録、(3) アテンション強度が高ければ **Recovery 起票をユーザーへ提示**する runtime 機能。session-log を土台に拡張し、**fail-OPEN** を踏襲する。出力 = Recovery 発火導線 (concept §2.5) / handover / 失敗→仕組みループ (§8.6) の入力。

> **PO 確定事項** ([[feedback_forced_stop_high_severity_recovery]], 2026-06-02): ①強制停止=`agent_runaway` 級・default は「やらかした」側 / ②自動起票はしない (提示まで自動・起動は人間サインオフ、Recovery §2.6.3) / ③**間違え系 (ユーザー誤操作/気変わり) はフィードバックに残さない** / ④意味解析は **Haiku サブコマンドへ分離** (決定論 hook でやらない)。

> **なぜ推定か**: Claude Code は強制停止専用の hook を持たない。公式 `Stop` hook は *"Does not run if the stoppage occurred due to a user interrupt"* で user interrupt では発火せず、`StopFailure` は API エラー専用、`SessionEnd.reason` にも interrupt 値が無い。専用 hook は feature request (anthropics/claude-code #9516) として **open / 未実装**。よって session-log の append-only event 列で「閉じなかったターン (dangling turn)」を推定する。

## §2 機能設計 (L6 粒度)

### §2.1 責務分離 (PO 確定: hook は dumb、判断は Haiku)

| 層 | 責務 | 失敗方針 |
|----|------|---------|
| **fail-open hook** (session-log 拡張: SessionStart/Stop handler) | dangling-turn 推定 + 停止後の生記録 (`forced_stop` event)。**判断も API も持たない** | fail-open (exit 0) |
| **`ut-tdd feedback classify`** subcommand | 停止後メッセージ → 分類リクエスト emit / 分類結果 (`ClassifyResult`) の記録。意味判定は **managed pmo-haiku** に委譲 (raw API 直叩きしない、CLAUDE.md 準拠) | 失敗=未分類で残す (取りこぼし回避) |
| **agent** (次ターン/session 開始) | フィードバックログを読み、`feedback`+`high` を **Recovery 起票として能動提示** → 人間 yes で起票 | — |

提示は hook から直接 prompt できない (fail-open hook は exit code のみ) ため、**次ターン/session 開始時に agent がフィードバックログを読んで能動提示**する (CLAUDE.md context 注入経路と同型)。停止の「瞬間」でなく「次の入口」で出る遅延前提。

### §2.2 型 / schema (D-CONTRACT)

```ts
// session-log の SessionEventType に "forced_stop" / "user_prompt" を追加
type SessionEventType =
  | "session_start" | "tool_use" | "commit" | "plan_switch" | "session_end"
  | "forced_stop" | "user_prompt";

interface ForcedStopEvent {        // SessionEvent の派生 (event_type="forced_stop")
  ts: string;
  session_id: string;
  plan_id: string | null;
  event_type: "forced_stop";
  dangling_from: string;           // 推定: 最後に閉じなかったターンの起点 ts
  next_message_ref?: string;       // 停止後メッセージの生ログ参照 (jsonl id/offset)。本文は載せない
}

interface FeedbackEntry {          // durable、フィードバックログ。是正のみ (mistake は entry を作らない)
  ts: string;
  session_id: string;
  plan_id: string;                 // null は recordFeedback で skip されるため、存在する entry は常に string
  category: "feedback";            // 記録される時点で必ず "feedback" (mistake は recordFeedback で no-op)
  attention: "low" | "high";
  summary: string;                 // sanitize + 120字要約。生文は残さない
  recovery_proposed: boolean;      // attention="high" で提示対象になったか
  reason: string;                  // 分類根拠 (Haiku 出力の要約、sanitize 済)
  resolved_at?: string;            // 対応済 (Recovery 起票/却下) の ISO8601。undefined = 未対応
}

interface ClassifyResult { category: "mistake" | "feedback"; attention: "low" | "high"; reason: string; }
type Classifier = (text: string) => Promise<ClassifyResult>;   // 注入・非同期 (managed pmo-haiku は I/O)。test=mock (resolved promise)
```

**秘匿原則 (session-log 共通)**: `summary` / `reason` は session-log の `sanitize()` を再利用 (token/key/secret/password/bearer 様文字列マスク + 120字 truncate)。**停止後メッセージの生文・PII・credential を durable に残さない** (CLAUDE.md 禁止事項)。`next_message_ref` は生ログ (gitignored ephemeral) への参照のみ。

### §2.3 関数 signature + DbC

| 関数 | signature | pre | post |
|------|-----------|-----|------|
| `detectDanglingTurn` | `(events: SessionEvent[]) => { dangling: boolean; from: string \| null }` | — | **純関数 (I/O なし)**。末尾に `session_end` で閉じていない `tool_use`/`user_prompt` が在れば `dangling:true`。`from` = **`session_end` が存在すれば最後の `session_end` の直後イベントの `ts` / `session_end` が一件も無ければ `events[0].ts`**。閉じている / 空 events は `{dangling:false, from:null}` |
| `recordForcedStop` | `(params: ForcedStopParams, deps: SessionLogDeps) => void` | — | **never throws (fail-open)**。`ForcedStopParams = { session_id?, plan_id?, dangling_from, next_message_ref? }` (`dangling_from` は `detectDanglingTurn` の結果由来でフック入力でない)。`forced_stop` event を `.ut-tdd/logs/session/<session_id>.jsonl` へ append。I/O 失敗は握りつぶし warn。**自由テキスト本文フィールド (`message`/`text`/`content` 等) を持たず `next_message_ref` (生ログ参照) のみ** |
| `classifyFeedback` | `(text: string, classifier: Classifier) => Promise<ClassifyResult>` | — | 非同期。`classifier` 呼び出し結果を返す。**classifier が reject / throw / 不正出力 (category/attention 不正) なら `{category:"feedback", attention:"low", reason:"unclassified"}`** に倒す (取りこぼし回避、§2.5)。`reason` が非 string の場合は category/attention が valid なら空文字で許容 (reason は補助情報) |
| `recordFeedback` | `(result: ClassifyResult, ctx: FeedbackCtx, deps: SessionLogDeps) => void` | — | `result.category==="feedback"` のときのみ `ClassifyResult`+`ctx` から `FeedbackEntry` を組み立て (`recovery_proposed = result.attention==="high"`、`summary`/`reason` を `sanitize`、`resolved_at` 未設定) `.ut-tdd/logs/feedback/<plan_id>.jsonl` へ append。**`mistake` は no-op**。**`plan_id===null` は書かない (skip、session-log onStop と同方針)**。**idempotent は内容キー (`session_id`+`plan_id`+`attention`+`summary`+`reason`) で判定** (`now()` が毎回変わる実運用でも同一フィードバックを二重記録しない)。never throws |
| `pendingRecoveryProposals` | `(deps: SessionLogDeps) => FeedbackEntry[]` | — | 全 feedback ログから `recovery_proposed===true && resolved_at===undefined` の entry を返す (agent が起動時に読む)。無ければ `[]`。**不正 JSON 行はスキップし valid 行のみ返す**。読取失敗は `[]` (fail-open) |
| `scanDanglingStops` | `(deps: SessionLogDeps, currentSessionId?: string) => number` | — | 起動時 (`onSessionStart`) に session ログ群を走査し、`session_end` で閉じず `forced_stop` も未記録の dangling session に `recordForcedStop`。**`prev_session_id` を要さず全 session 走査** (Claude Code が前 session id を渡さない問題を回避)。current session 除外。記録済 (`forced_stop` あり) は skip = idempotent。fail-open、記録件数を返す |

`FeedbackCtx` = `{ session_id, plan_id, summary }` (生文でなく要約前提のテキスト + 紐付け)。`recordFeedback` が `ClassifyResult`+`ctx` → `FeedbackEntry` 変換を担う (呼び出し側 = subcommand は分類結果と ctx を渡すだけ)。`Classifier` は **raw API を持たず** managed agent 経路 (pmo-haiku) を adapter 化する seam。実体配線は `ut-tdd feedback classify` subcommand 側 (§2.4)。

### §2.4 hook / subcommand 配線

- **hook (新規 hook は足さない)**: 強制停止時は公式 `Stop` (=`onStop`) が**発火しない**ため、検出は **`onSessionStart` での後追い** に一本化する。UT-TDD CLI session start (`src/cli.ts`、`.claude/hooks/session-log.ts` は backward-compatible shim) が SessionStart 時に **`scanDanglingStops(deps, currentSessionId)`** を呼び、session ログ群 (current 除外) を走査して `detectDanglingTurn` → dangling かつ `forced_stop` 未記録なら `recordForcedStop`。`onStop` 内では dangling 検出を**行わない** (正常終了経路のため)。Claude Code は前 session id を hook に渡さないため、`prev_session_id` 特定でなく**全 session 走査 + forced_stop 既存 skip** で idempotent に実現する (session-log M-2 の前提依存を回避)。settings.json は session-log の登録 (SessionStart/PostToolUse/Stop) を流用 (追加登録なし)。
- **subcommand `ut-tdd feedback classify`** (`src/cli`): 停止後メッセージ (生ログ参照) を入力に、(a) **分類リクエスト emit** (pmo-haiku への prompt + JSON schema を出力する dry-run) / (b) 分類結果を受けて `recordFeedback`。既定の `Classifier` adapter は managed pmo-haiku 経由 (CLAUDE.md「API 直叩き禁止、契約 + CLI/hook で管理」)。raw provider SDK / API key を repo に持たない。
- **agent 提示**: 起動時に `pendingRecoveryProposals` を読み、`high` を Recovery 起票候補として prose 提示 ([[feedback_no_askuserquestion_no_gap_numbers]] に従い AskUserQuestion 不使用)。

### §2.5 fail-open + 取りこぼし回避

session-log と同じ **fail-OPEN** (検出・記録は常に exit 0、ワークフローを止めない)。さらに分類の**曖昧時は `feedback` 寄りに倒す** — false-negative で本物のやらかし signal を捨てる損失 > false-positive のノイズ、かつ強制停止 default=やらかし側 ([[feedback_forced_stop_high_severity_recovery]])。`mistake` 確定時のみ破棄 (記録しない)。

### §2.6 ストレージ

- `forced_stop` / `user_prompt` event: session-log の `.ut-tdd/logs/session/<session_id>.jsonl` に同居 (gitignored, ephemeral)
- フィードバックログ: `.ut-tdd/logs/feedback/<plan_id>.jsonl` (gitignored, **durable** = プロセス再起動を超えてローカル永続・git 非追跡, **是正のみ**)。`plan_id=null` は書かない。
- `.gitignore` は既存 `.ut-tdd/logs/` で被覆済 (session-log で追加済)

## §3 ③ 単体テスト設計 (pair) — L7-unit-test-design.md §1.6

U-FSF-001 (`detectDanglingTurn` 純粋性/dangling 判定) / U-FSF-002 (`recordForcedStop` fail-open/本文非掲載) / U-FSF-003 (`classifyFeedback` mock + 失敗時 feedback 倒し) / U-FSF-004 (`recordFeedback` feedback のみ/mistake no-op/plan_id=null skip/内容キー idempotent/sanitize) / U-FSF-005 (`pendingRecoveryProposals` フィルタ/不正行スキップ) / U-FSF-006 (`emitClassifyRequest` pmo-haiku 契約) / U-FSF-007 (`scanDanglingStops` dangling のみ記録/idempotent/current 除外/fail-open)。

> **freeze の使い分け**: **G6 (機能設計凍結)** で ①(本書) ⇔ ③(L7-unit-test-design.md §1.6 U-FSF) の pair 宣言を確定。**G7** で ①⇔②⇔③⇔④ の 4-artifact 双方向 trace を凍結。PLAN frontmatter `next_pair_freeze: L7` は「次に pair freeze を行う層境界 = L6/L7」を指す (session-log PLAN-L6-03 と同形)。

## §4 fail-open 設計 (session-log / agent-guard との関係)

| | agent-guard | session-log | forced-stop (本機能) |
|--|-------------|-------------|---------------------|
| 失敗時 | exit 2 (block) | exit 0 (pass) | exit 0 (pass) + 曖昧は feedback 寄り |
| 目的 | 安全性強制 (守り) | 観測記録 (非侵襲) | 逸脱 signal 捕捉 → Recovery 提示 (非侵襲) |
| 判断 | hook 内 (決定論) | hook 内 (集計のみ) | **hook 外 (Haiku subcommand)** |

## §5 上位整合 (後段 Reverse で back-fill)

本機能の要件・signal 体系は **bottom-up build → 後段 Reverse (PLAN-REVERSE-03) で back-fill**:
- **L0 concept §2.6.1 signal→mode**: `forced_stop` を `agent_runaway` 級 Recovery trigger として追加 (現状 signal リストに無い実ギャップ)。
- **L3 要件 (FR/AC)**: フィードバックログ + 強制停止検出 + Recovery 提示の振る舞いを既存 FR 拡張で吸収 (fr-registry-audit 46 件不変、新 FR を起こさない)。
- **recovery.md spike**: `forced_stop` trigger + 出口契約に**再発防止ドキュメント MUST** を追記。recovery.md §6 の既存「interrupt (設計ギャップ割込み)」とは別概念 → 命名衝突させない (`forced_stop`)。
- **再発防止 = 仕組み化志向**: prose 止まりでなく guard/test/rule への機械強制を目指す (§8.6 失敗→仕組みループ、[[feedback_process_for_record_not_weight]])。
