---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_session_log
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1360
---

> **L6 contract marker**: `recordEvent(input: SessionHookInput) => void` と `compressPlanDigest(input: PlanDigestInput) => PlanDigest` は unit-test-granularity contract である。DbC pre/post/invariant は hook/session event と PLAN digest generation を U-SLOG-001..008 へ対応させる。


## 2026-06-09 Runtime Adapter Lifecycle 追補

- `onStop(input, deps)` は session jsonl を plan digest へ compress する前に、`input.plan_id ?? resolveActivePlan(deps)` 付きの `session_end` event を 1 件記録する。
- adapter wrapper は明示 `--plan` value を session-log lifecycle input にだけ渡し、provider CLI args へは渡さない。
- `ut-tdd codex|claude --execute --plan <id>` で生成される plan digest は、`<id>` 向けの `session_start`、`tool_use`、`session_end` count を含む必要がある。
- **adapter lifecycle wrapper の契約** (`src/cli/delegation.ts`): `--execute` は provider 起動の前に SessionStart (`runSessionStartSideEffects`)、起動の区間に PostToolUse、終了後に Stop (どちらも `dispatch`) を記録し (session_id = `<provider>-<epoch ms>`)、最後に handover warnings を surface する。lifecycle 記録の失敗は provider の exit code を変えない (§6 fail-open)。provider の exit code は review 結果の失敗でのみ 1 に上書きされる。
- **hook 入口の共有**: Claude hook の canonical 実装は `src/cli.ts` の `session start` / `hook post-tool-use` / `session summary` であり、`.claude/hooks/session-log.ts` は後方互換 shim に留める。`SessionHookInput.plan_id` を許容し、adapter wrapper が明示 PLAN を digest に渡せる。
- **`--task-file`**: Windows の ARG_MAX を避けるための provider 非依存の入力経路。`--task` と `--task-file` はちょうど 1 つ指定する (どちらも無い・両方ある場合は adapter が拒否する)。provider への prompt 本文は両 provider とも stdin に載せる (Codex=`exec -`、Claude=`--print --input-format text`)。
- **provider 解決**: native provider の解決は `UT_TDD_CODEX_BIN` / `UT_TDD_CLAUDE_BIN` を正とし、legacy raw-wrapper の env 名は provider 実行へ引き継がない (PLAN-L7-68 が旧挙動を置換)。

<!--
① 設計 (L6 機能設計) — session-log 機能。
PLAN: PLAN-L6-03-session-log (add-design)。pair (③) は docs/test-design/harness/L7-unit-test-design.md §1.5 U-SLOG を指す。
実装 (②): src/runtime/session-log.ts + src/cli.ts session/hook entrypoints + .claude/hooks/session-log.ts backward-compatible shim (PLAN-L7-01-session-log, add-impl)。
正本機能: 要件定義書 §6.8 (通常Forward / Forward escape二経路、Execution Ledger正本) / §6.9 のローカル観測側。
-->

# UT-TDD Agent Harness — L6 機能設計: session-log (セッションログ + PLAN 単位圧縮)

## §1 概要

Claude Code セッションの生イベントを hook で append-only に記録 (ephemeral) し、**PLAN 単位でダイジェストに圧縮** (durable) する runtime 機能。agent-guard と同じ package-local TS hook パターン (`.claude/hooks/*.ts` → `src/runtime/*.ts`、Node・環境非依存) を踏襲するが、**fail-OPEN** (guard は fail-close)。出力 = handover / audit / 失敗→仕組みループ (§8.6) の入力。

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
- hook 実体: `src/cli.ts` session/hook entrypoints (`.claude/hooks/session-log.ts` backward-compatible shim) (project-local Node wrapper 経由、環境非依存)。**variant 分岐 = stdin JSON の `hook_event_name` を正 (SessionStart / PostToolUse / Stop) とし、CLI command (`session start` / `hook post-tool-use` / `session summary`) を fallback** に持つ (m-2)。settings.json は 3 event に対応する UT-TDD CLI command を登録し、Claude Code が渡す `hook_event_name` で handler を選ぶ。
- `.gitignore` に `.ut-tdd/logs/` を追加。
- `.claude/settings.json`: `SessionStart` / `PostToolUse(Edit|Write|MultiEdit|Bash|PowerShell)` / `Stop` に登録。**`onFailure` を付けない (既定の `"continue"` = fail-open)**。Windows ネイティブ Claude Code の主シェルツール `PowerShell` を matcher に含める (PLAN-RECOVERY-13 / issue #86: 除外時は Windows セッションのシェル操作が session log / hook_events から構造的に欠落する)。

### consumer記録hookのtimeout予算 (Issue #1057 / U-SLOG-010)

Pack が consumer に生成する設定では、従来5秒だった記録hookを30秒にする。対象は
Claude の `PostToolUse` と `Stop`、Codex の `SessionStart`・`PostToolUse`・`Stop`。
Claude `SessionStart` は既存の30秒を維持する。guard hook と Claude 非同期 memory-wake hook、
`SubagentStop` の予算は変更しない。

ソース開発repo自身の記録hookも consumer と同じ30秒にする (2026-10-16 改訂、U-SLOG-011)。
対象は `.claude/settings.json` の `PostToolUse`(post-tool-use) と `Stop`(session summary)、
`.codex/hooks.json` の `SessionStart` / `PostToolUse` / `Stop` の計5本である。改訂の理由は、
2026-10-16 に PO の Codex 画面で source repo の SessionStart と Stop が
`hook timed out after 5s` で失敗した (実行2・失敗2) 実測である。agent-guard / work-guard、
`SubagentStop`、memory-wake 930、Claude `SessionStart` 30 は変えない。

30秒はhost側の上限であり、すべてのeventが永続化される保証ではない。hostが期限で
hookを強制終了した場合、eventは記録されないか途中までになる可能性がある。session-logは
引き続きbest-effort/fail-openでworkflowをblockしない。期限切れeventを自動再実行したり、
queueへ積んだりしない。通常returnとI/O failureの既存exit-0挙動を維持し、exactly-onceや
timeout recoveryは保証しない。

timeoutが束縛するのはforegroundのhook processだけである。Stop handlerが明示的にdetach
するwork（harness DB refreshを含む）はhookのwall-clock durationに含めず、このbudgetを
延長・消費しない。

予算の根拠と計測境界: Issue #1057はWindows consumerのPostToolUse 5,443ms、Stop 7,181msを
報告した。別のwarm Windows計測では、DB初期化済みの隔離fixtureでNode v24.13.0と
project-local bundled `.mjs` consumerを使った。直接SessionStartを3回起動した時間は
5,598ms（CPU Load 96→9%）、4,694ms（0→13%）、5,057ms（15→4%）。直接PostToolUseは
1,033ms（1→17%）、690ms（3→51%）、1,001ms（87→82%）だった。これは直接Node entrypointの
時間であり、Codex shell wrapperの時間ではない。また、Issue #1057のPostToolUse観測値とも
異なる。Node/CLI/Git各phaseの費用は未特定であり、独立した計測値を単純減算してphase内訳を
主張しない。隔離fixtureでStop hook本体は791msでreturnし、別detachのDB refresh workerは
140.5秒動いた。このworker時間はIssue #1057の7,181ms hook計測に含めない。

後続Greenでは、既存のtimeout parity testを対象外hookのみ不変とする検査へ更新する。source開発repo設定と
consumer templateは記録hookの30秒で揃えるが、guard等の対象外hookを含む全面一致は要求しない。

## §6 fail-open 設計 (agent-guard fail-close との対比)

| 比較項目 | agent-guard | session-log |
|--|-------------|-------------|
| 失敗時 | exit 2 (block)、`onFailure: "block"` | **exit 0 (pass)**、`onFailure` なし |
| stdin/JSON 失敗 | block (検証不能を pass させない) | warn して 0 (ログがワークフローを止めない) |
| 目的 | 安全性の強制 (守り) | 観測の記録 (非侵襲) |

## §7 V-pair / トレース

- ③ pair: `docs/test-design/harness/L7-unit-test-design.md §1.5 U-SLOG` (G6 pair freeze 対象)
- ② 実装: `src/runtime/session-log.ts` + `src/cli.ts` session/hook entrypoints (`.claude/hooks/session-log.ts` backward-compatible shim) (PLAN-L7-01)
- 上位整合: 本機能の **要件 (L3) 表現は後段 Reverse (R0-R4) で back-fill / 修正** (PO 方針、bottom-up build → 上位整合)。

## 2026-07-22 shell-free hook invocation 追加設計 (Issue #123)

session lifecycle hook の意味論は command line 文字列ではなく、`HookInvocation { executable, args }`
で表す。Claude serializer は `executable: "node"` と、project-local `.ut-tdd/bin/ut-tdd.mjs`・subcommand を
token 化した `argv` を公式 exec form の `command` / `args` へ別々に写像し、`session start`、`hook post-tool-use`、`session summary` の
event 意味論と fail-open 方針を温存する。空白結合、quote 再構築、shell operator、shell executable
による再解釈は禁止する。

Windows の oracle は process-tree ancestry の実測を主張せず、project-local Node wrapper (`.ut-tdd/bin/ut-tdd.mjs`) の
直接 executable spawn、`windowsHide: true`、shell host token 不在を wrapper source で検査する。entrypoint 不在時は
exit 127 で fail-close する。対応する実測 fixture (`tests/hook-native-launcher.test.ts`) はこの source 契約と欠落 entrypoint の
exit code を検証する。wrapper より後で session handler が明示的に起動する子プロセスは別責務であり、この oracle の通過根拠に混同しない。
対応する L7 oracle は
`U-HOOKEXEC-001..008` とする。

## 2026-11-04 Claude hook の `onFailure` 追加設計 (Issue #1521)

Claude Code が hook の失敗時にツール呼び出しを止める公式 field は `onFailure` であり、値は `"continue"` (既定) と `"block"` である。
`blockOnFailure` は Claude Code の field ではなく、書いても効かない。従来はこの無効な key を guard に付けていたため、
guard が起動不能・例外・timeout (5 秒) になると、tool call がそのまま通っていた (fail-open)。exit 2 を返す guard の block は
従来どおり成立する。本節はこの齟齬を直す契約である。対象は **Claude Code の hook 面だけ**とする。Codex 側は別 Issue で扱う。

不変条件。

- Claude の PreToolUse guard hook (`agent-guard`、`work-guard`) は `onFailure: "block"` を持つ。`"continue"` は拒否する。
- 記録 / session hook (SessionStart、PostToolUse、Stop、SubagentStop) は `onFailure` を省略する。既定の fail-open を保つ。
  Stop / SubagentStop は `onFailure` が効かない event でもあるため、省略を契約とする。
- 旧 key `blockOnFailure` は Claude 設定 (`.claude/settings.json`、Pack template、setup 生成物) に存在してはならない。
  保護に見えて効かないため、lint 違反とする。
- source の `.claude/settings.json`、Pack template、`src/setup/templates.ts` の生成物は同じ guard 配線を持つ。

前提。`onFailure` の利用には Claude Code v2.1.295 以降が必要である。version の検査は本契約に含めず、doctor check も追加しない。

受け入れ注記。実装 PR は、実際の Claude Code で 1 回の手動確認を残す。guard script を起動不能にした状態で Edit が block されること。
対応する正式テスト oracle は `docs/test-design/harness/L7-claude-hook-onfailure-test-design.md` の `U-HOOKEXEC-011`、`012`、`014` である。記録 / session hook の既存 fail-open を保つ通常テストは `CANDIDATE-U-HOOKEXEC-013` として維持する。

## 2026-11-05 Codex hook の失敗時の扱い (Issue #1538)

Codex CLI の hook 設定 (`.codex/hooks.json`) には、hook の失敗時にツール呼び出しを止める field が無い。command handler が受理する
field は `type`・`command`・`timeout`・`statusMessage`・`async`・`additionalContextLimit` だけであり、`blockOnFailure` を書いても
無音で無視される (Issue #668 の実測、`src/lint/codex-hook-adapter.ts` の `ALLOWED_HOOK_FIELDS`)。Claude の `onFailure: "block"`
(前節) に当たるものは Codex には無い。本節は、Codex の guard が「どの失敗まで止まるか」を実測した範囲だけで書き、
実測していない範囲を fail-close と称さないための契約である。

実測 (2026-11-05、codex-cli 0.159.2、Windows、非対話 `codex exec`、scratch repo)。

- 明示 deny: `PreToolUse` hook が `permissionDecision: "deny"` を返すと、対象の shell command は実行されなかった
  (marker file 不在、hook の入力記録あり)。exit 2 の block と同じく、**確定 deny による阻止は成立する**。
- 起動失敗 (hook の実行ファイル不存在)・timeout 超過・exit 1・不正 JSON の 4 種は **未実測**である。Codex lane の sandbox では
  対象 command の起動自体が OS に拒否され (`CreateProcessAsUserW` error 5)、判定できなかった。advisor (`gpt-6.1-sol`、
  troubleshooting) の判定も「判定不能」であり、明示 deny の成立をこの 4 種の fail-close の証拠に広げてはならない。

不変条件。

- Codex の guard (`agent-guard`・`work-guard`) について fail-close と書いてよいのは、**guard が確定 deny を返した場合だけ**である。
  起動失敗・timeout・exit 1・不正出力の扱いは、実測されるまで「未実測 (fail-open の可能性あり)」と書く。`AGENTS.md`・設計文書・
  lint の注釈は、この区別に合わせる。
- `src/lint/codex-hook-adapter-policy.ts` の `CODEX_REQUIRED` は `blockOnFailure` を持たない。現状この値はどの lint からも読まれず、
  Codex の設定にも効かない。残すと「Codex の guard は失敗時に止まる」と読めるため、削除する。Claude 側の
  `src/lint/project-hook.ts` の扱いは前節 (Issue #1521) が持ち、本節では変えない。
- Codex の hooks.json に `blockOnFailure` などの未対応 field を足すことは、従来どおり `unsupported_hook_field` で拒否する
  (`U-CXHOOKCMD-002`)。

採らない方式。hook の command を常に起動できる launcher に固定し、子 hook の失敗を deny に変える方式は、advisor により
**保証としては反証された**。node の不在、launcher の読み込み失敗、外側の timeout、強制終了では launcher も deny を返せず、
障害の境界が一段移るだけである。4 種の実測で fail-open が確認された場合に、限定的な緩和策として別 Issue で扱う
(その場合も launcher 自体の障害は残余リスクとして書く)。

実測の経路。残り 4 種は、Pack の実機受け入れで人が対話の Codex を動かす工程で測る。手順は次のとおり。

1. `C:\dev\` 配下の scratch repo を使い、hook の trust は通常の対話フロー (`/hooks` でのレビューと trust) で付ける。
   hook trust を迂回するフラグは使わない。
2. Codex の版、OS、shell、sandbox、cwd、hook 定義を記録する。
3. 同じツール・同じ sandbox で、正常 hook では marker の作成が成功し、deny hook では同じ操作が阻止される対照をとる。
4. 4 種を 1 つずつ注入し、ケースごとに trust 済みであることを確かめる。「node は起動するが子 script が無い」は起動失敗と
   別に扱い、不正 JSON は hooks.json 自体の破損と分ける。
5. 対象ツールの呼び出し、注入した障害、ツールの実行結果、marker の有無を対応づけて残す。marker があれば fail-open。
   marker が無ければ hook が阻止した証拠を求め、sandbox の拒否や外側の timeout は「判定不能」とする。
6. 追加した trust の項目だけを撤回し、設定ファイルが事前と一致することを確かめる。他の設定を退避から丸ごと戻さない。

対応するテスト oracle は `docs/test-design/harness/L7-codex-hook-failure-test-design.md` の `CANDIDATE-U-HOOKEXEC-015`〜`017` である。

## 2026-11-05 Claude Code の版が下限未満のときの警告 (Issue #1561)

前節 (Issue #1521) の `onFailure: "block"` は、Claude Code の版が下限 (2.1.295) 未満だと無音で無視される。2026-11-05 の実機確認 (#1521 のコメント) では、同じ PC で VS Code 拡張の 2.1.318 は guard の起動失敗と exit 1 で書き込みを止め、PATH の CLI の 2.1.293 は止めなかった。利用者からは、保護が効いているように見える。本節は、古い版で作業していることを利用者が知る経路を定める。

前提 (実測)。

- hook の stdin に Claude Code の版は無い (`SessionHookInput`、`src/runtime/session-log.ts`)。
- session の transcript (`transcript_path` の JSONL) の message の行は `"version":"<x.y.z>"` を持つ (2026-11-05、この repo の control session の transcript で確認)。
- PATH の `claude --version` は、実際に hook を起動している版と食い違うことがある (上の実機確認)。

方式。

1. **実行中の版の警告 (PostToolUse)**: 既存の PostToolUse の記録 hook (`hook post-tool-use`) が、session ごとに 1 回だけ、`transcript_path` の最後の message の行から `version` を読む。下限未満なら、警告 (版、下限、guard の失敗時の停止が効かないこと、更新を促す文) を出す。読めない (`transcript_path` が無い、行に `version` が無い、形式が違う) ときは「Claude Code の版を確かめられない」を出す。どちらも exit code は変えない (記録 hook の fail-open を保つ。前節の不変条件)。1 session に 1 回だけ出すため、警告済みの印を session の state に残す。
   - **出し方**: 警告は stdout に Claude Code の hook の JSON 出力 `{"systemMessage":"<警告>"}` を 1 つだけ書いて出す。exit 0 の hook の stderr は通常の画面に出ない (Claude Code の Hooks reference の Exit code 0 の節。debug logging でしか見えない) ので、stderr は使わない。Claude Code は stdout 全体が 1 つの JSON object のときだけ JSON として解釈するので、警告を出す呼び出しでは既存の `session-log: post-tool-use <id>` の行を stdout に書かない。警告を出さない呼び出しの stdout は今のまま (既存の行) にする。encoding guard の stderr の出力は変えない。
2. **下限の正本は 1 か所**: 下限の値 (`2.1.295`) は src の定数 1 つに置く。警告の判定・doctor の判定・adapter の `CLAUDE.md` の生成 (`src/setup/templates.ts`) はその定数を import して使い、src の他の場所に下限の値を書かない。`docs/templates/adapter/CLAUDE.md` は生成物のミラーとして値を持つ。値は前節 (#1521) の契約のものを使う。実測で言えるのは「2.1.293 で無効、2.1.318 で有効」までであり、正確な境界の出典は Claude Code の changelog で確かめて、確かめたら本節に追記する。
3. **導入手順 (Pack)**: consumer 向けの adapter の `CLAUDE.md` (`docs/templates/adapter/CLAUDE.md` と `src/setup/templates.ts` のミラー) に、下限とその理由 (guard の失敗時の停止が `onFailure` に依存する) を書く。
4. **doctor (参考)**: doctor は PATH の `claude --version` が下限未満なら warn を出す。文言では「PATH の claude の版」と明記し、実行中の版と同じだとは主張しない。fail にはしない。PATH の版が下限以上で、実行中の版だけが下限未満のときは doctor は警告しない。その場合を知らせるのは方式 1 の警告である。
5. **実画面での確認**: 方式 1 の警告が通常の画面に出ることは、unit test では確かめられない。下限未満の Claude Code と下限以上の Claude Code の両方の実機で確かめて、結果を Issue に記録する (`CANDIDATE-U-CCVER-006`)。

**注入口と module (2026-11-06 追記、Issue #1561)**。テストが差し替える口を次に固定する。名前を変えるときは、本節の改訂として扱う。

| 役割 | module と export | 形 |
|---|---|---|
| 下限の正本 | `src/runtime/claude-version-floor.ts` の `CLAUDE_CODE_VERSION_FLOOR` | `string` (`"2.1.295"`)。この module は定数だけを持ち、関数を持たない。 |
| 版の比較 | `src/runtime/claude-version-check.ts` の `evaluateClaudeVersion(version: string | null): "ok" | "below" | "unknown"` | 下限は `claude-version-floor.ts` から import する (引数で受けない)。`x.y.z` の数値で比べ、読めない値は `"unknown"`。 |
| transcript から版を読む | 同じ module の `readTranscriptClaudeVersion(transcriptPath: string | undefined): string | null` | 最後の message の行の `version` を返す。読めなければ `null`。 |
| doctor の check | 新しい module `src/doctor/claude-version-floor-check.ts` の `checkClaudeVersionFloor(deps?: { readPathClaudeVersion?: () => string | null })` | 既定の `readPathClaudeVersion` は PATH の `claude --version` を呼ぶ。テストはこの引数で差し替え、実際の Claude Code を起動しない。doctor への登録 (既存の check の一覧への追加) は実装 PR で行う。既存の module (`src/doctor/toolchain.ts` など) に export を足す形にしないのは、登録と Red の PR で既存の src を変えずに済ませるためである (`design-protection-diff-gate.md` §10.3 の手順 1' は、新しい module の stub だけを許す)。 |
| adapter の生成 | `src/setup/templates.ts` | 下限は `claude-version-floor.ts` から import して本文に埋める。 |

下限の定数を関数と別の module に置くのは、`vi.mock` で定数の module を差し替えたときに、比較・doctor・adapter の生成がそろって追従することを確かめるためである (同じ module の中の参照は `vi.mock` では差し替わらない)。

**対象の runtime (2026-11-10 追記、Issue #1561)**。`hook post-tool-use` は Claude と Codex が共有する。方式 1 の警告 (下限未満と「版を確かめられない」の両方) は、hook の process の環境変数が次の 2 つをともに満たすときだけ評価する。(1) `CLAUDECODE` が `"1"` である。(2) `CODEX_SANDBOX` と `CODEX_HOME` がどちらも設定されていない。満たさないときは評価せず、stdout は従来の `session-log: post-tool-use` の行のままにする。

- 信号は `src/runtime/detect.ts` の `detectMode` が runtime の判定に使うものと同じである。新しい環境変数・設定項目・hook の引数は足さない。
- 両方の信号がある場合 (Claude から起動した Codex が `CLAUDECODE` を継承した場合など) は Codex とみなし、評価しない。警告は助言であり、評価しない側に倒しても guard の判定は変わらない。逆に、利用者が `CODEX_HOME` を常に設定している環境では Claude でも警告が出ない。この見逃しは受け入れる (Codex の画面に Claude の警告を出す誤りより害が小さい)。
- `CLAUDE_PROJECT_DIR` の有無は対象の判定に使わない。Claude から起動した Codex に継承されうるためである。
- 対応する oracle は `docs/test-design/harness/L7-claude-version-floor-test-design.md` の `U-CCVER-007` である。

**marker を書けないとき (2026-11-11 追記、Issue #1561)**。「1 session に 1 回」の警告済みの印を作る・書く処理が、`EEXIST` 以外のどのエラーで失敗しても、版の警告は出し続ける (hook が動くたびに出す)。印を書けないことを理由に黙る側へ倒さない。警告の目的は、古い Claude では guard が fail-open になることを知らせることであり、印を書けないときに黙るほうが、警告が繰り返されるより害が大きいためである。版の警告 (下限未満と「版を確かめられない」) は従来どおり stdout の単一の `{"systemMessage":...}` JSON で出し、印の保存に失敗しても、同じ session の以後の呼び出しで毎回出す。印の保存の失敗 (`EEXIST` 以外) の診断は stderr に出す (警告を stderr へ移さない)。どちらの場合も hook の exit code と判定は変えない。`EEXIST` は「すでに警告済み」を意味するので、従来どおり出さない。対応する oracle は `U-CCVER-008` である。

採らない方式。

- SessionStart で版を読む方式: hook の stdin に版が無く、`source=startup` の時点では transcript に message の行がまだ無いことがある。
- わざと失敗する検査用の hook を置く方式: 新しい版では全 tool を止めて作業できなくなり、古い版では無音になる。
- guard の内部エラーをすべて exit 2 にして版に頼らない方式: 古い版で効かなかったのは guard の script を起動できない場合であり、script の中で例外を捕まえても救えない。work-guard の「内部エラーは fail-open (exit 0)」は既存の契約で、本節では変えない。

対応する自動テスト oracle は `docs/test-design/harness/L7-claude-version-floor-test-design.md` の `U-CCVER-001`〜`005` と `U-CCVER-007`〜`008` である。実画面での確認は、同書の `CANDIDATE-U-CCVER-006` を実装後に行う。
