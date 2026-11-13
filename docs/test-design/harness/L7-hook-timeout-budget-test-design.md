---
title: "L7 hook timeout budget test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/hook-timeout-budget.md
status: confirmed
updated: 2026-11-13
issue: 1057
---

# hook の時間切れの予算と扱いテスト設計 (issue #1057)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/hook-timeout-budget.md` (未実装の目標契約) の §3 hook の分類、§5 時間切れの扱い、§6 正規の値と置き場、§8 不変条件である。共有の `docs/test-design/harness/L7-unit-test-design.md` には索引行を足さない。本書が詳細の正本であり、oracle を候補 ID `CANDIDATE-U-HOOKBUDGET-001` から宣言する。接頭辞 `HOOKBUDGET` は 2026-11-13 の origin/main (`09ce4e761`) で `git grep` して、既存の oracle と重ならないことを確かめた。

oracle は、正しい実装に 1 つだけ加えた変異 (§3) を基準に設計した。各変異を赤にする oracle は本書の中でちょうど 1 つで、各 oracle は少なくとも 1 つの変異を赤にする (§5)。

## 2. fixture とテストレベル

- **unit**: `src/lint/project-hook.ts` を namespace import (`import * as projectHook from ...`) で読み、`projectHook.hookTimeoutSeconds` を呼ぶ。名前つき import にしないのは、Red の時点で export が無くても collection で落ちず、assertion で赤になるようにするためである。生成物は `src/setup/templates.ts` の `BUILTIN_GITHUB_TEMPLATES` の `adapter/.claude/settings.json`・`adapter/.codex/hooks.json`・`adapter/.claude/CLAUDE.md` を読む。
- **static**: 開発 repo の `.claude/settings.json`・`.codex/hooks.json` と、mirror の `docs/templates/adapter/.claude/settings.json`・`docs/templates/adapter/.codex/hooks.json`・`docs/templates/adapter/.claude/CLAUDE.md` を読む。読むだけで書かない。開発 repo を読むので、テストファイルの登録行を `src/doctor/test-repository-isolation.ts` の `repositoryReadContracts` に足す (§6)。
- **hook の同定**: 設定の hook は、event と、`args` (Claude) または `command` (Codex) に含まれる entrypoint の語で id に対応づける。`agent-guard`・`work-guard` は PreToolUse の `agent-guard`・`work-guard`、`session-start` は SessionStart、`post-tool-use` は PostToolUse の `post-tool-use`、`session-summary` は Stop の `summary`、`claude-memory-wake` は Stop の `claude-memory-wake`、`subagent-stop` は SubagentStop である。表の各 id にちょうど 1 つの hook が当たらなければ、その面の oracle は赤になる。
- **予算の literal**: 期待値は次の表の literal でテストに持ち、`hookTimeoutSeconds` や `REQUIRED` から組み立てない (002・003 の関係の oracle を除く)。定数と期待値を同時に書き換えると、照合が必ず一致するからである。

| id | 予算 (秒) | 面 |
|---|---|---|
| `agent-guard`・`work-guard` | 60 | Claude・Codex |
| `session-start`・`post-tool-use`・`session-summary` | 60 | Claude・Codex |
| `claude-memory-wake` | 930 | Claude |
| `subagent-stop` | 5 | Claude |

- **adapter 文書の節**: 期待値は L6 §5.1 の fenced block の中身 6 行 (見出し、空行、4 つの箇条) を literal でテストに持つ。比較は改行を LF に正規化してから行い、`<!-- UT-TDD:managed:start -->` と `<!-- UT-TDD:managed:end -->` の間に、その 6 行が連続して含まれることを確かめる。

## 3. 変異の一覧

正しい実装 (L6 §6・§9) に次の変異を 1 つだけ加えたものを反例とする。

| ID | 変異 |
|---|---|
| M1 | `REQUIRED` の `agent-guard` の予算が 5 (旧値) |
| M2 | `REQUIRED` の `post-tool-use` の予算が 30 (旧値) |
| M3 | `REQUIRED` の `claude-memory-wake` が 60 (一律にそろえすぎ) |
| M4 | `REQUIRED` の `subagent-stop` が 60 |
| M5 | `hookTimeoutSeconds` が未知の id に例外を投げず 60 を返す |
| M6 | 生成する Claude の設定の guard 2 つが literal の 5 のまま (`hookTimeoutSeconds` を使わない) |
| M7 | 生成する Claude の設定の SessionStart が literal の 30 のまま |
| M8 | 生成する Claude の設定の claude-memory-wake が `hookTimeoutSeconds("session-summary")` を使う |
| M9 | 生成する Codex の設定の guard 2 つが literal の 5 のまま |
| M10 | 生成する Codex の設定の Stop が literal の 30 のまま |
| M11 | 生成する Codex の設定の PostToolUse の `timeout` が文字列 `"60"` |
| M12 | mirror の Claude の設定の guard 2 つが 5 |
| M13 | mirror の Claude の設定の SubagentStop が 60 |
| M14 | mirror の Codex の設定の PostToolUse が 30 |
| M15 | source の `.claude/settings.json` の guard 2 つが 5 |
| M16 | source の `.claude/settings.json` の claude-memory-wake が 60 |
| M17 | source の `.claude/settings.json` の SessionStart が 30 |
| M18 | source の `.codex/hooks.json` の SessionStart が 30 |
| M19 | source の `.codex/hooks.json` の work-guard が 5 |
| M20 | 生成する Claude の設定の PostToolUse に `async: true` |
| M21 | source の `.codex/hooks.json` の Stop に `async: true` |
| M22 | mirror の Claude の設定の work-guard に `async: true` |
| M23 | 生成する adapter の `.claude/CLAUDE.md` に L6 §5.1 の節が無い |
| M24 | 生成する adapter の `.claude/CLAUDE.md` の節から箇条が 1 つ欠ける |
| M25 | 生成する adapter の `.claude/CLAUDE.md` の節が managed block の外にある |
| M26 | mirror の `docs/templates/adapter/.claude/CLAUDE.md` に節が無い |
| M27 | mirror の `docs/templates/adapter/.claude/CLAUDE.md` の節の `node -e "1"` が別のコマンドに変わる |

**検出しない等価な変異** (出力が正しい実装と同じなので、どの oracle も赤にしない):

- E1: 生成する設定のある hook が、`hookTimeoutSeconds` を呼ばずに同じ値の literal (60) を書く。値が変わらないので出力は同じである。後で `REQUIRED` の値を変えたときに、002・003 が置き去りの literal を赤にする。
- E2: 生成する Codex の設定の work-guard が `hookTimeoutSeconds("agent-guard")` を使う。2 つの値が同じ (60) 間は出力が同じである。
- E3: hook に `async: false` を書く。`async` が無い場合と挙動が同じである。

**本書の外の oracle が受け持つ変異** (§5 の表に入れない):

- guard の `onFailure: "block"` を外す、記録 hook に `onFailure: "block"` を足す、`blockOnFailure` を足す: `U-HOOKEXEC-011`・`012`・`014` (`docs/test-design/harness/L7-claude-hook-onfailure-test-design.md`)。
- Codex の hooks.json に未対応の field を足す: `U-CXHOOKCMD-002`。

## 4. 候補の oracle

| ID | レベル | 入力 | 期待 | 落とす変異 |
|---|---|---|---|---|
| `CANDIDATE-U-HOOKBUDGET-001` | unit | `projectHook.hookTimeoutSeconds` を 7 つの id と、未知の id (`"no-such-hook"` を型の外から渡す) で呼ぶ | 最初の assertion は「`hookTimeoutSeconds` が関数である」。続けて、7 つの id の値が §2 の表の literal と一致し、未知の id は `unknown required project hook id` を含む例外を投げる | M1–M5 |
| `CANDIDATE-U-HOOKBUDGET-002` | unit | 生成する `adapter/.claude/settings.json` を JSON として読む | 最初の assertion は「`hookTimeoutSeconds` が関数である」。続けて、すべての hook が §2 の同定でちょうど 1 つの id に当たり、各 hook の `timeout` が number で、`hookTimeoutSeconds(その id)` と一致する (関係の oracle。literal は持たない) | M6–M8 |
| `CANDIDATE-U-HOOKBUDGET-003` | unit | 生成する `adapter/.codex/hooks.json` を JSON として読む | 002 と同じ検査を Codex の 5 つの id について行う | M9–M11 |
| `CANDIDATE-U-HOOKBUDGET-004` | static | mirror の `docs/templates/adapter/.claude/settings.json` | (a) `agent-guard` と `work-guard` がちょうど 1 つずつあり、どちらも `timeout` が 60。加えて、PreToolUse の hook のうち `onFailure: "block"` を持つものは、すべて `timeout` が 60。(b) `session-start`・`post-tool-use`・`session-summary` が 60、`claude-memory-wake` が 930、`subagent-stop` が 5 | M12、M13 |
| `CANDIDATE-U-HOOKBUDGET-005` | static | mirror の `docs/templates/adapter/.codex/hooks.json` | (a) `agent-guard` と `work-guard` がちょうど 1 つずつあり、PreToolUse の hook はすべて `timeout` が 60 (Codex の PreToolUse の hook はすべて guard である)。(b) `session-start`・`post-tool-use`・`session-summary` が 60 | M14 |
| `CANDIDATE-U-HOOKBUDGET-006` | static | source の `.claude/settings.json` | 004 と同じ検査 | M15–M17 |
| `CANDIDATE-U-HOOKBUDGET-007` | static | source の `.codex/hooks.json` | 005 と同じ検査 | M18、M19 |
| `CANDIDATE-U-HOOKBUDGET-008` | unit + static | 6 面 (生成物 2、mirror 2、source 2) の全 hook | どの hook も `async` が `true` でない。`asyncRewake` は見ない | M20–M22 |
| `CANDIDATE-U-HOOKBUDGET-009` | unit | 生成する `adapter/.claude/CLAUDE.md` | managed block の中に、L6 §5.1 の 6 行が連続して含まれる | M23–M25 |
| `CANDIDATE-U-HOOKBUDGET-010` | static | mirror の `docs/templates/adapter/.claude/CLAUDE.md` | 009 と同じ検査 | M26、M27 |

004 と 006 の (a) は、今後 PreToolUse に `onFailure: "block"` で足す guard (L6 §3) にも 60 を求める。足す側の実装 PR は、その guard の `timeout` を 60 にしないとこの oracle を赤にする。

## 5. 変異と oracle の対応表

行は変異、列は oracle の番号 (`CANDIDATE-U-HOOKBUDGET-` を省いた数字)。`●` はその oracle の assertion が赤になることを示す。空欄は緑である。各行の `●` は 1 つだけで、各列に `●` が 1 つ以上ある。最終行は正しい実装で、どの oracle も緑になる。

| 変異 | 001 | 002 | 003 | 004 | 005 | 006 | 007 | 008 | 009 | 010 |
|---|---|---|---|---|---|---|---|---|---|---|
| M1 `REQUIRED` guard 5 | ● | | | | | | | | | |
| M2 `REQUIRED` post-tool-use 30 | ● | | | | | | | | | |
| M3 `REQUIRED` memory-wake 60 | ● | | | | | | | | | |
| M4 `REQUIRED` subagent-stop 60 | ● | | | | | | | | | |
| M5 未知の id で例外を投げない | ● | | | | | | | | | |
| M6 生成 Claude guard literal 5 | | ● | | | | | | | | |
| M7 生成 Claude SessionStart literal 30 | | ● | | | | | | | | |
| M8 生成 Claude memory-wake の id 違い | | ● | | | | | | | | |
| M9 生成 Codex guard literal 5 | | | ● | | | | | | | |
| M10 生成 Codex Stop literal 30 | | | ● | | | | | | | |
| M11 生成 Codex の timeout が文字列 | | | ● | | | | | | | |
| M12 mirror Claude guard 5 | | | | ● | | | | | | |
| M13 mirror Claude SubagentStop 60 | | | | ● | | | | | | |
| M14 mirror Codex PostToolUse 30 | | | | | ● | | | | | |
| M15 source Claude guard 5 | | | | | | ● | | | | |
| M16 source Claude memory-wake 60 | | | | | | ● | | | | |
| M17 source Claude SessionStart 30 | | | | | | ● | | | | |
| M18 source Codex SessionStart 30 | | | | | | | ● | | | |
| M19 source Codex work-guard 5 | | | | | | | ● | | | |
| M20 生成 Claude PostToolUse `async` | | | | | | | | ● | | |
| M21 source Codex Stop `async` | | | | | | | | ● | | |
| M22 mirror Claude work-guard `async` | | | | | | | | ● | | |
| M23 生成 adapter 文書に節が無い | | | | | | | | | ● | |
| M24 生成 adapter 文書の箇条が欠ける | | | | | | | | | ● | |
| M25 生成 adapter 文書の節が managed の外 | | | | | | | | | ● | |
| M26 mirror adapter 文書に節が無い | | | | | | | | | | ● |
| M27 mirror adapter 文書の `node -e "1"` が違う | | | | | | | | | | ● |
| 正しい実装 | | | | | | | | | | |

一対一の確かめ方: 6 面の設定、`REQUIRED`、生成の写像 (各 hook が `hookTimeoutSeconds` を呼ぶか literal を書くか、どの id を渡すか)、adapter 文書の managed block を data として持つ使い捨てのモデルを書き (repo には入れない)、正しい実装、M1–M27、E1–E3 に本書の oracle をそのまま評価させた。正しい実装で 10 件すべてが緑、M1–M27 の各行で赤が 1 件だけ、各 oracle が 1 件以上の変異を赤にし、E1–E3 でどの oracle も赤にならないことを確かめた (2026-11-13)。

002 と 003 は `hookTimeoutSeconds` との関係だけを見るので、M1–M5 (`REQUIRED` と関数の変異) では緑のままである。004–007 は静的な JSON なので、`REQUIRED` や生成の写像の変異では変わらない。この 2 つの分け方で、`REQUIRED` の変異は 001 だけが、生成の写像の変異は 002・003 だけが、静的な面の変異は 004–007 だけが赤にする。

## 6. Red と昇格の手順

設計書保護の三段階 (`design-protection-diff-gate.md` §10.2・§10.3) に従う。004–007・010 と 008 の static の部分は開発 repo を読むので、§10.3 の順序で分ける。

1. **登録 + Red**: 新しいテストファイル (例: `tests/hook-timeout-budget.test.ts`) に候補 ID を引用したテストを入れ、`repositoryReadContracts` に登録行だけを足す。origin/main の状態での区分は次のとおり。
   - `it.fails` (HEAD で赤): 001・002・003 (`hookTimeoutSeconds` が無い)、004–007 (5 秒と 30 秒のまま)、009・010 (節が無い)。
   - `it` (HEAD でも緑の guard): 008 (今の 6 面に `async: true` は無い)。
2. **昇格 (src を含まない)**: `CANDIDATE-U-HOOKBUDGET-*` を `U-HOOKBUDGET-*` へ全件改め、テスト名の引用を同時に書き換える。同じ PR で、`docs/test-design/harness/L7-unit-test-design.md` の `U-SLOG-010`・`U-SLOG-011` の行から timeout の値の節 (30 秒、guard は対象外で不変) を外し、本書への参照に置き換える (L6 §7)。`L7-unit-test-design.md` は共有の文書であり、凍結が解けるまでこの手順を進めない。
3. **実装 PR**: L6 §9 のとおり src と設定を変え、`it.fails` を `it` に戻す。`U-SLOG-010`・`U-SLOG-011` と「source and consumer non-target hook timeouts remain unchanged」のテストから timeout の値の assertion を外す (値は本書の oracle だけが検査する)。実装 PR は `docs/design/` と `docs/test-design/` を変えない。

Red / Green の証拠は、それぞれの PR の committed HEAD に対する snapshot の実行 (`node scripts/run-vitest-snapshot.ts <test file>`) である。

## 7. 手動の確認 (oracle ではない)

L6 §10 の受け入れ条件 3 の手動の確認は、自動テストの oracle ではない。実装 PR に結果を記録する。

- 実際の Claude Code で、10 秒止まってから exit 0 する guard を `onFailure: "block"`・`timeout: 60` で置くと、tool が通る。
- 同じく 70 秒止まる guard では、tool が拒否される。このとき model に届いた文言をそのまま記録する。
- Codex の guard の時間切れは、`CANDIDATE-U-HOOKEXEC-017` (`docs/test-design/harness/L7-codex-hook-failure-test-design.md`) の手順で測る。本書では結果を主張しない。
