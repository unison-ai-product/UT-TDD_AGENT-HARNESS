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
updated: 2026-09-18
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
admission_receipt:
  schema_version: v2
  receipt_id: certificate:650ef9bdf3c29a220f2b2ae89f66f9bf
  command_id: plan-draft:issue-668:codex-hook-command-schema:1
  admitted_at: 2026-09-18T11:49:40.288Z
  source_digest: sha256:9af836db3c818e28736cc2d0f871a222025f8f60b632f9cb290ee736f1f2a4d8
  decision_digest: sha256:4a863f2660eebfdc7cf9a75239461e4e879b707430268261cc4f2ae22c9808d5
  receipt_digest: sha256:e7de173bc0a20c334f34ae6fa0cf59ef9924d615392768b53382b4959f0a14af
  binding:
    path: docs/plans/PLAN-L7-668-codex-hook-command-schema.md
    plan_id: PLAN-L7-668-codex-hook-command-schema
    asset_id: plan:650ef9bdf3c29a220f2b2ae89f66f9bf
    revision: 1
    content_digest: sha256:9af836db3c818e28736cc2d0f871a222025f8f60b632f9cb290ee736f1f2a4d8
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
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #668: 現行 Codex の hook schema に args / blockOnFailure
    が無く、Codex の project hook が全て無音で失敗している。PLAN-L7-139 の形式 claim を訂正する
    troubleshoot"
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

誤った形式が今まで残ったのは、`PLAN-L7-139` の受入条件 2 と `src/lint/codex-hook-adapter.ts` が `blockOnFailure` の存在を
fail-close で要求し、`args` 形式を前提に entrypoint を照合していたためである (gate が誤形式を固定していた)。
2026-07-13 (`8b8299f7`) に文字列 command から `command` + `args` 形式へ移行した時点の Codex は `args` を受理しており、
2026-07-27 まで記録が残っている。その後の Codex 更新で `args` が schema から外れた。

## 2. 設計判断

advisor: `ut-tdd advisor --decision progress --current-model claude-opus-5 --plan PLAN-L7-139-codex-hook-adapter --execute`
(2026-09-18、provider=claude、model=claude-fable-5)。判定は「方式は外部 schema で一意に決まるが、confirmed PLAN の claim と
それを強制する lint を変えるので、PLAN の freeze (PR-A) と実装 (PR-B) を分ける」。

| 論点 | 決定 | 理由 |
| --- | --- | --- |
| command の書き方 | `command` を 1 本の文字列にする (例 `node .claude/hooks/work-guard.ts`)。`args` を使わない | 現行 schema に `args` が無い。文字列 command は 2026-06 時点の形式でもあり、Codex が shell 経由で実行する |
| `blockOnFailure` | 削除する | schema に存在しない。guard の block は hook command 自身の exit 2 (PreToolUse の block 意味論) で行う。既存 work-guard / agent-guard は block 時に exit 2 を返す |
| `commandWindows` | 使わない | 同じ文字列が PowerShell / cmd / POSIX shell の全てで同じ意味になる (空白を含まない repo 相対 path と固定引数だけで構成する)。Windows 専用の別経路を作らない |
| 未知 field の扱い | lint は schema 外の field (`args`、`blockOnFailure` を含む) を fail-close する | Codex は未知 field を黙って無視するため、今回と同じ無音失敗を gate で防ぐ |
| consumer テンプレート | `src/setup/templates.ts` の `adapter/.codex/hooks.json` も同じ形式にする | #418 の consumer に配布される。launcher 経由の `node .ut-tdd/bin/ut-tdd.mjs hook <name>` を 1 本の文字列にする |

## 3. 凍結する形式契約

1. `.codex/hooks.json` と consumer テンプレートの全 command hook は、field を
   `type` / `command` / `timeout` / `statusMessage` (必要なら `async` / `additionalContextLimit`) に限る。
   `args`、`blockOnFailure`、その他 schema 外の field を持たない。
2. `command` は `node <repo 相対 script path> [固定引数...]` の 1 文字列とする。script path と引数は空白・引用符・
   shell 展開文字を含まない。interpreter だけの command (`node` 単体) を禁止する。
3. guard (work-guard / agent-guard) の block は hook command の exit 2 で表現する。guard の hook は timeout を持ち、
   fail-open にしてよいのは session-log 系だけである (既存 `PLAN-L6-03` の fail-open / fail-close 区分を変えない)。
4. lint (`codex-hook-adapter`) は、(1)〜(3) に反する設定を typed finding で fail-close する。entrypoint の照合は
   `command` 文字列を空白で分割した token に対して、既存と同じ token-exact 規則で行う。
5. test は hook 関数を直接呼ぶだけでなく、**hooks.json に書かれた `command` 文字列そのものを shell 経由で実行**し、
   exit code と副作用 (session log 1 行、guard の exit 2) を観測する。設定形式が壊れて hook が別のものを起動する
   経路を、関数単体テストでは検出できないためである。

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

1. `.codex/hooks.json` を §3 の形式へ直す。
2. `src/setup/templates.ts` の `adapter/.codex/hooks.json` を §3 の形式へ直す。
3. `src/lint/codex-hook-adapter.ts` と関連 test を §3.4 へ直す。
4. `CANDIDATE-CXHOOKCMD-001..005` を `U-CXHOOKCMD-001..005` へ昇格する (Red → Green)。

完了条件:

1. PR-B の Linux / Windows CI green と非著者 closing receipt。
2. **実機確認** (`CANDIDATE-CXHOOKCMD-006`、CI 外): merge 後、PO が Codex で hooks を再 trust し、
   `C:\dev\UT-TDD-agent-harness` の新規スレッドで 1 ターン動かす。repo session log にその Codex session id の
   `session_start` / `tool_use` / `session_end` が記録され、foreign な未 commit ファイルへの編集で work-guard が
   block することを確認する。結果を Issue #668 に記録する。
3. 実機確認では、現行 Codex GUI のコードモード (`exec` ツールが内側で `tools.exec_command` / `apply_patch` を呼ぶ) で
   PreToolUse / PostToolUse に渡る `tool_name` を記録する。matcher (`apply_patch|write_file`、
   `apply_patch|write_file|exec_command|local_shell`) が一致しない場合は、matcher の追加を本 PLAN の範囲で扱わず、
   実測値を添えて別 slice に起票する (未計測のまま matcher を広げない)。

## 6. 非 Scope

- #600 の Codex 宛て通知経路 (本 PLAN の完了後に再開する)。
- Claude 側 `.claude/settings.json` の hook 形式 (Claude Code の schema は変わっていない)。
- hosted API / developer tool 経路の強制 (`PLAN-L7-139` の既存記述どおり、repo hook では強制できない)。
