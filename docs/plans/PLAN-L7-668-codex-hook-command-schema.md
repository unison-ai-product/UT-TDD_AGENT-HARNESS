---
plan_id: PLAN-L7-668-codex-hook-command-schema
title: "PLAN-L7-668 (troubleshoot): Codex hook の command 形式を現行 Codex の hook
  schema に合わせる"
kind: troubleshoot
layer: L7
drive: agent
route_signal: incident
route_mode: incident
created: 2026-09-18
updated: 2026-09-24
owner: Claude / Opus (freeze) · Claude worker (implementation)
backprop_decision: not_required
backprop_decision_reason: PLAN-L7-139 の意図 (Codex でも Claude と同じ guard /
  session-log entrypoint を hook で発火させる) は変えず、外部 (Codex) の hook schema に合わない設定形式の
  claim だけを訂正する修理であり、新しい契約を追加しない。
agent_slots:
  - role: aim
    slot_label: "AIM - Issue #668 の無音失敗 (args 非対応で bare node が exit 1) の原因と影響範囲を実測で確定する"
  - role: se
    slot_label: SE - .codex/hooks.json・setup テンプレート・lint・テストを本 PLAN の形式へ直す
  - role: tl
    slot_label: TL (Codex Sol) - 形式契約と guard の block 経路を非著者として監査する
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
parent_design: docs/plans/PLAN-L7-139-codex-hook-adapter.md
pair_artifact: docs/test-design/harness/L7-codex-hook-command-schema-test-design.md
generates:
  - artifact_path: docs/plans/PLAN-L7-668-codex-hook-command-schema.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-139-codex-hook-adapter.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-139-codex-hook-adapter.md
    - docs/plans/PLAN-L6-600-codex-review-wake-contract.md
    - docs/plans/PLAN-L7-628-pack-consumer-runtime-release-install.md
    - docs/test-design/harness/L7-codex-hook-command-schema-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/668
review_evidence: []
status: draft
github_issue_id: 668
supersedes:
  - PLAN-L7-139-codex-hook-adapter
admission_receipt:
  schema_version: v2
  receipt_id: certificate:573b02615136824d117ff3eed4f02705
  command_id: plan-revise:issue-668:pr669-r1-flag:r2:91d90924aaa3
  admitted_at: 2026-09-24T01:51:25.349Z
  source_digest: sha256:57eb8b536effba1ed22c25de7a1ecdedb945ead37ac38c3fb4be4cf89a155eae
  decision_digest: sha256:dc660e53a62087660ec4bf83d6a8a773f47d5be147118866823a480c75a8579f
  receipt_digest: sha256:baca50f5de94a87015c314f6a70bbd0246f30a6fd8332d1c355af3d86cb8d3b1
  binding:
    path: docs/plans/PLAN-L7-668-codex-hook-command-schema.md
    plan_id: PLAN-L7-668-codex-hook-command-schema
    asset_id: plan:650ef9bdf3c29a220f2b2ae89f66f9bf
    revision: 2
    content_digest: sha256:57eb8b536effba1ed22c25de7a1ecdedb945ead37ac38c3fb4be4cf89a155eae
  route:
    signal: incident
    mode: incident
  issue:
    provider: github
    issue_id: 668
    episode_id: E4-668-codex-hook-command-schema
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L7-139-codex-hook-adapter
    revision: 1
    digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  reentry:
    target_plan_id: PLAN-L7-668-codex-hook-command-schema
    target_revision: 2
    phase: forward_merge
  escape_reason: "PR #669 Sol r1 FLAG 4 件 (exit code 契約の分離、git root 解決と Windows
    実測、supersedes 復元、原因履歴の訂正) の是正改訂。"
  supersedes:
    - PLAN-L7-139-codex-hook-adapter
---

# PLAN-L7-668: Codex hook の command 形式を現行 Codex の hook schema に合わせる

## 1. 症状と原因 (実測)

Issue #668。Codex の project hook (`.codex/hooks.json`) が、SessionStart / PostToolUse / Stop と PreToolUse の
work-guard / agent-guard を含めて全て無音で失敗している。

| 観測 | 根拠 |
| --- | --- |
| repo の Codex session hook 記録は 2026-07-27 が最後 | `.ut-tdd/logs/session/019f*.jsonl` の最終 `ts` (2026-07-27T09:24Z)。以後の Codex session id (`01a0*`) の log は 0 件 |
| PO が `C:\dev\UT-TDD-agent-harness` で新規に開いた VS Code Codex スレッド 2 本でも記録 0 件 | rollout `01a0b443` / `01a0b449` (`originator=codex_vscode`、cwd 一致) に対し repo session log 0 件 |
| hooks.json 自体は読まれている | Codex GUI の hook パネルが matcher と statusMessage を表示する (PO 提供の画面、2026-09-18) |
| 現行 Codex の command handler が受理する field は `type` / `command` / `commandWindows` / `timeout` / `async` / `statusMessage` / `additionalContextLimit` だけで、`args` と `blockOnFailure` は存在しない | VS Code 拡張同梱 `codex.exe` (codex-cli 0.154.0-alpha.6.2) と npm 版 (0.153.4) の binary に埋め込まれた `HookHandlerConfig` の field 列。`blockOnFailure` の出現 0 件 |
| `args` が無視されると hook は引数なしの `node` を起動し、stdin の hook JSON を script として評価して SyntaxError・exit 1・stdout 空になる | `printf '<hook JSON>' \| node` を SessionStart / PreToolUse / Stop の 3 event で実行し、いずれも exit 1 |
| Codex は exit 0 / 2 以外を非ブロッキングの hook failure として扱う | Codex hooks 公式ドキュメント (learn.chatgpt.com/docs/hooks) |
| hook command は session cwd で実行される | 同公式ドキュメント。subdirectory で開いたスレッドでは repo 相対 path が解決できない |

誤った形式が今まで残ったのは、`PLAN-L7-139` の受入条件 2 と `src/lint/codex-hook-adapter.ts` が `blockOnFailure` の存在を
fail-close で要求し、`args` 形式を前提に entrypoint を照合していたためである (gate が誤形式を固定していた)。
文字列 command から `command` + `args` 形式への移行は 2026-07-22 の `747d5dc3` (`fix(hooks): remove remaining Windows Bun shims`)
である (`git show 747d5dc3 -- .codex/hooks.json`)。2026-07-27 までの Codex session log は、その時点で Codex が hook を起動して
entrypoint が実行されたことだけを示す。当時の Codex が `args` を schema として受理していたかは記録から確定できない
(当時の binary は手元に無い)。確定しているのは、現行 binary に `args` が無いことと、2026-07-27 以降の記録が 0 件であることである。

### 1.1 Windows 実測 (2026-09-24)

VS Code 拡張の Codex (`openai.chatgpt-26.917.62051`、`codex.exe app-server`、`features.code_mode_host=true`) で、
`C:\dev\UT-TDD-agent-harness` の新規スレッド (session `01a0d109-9361-7ed3-a2eb-967463fb0fb1`) を 1 ターン動かし、
一時的に入れた probe hook の記録を取った (Issue #668 comment 5805898943。probe は計測後に撤去)。

| 観測 | 結果 |
| --- | --- |
| hook を実行する shell | `pwsh.exe -NoProfile -Command "<command>"` (PowerShell 7)。親プロセスは `codex.exe` |
| 1 文字列 command `node .ut-tdd/cxprobe.mjs plain` | 起動した |
| `commandWindows` を併記した hook | Windows では `commandWindows` 側が実行された |
| `node "$(git rev-parse --show-toplevel)/.ut-tdd/cxprobe.mjs"` | 起動した (PowerShell の部分式として展開) |
| `%OS%` / `$env:OS` / `$SHELL` | `%OS%` は未展開、`$env:OS` は `Windows_NT`、`$SHELL` は空。cmd ではなく PowerShell の構文で解釈される |
| PreToolUse の `tool_name` (shell 実行) | `Bash`。`exec_command` / `local_shell` ではない |

未計測: `pwsh` の無い Windows で Codex が `powershell.exe` 5.1 か cmd へ fallback するか。`apply_patch` による編集の `tool_name`。

## 2. 設計判断

advisor: `ut-tdd advisor --decision progress --current-model claude-opus-5 --plan PLAN-L7-139-codex-hook-adapter --execute`
(2026-09-18、provider=claude、model=claude-fable-5)。判定は「方式は外部 schema で一意に決まるが、confirmed PLAN の claim と
それを強制する lint を変えるので、PLAN の freeze (PR-A) と実装 (PR-B) を分ける」。

| 論点 | 決定 | 理由 |
| --- | --- | --- |
| command の書き方 | `command` を 1 本の文字列にし、script path は git root から解決する: `node "$(git rev-parse --show-toplevel)/<repo 相対 script path>" [固定引数...]`。`args` を使わない | 現行 schema に `args` が無い。command は session cwd で実行されるため、repo 相対 path では subdirectory のスレッドで解決できない。git root 解決は Codex 公式ドキュメントの推奨であり、§1.1 で Windows (pwsh) 上の展開を実測した。POSIX shell でも `$(...)` は同じ意味になる |
| `blockOnFailure` | 削除する | schema に存在しない。guard の block は hook command 自身の exit 2 (PreToolUse の block 意味論) で行う |
| `commandWindows` | 使わない | §1.1 の実測で、同じ command 文字列が Windows の pwsh でそのまま展開・起動できた。Windows 専用の別経路を作ると 2 本の文字列が drift する。`pwsh` の無い Windows での fallback shell は未計測であり、本 PLAN は「Windows は pwsh 環境で実測済み、それ以外は未検証」とだけ主張する |
| 未知 field の扱い | lint は schema 外の field (`args`、`blockOnFailure`、`commandWindows` を含む) を fail-close する | Codex は未知 field を黙って無視するため、今回と同じ無音失敗を gate で防ぐ。`commandWindows` は schema 内だが本 PLAN の形式では使わないので、書かれていたら drift として拒否する |
| PostToolUse の matcher | `apply_patch\|write_file\|exec_command\|local_shell` に `Bash` を加える | §1.1 の実測で、shell 実行は `tool_name=Bash` で渡った。matcher を広げるのは実測で確定したこの 1 件だけにする |
| consumer テンプレート | `src/setup/templates.ts` の `adapter/.codex/hooks.json` も同じ形式にする | #418 の consumer に配布される。launcher を `node "$(git rev-parse --show-toplevel)/.ut-tdd/bin/ut-tdd.mjs" hook <name>` の 1 文字列で起動する |

advisor (実装方式): `gpt-5.6-sol` (2026-09-18) は git root 解決を推奨し、Windows の具体形は実 Codex の black-box 実測後に
freeze するよう求めた。本改訂はその実測 (§1.1) を根拠にしている。

## 3. 凍結する形式契約

1. `.codex/hooks.json` と consumer テンプレートの全 command hook は、field を
   `type` / `command` / `timeout` / `statusMessage` (必要なら `async` / `additionalContextLimit`) に限る。
   `args`、`blockOnFailure`、その他 schema 外の field を持たない。
2. `command` は `node "$(git rev-parse --show-toplevel)/<repo 相対 script path>" [固定引数...]` の 1 文字列とする。
   引用符と `$(git rev-parse --show-toplevel)` はこの固定の前置部分だけに許す。repo 相対 script path と固定引数は
   空白・引用符・shell 展開文字を含まない。interpreter だけの command (`node` 単体) を禁止する。
3. exit code の意味は既存の guard 契約をそのまま使い、本 PLAN では変えない。
   - work-guard: foreign な未 commit ファイルへの編集という**確定した deny だけ**を exit 2 で返す。stdin の parse 失敗・
     git / state の読み取り失敗・内部エラーのように判定できない場合は exit 0 (fail-open) のままである
     (`.claude/hooks/work-guard.ts` の exit 0 経路、`PLAN-L7-114-work-guard`)。
   - agent-guard: allowlist 外の spawn と、不正な stdin JSON は exit 2 (fail-close) である (`.claude/hooks/agent-guard.ts`)。
   - session-log 系 (SessionStart / PostToolUse / Stop) は fail-open である。
   本 PLAN が保証するのは「hooks.json の command が意図した entrypoint を起動し、その entrypoint が返した exit code が
   そのまま Codex に届く」ことだけである。work-guard を fail-close にする変更は本 PLAN の範囲外とする。
4. lint (`codex-hook-adapter`) は、(1)〜(2) に反する設定を typed finding で fail-close する。entrypoint の照合は
   `command` 文字列から (2) の固定前置部分を取り除いた repo 相対 script path と固定引数に対して、既存と同じ token-exact
   規則で行う。
5. test は hook 関数を直接呼ぶだけでなく、**hooks.json に書かれた `command` 文字列そのものを Codex と同じ shell 起動形で
   実行**し、exit code と副作用 (session log 1 行、guard の exit 2) を観測する。起動形は Linux が POSIX `sh -c`、Windows が
   §1.1 で実測した `pwsh -NoProfile -Command` である (`spawn(..., { shell: true })` は Windows で cmd を使うため、Codex の
   起動形の代わりにならない)。repository root と subdirectory の両方の cwd で実行する。設定形式が壊れて hook が別のものを
   起動する経路は、関数単体テストでは検出できないためである。

## 4. PLAN-L7-139 の訂正範囲

本 PLAN は `PLAN-L7-139` 全体を置き換えない。次の claim だけを訂正する。

- 受入条件 2 の「dropped `blockOnFailure` を fail-close」: 現行 Codex に存在しない field の存在を要求していた。
  本 PLAN §3.1 の「schema 外 field を fail-close」に置き換える。
- `U-CXHOOK-004` の `missing_block_on_failure`: 同上。
- 2026-06-29 follow-up discharge の「`blockOnFailure: true`」記述: 同上。

それ以外の `PLAN-L7-139` の契約 (Codex matcher、entrypoint parity、`$CLAUDE_PROJECT_DIR` 禁止、global `~/.codex/`
禁止、hosted API tool の非強制明示) は維持する。

## 5. 実装 (PR-B) と完了条件

PR-B (本 PLAN の freeze 後、Claude 著・Codex Sol review) は次を 1 PR で行う (同一契約の実装で 1 論点)。

1. `.codex/hooks.json` を §3 の形式へ直し、PostToolUse の matcher に `Bash` を加える (§2)。
2. `src/setup/templates.ts` の `adapter/.codex/hooks.json` を §3 の形式へ直す。
3. `src/lint/codex-hook-adapter.ts` と関連 test を §3.4 へ直す。
4. test-design の `CANDIDATE-CXHOOKCMD-001..005` を同じ番号の正式 oracle へ昇格する (Red → Green)。

完了条件:

1. PR-B の Linux / Windows CI green と非著者 closing receipt。
2. **実機確認** (`CANDIDATE-CXHOOKCMD-006`、CI 外): merge 後、PO が Codex で hooks を再 trust し、
   `C:\dev\UT-TDD-agent-harness` の新規スレッドで 1 ターン動かす。repo session log にその Codex session id の
   `session_start` / `tool_use` / `session_end` が記録され、foreign な未 commit ファイルへの編集で work-guard が
   block することを確認する。結果を Issue #668 に記録する。
3. 実機確認では、`apply_patch` による編集で PreToolUse / PostToolUse に渡る `tool_name` を記録する (shell 実行の
   `Bash` は §1.1 で計測済み)。work-guard の matcher (`apply_patch|write_file`) が編集の `tool_name` と一致しない場合は、
   matcher の追加を本 PLAN の範囲で扱わず、実測値を添えて別 slice に起票する (未計測のまま matcher を広げない)。

## 6. 非 Scope

- #600 の Codex 宛て通知経路 (本 PLAN の完了後に再開する)。
- Claude 側 `.claude/settings.json` の hook 形式 (Claude Code の schema は変わっていない)。
- hosted API / developer tool 経路の強制 (`PLAN-L7-139` の既存記述どおり、repo hook では強制できない)。
