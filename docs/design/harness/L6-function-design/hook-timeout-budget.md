---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_hook_timeout_budget
pair_artifact: docs/test-design/harness/L7-hook-timeout-budget-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-11-13
issue: 1057
---

> **L6 contract marker**: `hookTimeoutSeconds(id: RequiredProjectHookId) => number` は unit-test-granularity contract である (未実装の目標契約)。`src/lint/project-hook.ts` の `REQUIRED` の各 entry に hook の予算 (秒) を持たせ、Pack が consumer に生成する Claude / Codex の hook 設定 (`src/setup/templates.ts`) はこの関数から `timeout` を書く。DbC は §8 にまとめる。oracle は `docs/test-design/harness/L7-hook-timeout-budget-test-design.md` の `CANDIDATE-U-HOOKBUDGET-001`〜`010` が固定する (正式 ID `U-HOOKBUDGET-*` への昇格は src を含まない PR で行う)。

> **状態**: 本書は issue #1057 の 2026-11-12 の追加分 (guard の hook の時間切れ) と、記録用 hook の予算の見直しに対する契約である。実装 (Green) は Red と昇格の後に別 PR で行う。実装 PR は本書の方式を変えない。方式の変更が要るなら実装を止め、本書と対の L7 を同時に改訂する。

# hook の時間切れの予算と扱い — 関数設計 (issue #1057)

## 1. 目的

Windows の負荷時に、hook の process が host の制限時間を超えて打ち切られる。記録用の hook では、記録が落ちて `hook timed out` が繰り返し出る (Pack #12、issue #1057 本文)。guard の hook では、時間切れが操作の拒否になり、作業が止まる (2026-11-12、issue #1057 のコメント 6840576522)。本書は次の 3 つを定める。

1. どの hook が guard (fail-close が要る) で、どれが記録用 (fail-open でよい) か (§3)。
2. 負荷時に記録用 hook が時間切れしても作業を止めない方式と、guard の時間切れの扱い (§4、§5)。
3. source の開発 repo と、Pack が consumer に配る設定で、同じ予算を使うこと (§6)。

## 2. 前提 (実測とコード)

**実測**。

| 日時・条件 | 対象 | 所要 | 出典 |
|---|---|---|---|
| Pack #12 の報告 (Windows consumer、並行作業の負荷) | `hook post-tool-use` / `session summary` | 5,443 ms / 7,181 ms (どちらも exit 0) | issue #1057 本文 |
| 2026-10-16、DB 初期化済みの隔離 fixture、warm | SessionStart / PostToolUse / Stop 本体 | 5,598・4,694・5,057 ms / 1,033・690・1,001 ms / 791 ms (detach した DB refresh は 140.5 秒だが hook の時間に含まない) | issue #1057 のコメント 6206753463 |
| 2026-11-12、開発 repo、CPU 100%・空きメモリ約 1 GB (負荷の原因は harness の外) | `node -e "1"` | 4.6〜7.6 秒 | issue #1057 のコメント 6840576522 |
| 同上 | agent-guard の hook を手で実行 | 10.4 / 14.6 / 29.4 秒 (exit 0) | 同上 |
| 同上 | `node src/cli.ts --version` | 41.9 秒 | 同上 |
| 同上、再起動の後 | `node -e "1"` | 0.09 秒 | 同上 |
| 2026-11-13、開発 repo、CPU 100%・node の process 42 個 (参考) | `node -e "1"` | 0.46 秒 | 本書の作成時に計測 |

2026-11-12 には、agent-guard (`timeout: 5`、`onFailure: "block"`) が時間切れになり、Agent tool の worker の起動が 10 回以上すべて拒否された。agent は同じ呼び出しを繰り返した。guard の判定そのもの (exit 0) は 10〜30 秒で出ていたので、拒否の原因は判定ではなく制限時間である。

phase ごとの所要 (node の起動、module の読み込み、git、DB) は、まだ同じ run で切り分けていない。上の値を足し引きして phase の内訳を主張しない。

**コード** (origin/main `09ce4e761`)。

- **予算の現状**: guard (agent-guard・work-guard) は 5 秒、記録 hook (SessionStart・PostToolUse・Stop の session summary) は 30 秒、Claude の Stop の claude-memory-wake は 930 秒、Claude の SubagentStop は 5 秒。source の `.claude/settings.json`・`.codex/hooks.json`、`src/setup/templates.ts` の生成物、`docs/templates/adapter/` の mirror の 6 面で同じである。記録 hook の 30 秒は #1087 (契約と Red)・#1094 (昇格)・#1102 (Green) で入った (`session-log.md` §5)。
- **起動の経路**: source の guard は `node .claude/hooks/<guard>.ts` で、小さい module だけを import する (Codex は shell で `git rev-parse --show-toplevel` を先に呼ぶ)。consumer の Claude の guard は `node -e <MISSING_RUNTIME_GUARD_BOOTSTRAP>` が `.ut-tdd/bin/ut-tdd.mjs` を `spawnSync` で起動するので、node の process が 2 つになり、2 つ目は CLI 全体を読み込む (`src/lint/project-hook.ts` の `guardBootstrapHookArgs`)。記録 hook は source でも consumer でも CLI 全体を読み込む。
- **失敗時の扱い**: Claude の guard は `onFailure: "block"` を持ち、起動失敗・時間切れ・exit 1 で tool を止める (`session-log.md` の Issue #1521 節)。記録 hook は `onFailure` を持たない (fail-open)。Codex には `onFailure` に当たる field が無く、guard の時間切れで tool が止まるかは未実測である (`session-log.md` の Issue #1538 節、`CANDIDATE-U-HOOKEXEC-017`)。
- **work-guard の内部エラー**: work-guard は git の失敗・入力の解析失敗などの内部エラーでは exit 0 (通す) である (`.claude/hooks/work-guard.ts`、`src/cli.ts` の `hook work-guard`)。一方、host が時間切れで打ち切ると Claude では拒否になる。本書はこの非対称を変えない。
- **記録と guard の結合**: work-guard は「この session が触ったファイル」を `.ut-tdd/logs/session/<session_id>.jsonl` (PostToolUse の記録) から読む (`src/cli.ts` の `sessionTouchedFilesForGuard`、`.claude/hooks/work-guard.ts` の `sessionTouchedFiles`)。PostToolUse の記録が時間切れで落ちると、この session が新しく作った uncommitted のファイルを次に編集するとき、work-guard は他の runtime のファイルとみなして拒否する。コードを読んで確かめた経路であり、実害はまだ観測していない。
- **記録の順序**: `hook post-tool-use` は session event の追記 (`dispatch`) を先に行い、その後に encoding guard (`git status` を読む) と Claude Code の版の警告を行う (`src/cli.ts`)。
- **SubagentStop の記録**: `hook subagent-stop` は agent-slots の slot を 1 件 release する。release が落ちても、slot は次の fire のときに 5 分 (`DEFAULT_STALE_MINUTES`) で失効し、影響は並列数の警告 (助言) だけである (`src/runtime/agent-slots.ts`)。
- **consumer の既存の設定**: consumer の `.claude/settings.json` などの構造ファイルは、既に在れば confirm なしに上書きしない (`setup-solo-team.md` の `emitSetup`)。

## 3. hook の分類

| hook id (`REQUIRED`) | event | 分類 | 失敗時の扱い | 時間切れの影響 |
|---|---|---|---|---|
| `agent-guard` | PreToolUse (`Agent\|Task`、Codex は `spawn_agent\|spawn_agents_on_csv`) | guard | Claude: 拒否 (`onFailure: "block"`)。Codex: 確定 deny だけが阻止として実測済み | Claude では subagent の起動の拒否。判定ではない |
| `work-guard` | PreToolUse (`Edit\|Write\|MultiEdit`、Codex は `apply_patch\|write_file`) | guard | 同上。内部エラーは exit 0 (既存の契約) | Claude では編集の拒否。判定ではない |
| `session-start` | SessionStart | 記録 (handover と feedback の表示を含む) | fail-open | session_start の記録と表示が落ちる |
| `post-tool-use` | PostToolUse | 記録 (work-guard の入力) | fail-open | 記録が落ちる。§2 の「記録と guard の結合」により、次の編集が work-guard に拒否されうる |
| `session-summary` | Stop | 記録 | fail-open | digest の更新が落ちる。detach する DB refresh は予算の外 |
| `claude-memory-wake` | Stop (Claude だけ) | 通知 (`asyncRewake`) | fail-open | 通知の待機が終わる |
| `subagent-stop` | SubagentStop (Claude だけ) | 記録 (助言) | fail-open | slot の release が落ちる。5 分で自己回復 |

今後 PreToolUse に `onFailure: "block"` で足す guard (例: `workflow-model-guard.md` の workflow-guard) は、本書の guard の予算に従う。

## 4. 設計判断

### 4.1 候補

| 方式 | 内容 | 利点 | 欠点 |
|---|---|---|---|
| A: 予算をそろえる | guard を 5 → 60 秒、同期の記録 hook (SessionStart・PostToolUse・Stop の session summary) を 30 → 60 秒にする。fail-close と fail-open の区別は変えない。claude-memory-wake 930 と SubagentStop 5 は据え置く。6 面で同じ値。時間切れの拒否の意味を consumer の adapter 文書に書く | 設定の変更だけで済む。2026-11-12 に 10〜30 秒で判定が出ていた guard が通る。guard が通る負荷では、guard の入力である PostToolUse の記録も同じ予算を持つ。Claude の fail-close は変わらない。Codex では、未実測の時間切れの経路に入る回数が減る | 60 秒は完走の保証ではない。guard が本当に止まったときは、操作 1 回ごとに最大 60 秒待つ。PreToolUse と PostToolUse の両方が遅いと、操作 1 回で hook の待ちが最大 120 秒になる |
| B: 記録を非同期にする | guard を 60 秒にし、PostToolUse と Stop の記録 hook に `async: true` を付けて host を待たせない | 記録 hook が作業を待たせない | PostToolUse の stdout (Claude Code の版の警告 `systemMessage`、`session-log.md` の Issue #1561 節) と encoding guard の出力が届かない。記録が次の PreToolUse より後に着きうるので、work-guard が自分のファイルを拒否する経路が増える。`async` の挙動は Claude Code・Codex のどちらでも本 repo で実測していない。SessionStart は文脈を注入するので非同期にできない |
| C: 入口を軽くする | guard と記録の前段を、CLI 全体を読み込まない小さい入口に分け、予算は 30 秒にする | CLI 全体の読み込み (2026-11-12 に `--version` で 41.9 秒) を負荷時の経路から外せる | node の起動だけで 4.6〜7.6 秒かかったので、5 秒の予算は結局足りない。phase ごとの所要が未計測で、効果を見積もれない。consumer の bundle と Pack の配布物の変更が大きい |

### 4.2 決定

**方式 A を採る。** 理由は次のとおり。

- 2026-11-12 の拒否は、判定が出せる guard を 5 秒で打ち切ったことによる。予算を広げれば、判定を変えずに誤った拒否を減らせる。
- 記録 hook を guard と同じ 60 秒にするのは、PostToolUse の記録が work-guard の入力だからである。guard だけ広げると、guard は通るのにその入力の記録が落ちて、次の編集が拒否される。SessionStart と Stop の session summary は work-guard の入力ではないが、設定を 1 つの値にそろえる単純さと、遅い環境で完走する余地のために同じ値にする。
- B は §4.1 の欠点のとおり、出力と順序の問題を持ち込む。C は phase の計測の後に別の切り出しで扱う (§10)。
- 60 は、2026-11-12 の実測の最大 (source の guard の 29.4 秒、CLI 全体の `--version` の 41.9 秒) を参考に選んだ暫定の値である。consumer の実際の hook の全体 (bootstrap、2 つ目の node、hook 本体、I/O) を負荷時に測った値ではない。異なる計測を足し合わせても、その経路の上限にはならない。

advisor への相談 (2026-11-13、`ut-tdd advisor --decision implementation`、`gpt-6.1-sol`): 推奨は A。ただし「60 秒で記録が失われない」「60 秒は実経路の上限」「Codex でも fail-close が保たれる」という説明は反証された。本書はその指摘を次のとおり取り込んだ。

- 60 秒は誤った拒否と記録の欠落を減らす暫定の予算であり、完走も記録の保存も保証しない (§5.3)。
- 予算は hook 1 回あたりの上限であり、操作 1 回の待ちの上限ではない (§4.1 の A の欠点)。
- Codex で時間切れが tool を止めるかは未確認のまま追跡する。設定の値がそろうことと、阻止の動作が同じであることを分けて書く (§5.2)。
- 時間切れの後に同じ呼び出しを繰り返さない (§5.1)。
- 記録が落ちた後の誤った拒否と、その戻し方を書く (§5.3)。
- consumer の実際の hook 全体の負荷時の計測を後続に置く (§10)。

**採らない方式**。

- **guard の時間切れを通す (`onFailure` を外す)**: guard を緩めることになる。fail-close は変えない。
- **guard の中で自分の締め切りを持ち、時間が迫ったら自分で拒否する**: node の起動だけで 5 秒を超える状況では、締め切りを測る前に host に打ち切られる。拒否の理由を出せる経路にならない。
- **hook の中で自動で再試行する**: 負荷の原因が process の起動の遅さなので、再試行は負荷を増やす。

## 5. 時間切れの扱い

### 5.1 guard

- 予算は 60 秒。Claude の `onFailure: "block"` は変えない。時間切れは拒否になる。
- 時間切れの拒否は guard の判定ではない。consumer の Claude の adapter 文書 (`adapter/.claude/CLAUDE.md` の managed block) に、次の節をそのまま入れる。Claude だけに入れるのは、時間切れで拒否されることを実測で確かめているのが Claude だけだからである。

```markdown
## Guard hook timeouts

- A guard hook (agent-guard / work-guard) that times out blocks the tool call because the machine is overloaded; the timeout is not a guard verdict.
- Do not repeat the same tool call while the machine is overloaded. Each retry starts another Node process and adds load.
- Check the load first: if `node -e "1"` takes more than 1 second, wait for the load to drop or stop unrelated heavy processes, then retry once.
- If work-guard blocks a file that this session created after a recording hook timed out, confirm with `git status` and `git log` that the file is this session's own before asking the user for the foreign-edit override.
```

- 1 秒は目安である。通常は 0.09 秒、2026-11-12 の拒否が起きた負荷では 4.6〜7.6 秒、2026-11-13 の CPU 100% (拒否は起きていない) では 0.46 秒だった。
- source の開発 repo の `.claude/CLAUDE.md` に同じ規律を書くことは、本書の範囲に含めるが、変更は別の PR で行う (§10)。

### 5.2 Codex の guard

- 予算は Claude と同じ 60 秒にする。設定の値はそろえるが、時間切れの阻止の動作が Claude と同じだとは主張しない。Codex の guard を fail-close と書いてよいのは、guard が確定 deny を返した場合だけである (`session-log.md` の Issue #1538 節の不変条件のまま)。
- 時間切れで tool が実行されるかは `CANDIDATE-U-HOOKEXEC-017` の手順で測る。予算を広げても、もし時間切れが fail-open なら、guard を通らない経路は残る。

### 5.3 記録 hook

- 予算は 60 秒。`onFailure` を付けない。`async` を付けない (方式 B を採らない)。
- 60 秒を超えたら host が打ち切り、記録は落ちるか途中までになる。記録の未保証、自動の再実行や queue を持たないこと、detach する作業を予算に含めないことは、`session-log.md` §5 の扱いのまま変えない。
- PostToolUse の記録が落ちた後に work-guard が自分の新しいファイルを拒否した場合の戻し方は、新しい仕組みを作らず既存の経路を使う。`git status` と `git log` で自分のファイルであることを確かめ、source の開発 repo では `.ut-tdd/state/foreign-edit-override` に理由を書いた one-shot の marker、consumer では人が設定する `UT_TDD_ALLOW_FOREIGN_EDIT=1` を使う。
- SubagentStop は 5 秒のまま据え置く。release が落ちても 5 分で自己回復し、影響は助言だけなので、待ち時間を延ばす利益が無い。負荷時には並列数の警告が実際より多く出ることがある。

## 6. 正規の値と置き場

| hook id | 予算 (秒) | 載る面 |
|---|---|---|
| `agent-guard` | 60 | Claude・Codex の 6 面すべて |
| `work-guard` | 60 | 同上 |
| `session-start` | 60 | 同上 |
| `post-tool-use` | 60 | 同上 |
| `session-summary` | 60 | 同上 |
| `claude-memory-wake` | 930 | Claude の 3 面 (source、生成物、mirror) |
| `subagent-stop` | 5 | Claude の 3 面 |

6 面は次のとおり。

1. source の `.claude/settings.json`
2. source の `.codex/hooks.json`
3. `src/setup/templates.ts` が生成する `adapter/.claude/settings.json` (`BUILTIN_GITHUB_TEMPLATES`)
4. 同じく `adapter/.codex/hooks.json`
5. mirror の `docs/templates/adapter/.claude/settings.json`
6. mirror の `docs/templates/adapter/.codex/hooks.json`

- **単一の定義**: `REQUIRED` (`src/lint/project-hook.ts`) の各 entry に `timeoutSeconds` を足し、`hookTimeoutSeconds(id)` がそれを返す。`src/setup/templates.ts` は Claude と Codex の両方の設定で、`timeout` の値を literal で書かず、`hookTimeoutSeconds(<その hook の id>)` から書く。issue #1057 の本文の時点では、#835 の修理が Claude の SessionStart だけに入り、Codex の生成物の SessionStart は 5 秒のまま残っていた。同じ id から両方を生成すれば、Claude と Codex の生成物は定義上ずれない。これは `wrapperHookArgs(id)` で command を生成している既存の形と同じである。
- source の 2 面と mirror の 2 面は静的な JSON なので、関数を参照できない。テストが literal の値で固定する (§9)。
- `analyzeProjectHooks` (lint) と consumer の setup smoke (`src/doctor/setup-smoke.ts`) には予算の検査を足さない。source の設定はテストが固定する。consumer の既存の設定を doctor で赤にすると、setup をやり直すまで consumer の CI が止まるからである (既存の consumer への周知は §10 の後続)。

## 7. 既存の契約との関係

- `session-log.md` §5 の「consumer記録hookのtimeout予算 (Issue #1057 / U-SLOG-010)」の 30 秒と「guard hook ... の予算は変更しない」は、本書が置き換える。同節の fail-open の扱い (記録の未保証、自動 retry や queue を持たない、detach する作業は予算の外) は残る。
- `docs/test-design/harness/L7-unit-test-design.md` の `U-SLOG-010` と `U-SLOG-011` の timeout の値の節 (30 秒、guard は対象外で不変) は、本書の oracle へ移す。両 ID の行の改訂は、`L7-unit-test-design.md` の凍結が解けた後の src を含まない PR で行う (§10)。実装 PR は、両 ID のテストと「source and consumer non-target hook timeouts remain unchanged」のテストから timeout の値の assertion を外す。値は本書の oracle だけが検査する。
- 失敗時の扱い (`onFailure`) の oracle (`U-HOOKEXEC-011`・`012`・`014`) は変えない。

## 8. 不変条件 (DbC)

| contract point | 不変条件 |
|---|---|
| pre | `hookTimeoutSeconds` の `id` は `RequiredProjectHookId` である。実行時に未知の id を受けたら、`wrapperHookArgs` と同じく `unknown required project hook id` で例外を投げる |
| post | `hookTimeoutSeconds(id)` は `REQUIRED` の当該 entry の `timeoutSeconds` を返す。値は §6 の表のとおりで、正の整数である |
| post | 生成物の 2 面では、各 hook の `timeout` が `hookTimeoutSeconds(その hook の id)` と number として一致する |
| invariant | guard の 2 つと同期の記録 hook の 3 つの予算は同じ値 (60) である |
| invariant | Claude の guard は `onFailure: "block"` を持ち、記録 hook は `onFailure` を持たない (`U-HOOKEXEC-014`、本書では変えない) |
| invariant | 6 面のどの hook も `async: true` を持たない (`claude-memory-wake` の `asyncRewake` は別の key で、本書の対象外) |
| invariant | consumer の Claude の adapter 文書の managed block は、§5.1 の節をそのまま含む |
| oracle | `CANDIDATE-U-HOOKBUDGET-001`〜`010` (`docs/test-design/harness/L7-hook-timeout-budget-test-design.md`) |

## 9. 実装の要点 (Green の PR で変えるファイル)

| ファイル | 変更 |
|---|---|
| `src/lint/project-hook.ts` | `RequiredProjectHook` に `timeoutSeconds: number` を足し、`REQUIRED` の 7 entry に §6 の値を入れる。`hookTimeoutSeconds(id)` を export する |
| `src/setup/templates.ts` | `adapter/.claude/settings.json` と `adapter/.codex/hooks.json` の `timeout` を `hookTimeoutSeconds(id)` から書く。`adapter/.claude/CLAUDE.md` の managed block に §5.1 の節を足す |
| `docs/templates/adapter/.claude/settings.json`、`docs/templates/adapter/.codex/hooks.json`、`docs/templates/adapter/.claude/CLAUDE.md` | 生成物と同じ値と節にする |
| `.claude/settings.json`、`.codex/hooks.json` | §6 の値にする |
| `tests/` | 本書の候補を `it.fails` から `it` に戻す。`U-SLOG-010`・`U-SLOG-011` と「non-target hook timeouts」のテストから timeout の値の assertion を外す (§7) |

`docs/design/` と `docs/test-design/` は実装 PR で変えない。

## 10. 受け入れ条件と後続

受け入れ条件。

1. 実装 PR の exact HEAD で `CANDIDATE-U-HOOKBUDGET-001`〜`010` (昇格後は `U-HOOKBUDGET-*`) が `it` として緑である。
2. `U-HOOKEXEC-011`・`012`・`014` が緑のままである (失敗時の扱いは変わらない)。
3. 手動の確認を 1 回ずつ PR に記録する (自動テストの oracle ではない)。実際の Claude Code で、(a) 10 秒止まってから exit 0 する guard を置くと tool が通る (5 秒では拒否されていた範囲が通る)、(b) 70 秒止まる guard を置くと tool が拒否される。(b) のとき model に届いた文言をそのまま記録する。
4. Codex の時間切れの挙動を主張しない (§5.2)。

後続 (本書では行わない)。

- `docs/test-design/harness/L7-unit-test-design.md` の `U-SLOG-010`・`U-SLOG-011` の行の改訂 (§7)。共有の文書の凍結が解けた後、src を含まない PR で本書の昇格と同時に行う。
- source の開発 repo の `.claude/CLAUDE.md` に §5.1 と同じ規律を書く (adapter の規律ファイルの改訂の範囲で行う)。
- consumer の実際の guard と記録 hook の全体の所要を、負荷時に同じ run で測る (bootstrap、2 つ目の node、hook 本体、I/O)。60 秒を超える値が出たら本書を改訂する。
- 方式 C (入口を軽くする) は、上の計測で phase ごとの所要が分かってから、issue #1057 の対応方針 2 として別に切り出す。
- 既存の consumer は、setup の confirm を経た上書きで新しい予算を受け取る。移行の仕組みは作らない。Pack のリリースノートで知らせる。
