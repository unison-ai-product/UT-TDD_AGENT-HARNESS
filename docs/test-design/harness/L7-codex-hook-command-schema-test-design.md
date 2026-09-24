---
layer: L7
executed_at_layer: L7
artifact: test-design
status: draft
plan_id: PLAN-L7-668-codex-hook-command-schema
github_issue_id: 668
---

# Codex hook の command 形式 (現行 Codex hook schema 準拠) の test design

`PLAN-L7-668` 専用の pair artifact である。`PLAN-L7-139` の `U-CXHOOK-001..009` は再採番しない。
`U-CXHOOK-004` の `missing_block_on_failure` 軸だけを本書の `CANDIDATE-CXHOOKCMD-002` が置き換える。

実行経路の oracle (003〜005) は、hook 関数を直接呼ぶのではなく、**hooks.json に書かれた `command` 文字列を
Codex と同じ shell 起動形でそのまま実行**する (stdin に hook JSON)。起動形は Linux が `sh -c <command>`、Windows が
`PLAN-L7-668` §1.1 で実測した `pwsh -NoProfile -Command <command>` である。`spawn(command, { shell: true })` は Windows で
cmd を使うため、Codex の起動形の代わりにしない。cwd は fixture の repository root と、その下の subdirectory の 2 通りで実行する。
fixture は一時ディレクトリだけを使い、開発 repository の `.ut-tdd/`・`harness.db`・OneDrive を操作しない。

| Oracle | 変異軸 / Given・When | 期待結果 |
| --- | --- | --- |
| `CANDIDATE-CXHOOKCMD-001` | commit 済みの `.codex/hooks.json` と、`setup` が consumer に生成する `.codex/hooks.json` を lint にかける | 両方とも `codex-hook-adapter - OK`。全 command hook の field が `type` / `command` / `timeout` / `statusMessage` (と任意の `async` / `additionalContextLimit`) に収まり、`command` は `node "$(git rev-parse --show-toplevel)/<script>" [args]` の 1 文字列である。PostToolUse の matcher は `Bash` を含む |
| `CANDIDATE-CXHOOKCMD-002` | 1 軸ずつ変異: (a) `"command": "node"` + `"args": [...]` (旧形式)、(b) `blockOnFailure` を追加、(c) schema 外の任意 field を追加、(d) `command` を interpreter 単体 (`node`) にする、(e) 固定前置部分の外の script path に空白・引用符・`---
layer: L7
executed_at_layer: L7
artifact: test-design
status: draft
plan_id: PLAN-L7-668-codex-hook-command-schema
github_issue_id: 668
---

# Codex hook の command 形式 (現行 Codex hook schema 準拠) の test design

`PLAN-L7-668` 専用の pair artifact である。`PLAN-L7-139` の `U-CXHOOK-001..009` は再採番しない。
`U-CXHOOK-004` の `missing_block_on_failure` 軸だけを本書の `CANDIDATE-CXHOOKCMD-002` が置き換える。

実行経路の oracle (003〜005) は、hook 関数を直接呼ぶのではなく、**hooks.json に書かれた `command` 文字列を
Codex と同じ shell 起動形でそのまま実行**する (stdin に hook JSON)。起動形は Linux が `sh -c <command>`、Windows が
`PLAN-L7-668` §1.1 で実測した `pwsh -NoProfile -Command <command>` である。`spawn(command, { shell: true })` は Windows で
cmd を使うため、Codex の起動形の代わりにしない。cwd は fixture の repository root と、その下の subdirectory の 2 通りで実行する。
fixture は一時ディレクトリだけを使い、開発 repository の `.ut-tdd/`・`harness.db`・OneDrive を操作しない。

| Oracle | 変異軸 / Given・When | 期待結果 |
| --- | --- | --- |
| `CANDIDATE-CXHOOKCMD-001` | commit 済みの `.codex/hooks.json` と、`setup` が consumer に生成する `.codex/hooks.json` を lint にかける | 両方とも `codex-hook-adapter - OK`。全 command hook の field が `type` / `command` / `timeout` / `statusMessage` (と任意の `async` / `additionalContextLimit`) に収まり、`command` は `node "$(git rev-parse --show-toplevel)/<script>" [args]` の 1 文字列である。PostToolUse の matcher は `Bash` を含む |
| `CANDIDATE-CXHOOKCMD-002` | 1 軸ずつ変異: (a) `"command": "node"` + `"args": [...]` (旧形式)、(b) `blockOnFailure` を追加、(c) schema 外の任意 field を追加、(d) `command` を interpreter 単体 (`node`) にする、 を含める、(f) git root 解決を外した repo 相対 command (`node .claude/hooks/work-guard.ts`)、(g) `commandWindows` を追加 | 全て typed finding で fail-close (`unsupported_hook_field` / `bare_interpreter_command` / `unsafe_command_token` / `unrooted_command_path`)。(a) は repo の実 fixture として 2026-09-18 以前の `.codex/hooks.json` の形を使う |
| `CANDIDATE-CXHOOKCMD-003` | hooks.json の SessionStart / PostToolUse / Stop の `command` 文字列を、fixture の repository root と subdirectory の両方の cwd で、上記の起動形で実行し、stdin に各 event の hook JSON を渡す (Linux / Windows CI の両方) | どちらの cwd でも各 command が exit 0 で終わり、fixture の session log に対応する event (`session_start` / `tool_use` / `session_end`) が 1 行ずつ増える。変異として command を旧形式 (`node` 単体) に戻すと exit 1・log 増加 0 になり、git root 解決を外した repo 相対 command にすると subdirectory の cwd で exit 1 になり、いずれも oracle が失敗する |
| `CANDIDATE-CXHOOKCMD-004` | hooks.json の work-guard の `command` 文字列を上記の起動形で、repository root と subdirectory の両方の cwd で実行する。stdin は (a) foreign な未 commit ファイルへの `apply_patch`、(b) 自 session のファイルへの `apply_patch` | (a) exit 2 (block)、(b) exit 0。agent-guard も同様に allowlist 外の `spawn_agent` で exit 2、allowlist 内で exit 0。`blockOnFailure` に依存せず、確定 deny の block が成立することを示す (work-guard の判定不能時 exit 0 は既存契約のまま検査対象にしない) |
| `CANDIDATE-CXHOOKCMD-005` | consumer テンプレートが生成する hooks.json の各 `command` 文字列を、launcher (`node "$(git rev-parse --show-toplevel)/.ut-tdd/bin/ut-tdd.mjs" hook <name>`) 経由で上記の起動形で実行する (active runtime 不在の fixture) | launcher が起動し、runtime 不在時は既存契約どおり exit 78 (`consumer_runtime_absent`) を返す (引数が落ちて `node` 単体が SyntaxError になる経路と区別できる)。command 文字列の token が launcher path と hook 名に一致する |
| `CANDIDATE-CXHOOKCMD-006` | (CI 外の実機確認) merge 後、PO が Codex で hooks を再 trust し、`C:\dev\UT-TDD-agent-harness` の新規スレッドで 1 ターン動かす。foreign な未 commit ファイルへの `apply_patch` 編集を 1 回試みる | repo session log にその Codex session id の `session_start` / `tool_use` / `session_end` が記録される。work-guard が foreign 編集を block する。`apply_patch` 編集で PreToolUse / PostToolUse に渡った `tool_name` を記録する (shell 実行の `Bash` は計測済み)。結果と証跡を Issue #668 に残す |

## 実装時の昇格と証跡

001〜005 は同じ番号の正式 oracle と実テストへ昇格し、Red→Green、exact HEAD、Linux / Windows CI、非著者 review receipt を
束ねる。006 は CI 外の実機確認であり、テストへ昇格しない (Issue #668 の記録を証跡とする)。
