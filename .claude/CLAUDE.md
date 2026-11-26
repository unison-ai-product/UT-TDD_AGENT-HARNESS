# Claude Code Runtime Policy - UT-TDD Agent Harness

本ファイルは 10,000 文字以下に保つ (PO 指示 2026-11-26)。移した節の本文は `docs/governance/operating-rules-claude.md` にある (以下 `C`)。Hooks 一覧・Allowlist・Adapter Rule Markers は機械照合のためここに原文で残す。

## Active Runtime Boundary

This repository's Claude Code runtime is part of UT-TDD Agent Harness.
Legacy-source-derived hooks, subagents, memory, and `legacy local state/`
are historical or migration material. They are not current runtime state or
execution paths.

Current runtime boundary:

- Runtime CLI: `ut-tdd`
- Runtime state: `.ut-tdd/`
- Core implementation: `src/`
- Hook configuration: `.claude/settings.json`

Claude Code read priority is `../CLAUDE.md` -> this file ->
`../docs/governance/README.md`. Codex project rules are in `../AGENTS.md`.

## Hooks

Active hooks in `.claude/settings.json` must call package-local UT-TDD commands
only. Do not enable hooks that depend on personal legacy runtime paths.

- `PreToolUse(Agent|Task)`: `node ${CLAUDE_PROJECT_DIR}/.claude/hooks/agent-guard.ts`
- `PreToolUse(Edit|Write|MultiEdit)`: `node ${CLAUDE_PROJECT_DIR}/.claude/hooks/work-guard.ts`
- `SessionStart`: `node ${CLAUDE_PROJECT_DIR}/src/cli.ts session start`
- `PostToolUse(Edit|Write|MultiEdit|Bash|PowerShell)`: `node ${CLAUDE_PROJECT_DIR}/src/cli.ts hook post-tool-use`
- `Stop`: `node ${CLAUDE_PROJECT_DIR}/src/cli.ts session summary`
- `Stop`: `node ${CLAUDE_PROJECT_DIR}/src/cli.ts hook claude-memory-wake`
- `SubagentStop`: `node ${CLAUDE_PROJECT_DIR}/src/cli.ts hook subagent-stop`

この一覧は `.claude/settings.json` と機械照合される (`U-RDRIFT-007`)。片側だけを書き換えると
fail-close するので、hook を足す・変える場合は両方を同時に更新すること。

hook・CLI・検査の実行系は Node.js とする (`package.json` の `utTdd.nodeToolchain.nodeAuthority`、#134)。

## Doctor Invocation Discipline (PLAN-L7-442)

`ut-tdd doctor` is a singleton: exit 2 means another run is active, so **wait**; never retry or re-launch in another form. Use `--scope` for a slice. 本文は C §Doctor Invocation Discipline (PLAN-L7-442) の本文 (doctor を起動するとき)。

## 設計と作業の正本

設計文書と GitHub Issue の扱いは `../CLAUDE.md` §設計と作業の正本 に従う。

## Runtime And Delegation

Current command path:

- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Handover: `ut-tdd handover`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude delegation: `ut-tdd claude --role <role> --task "..."`
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`

Runtime mode is one of `standalone`, `claude-only`, `codex-only`, or `hybrid`.
In `hybrid`, judgement gates MUST use a different runtime / model family (a
same-family reviewer is rejected, `same_family_reviewer_denied` in
`src/feedback/review-admission-check.ts`). In single-runtime modes, record `intra_runtime_subagent` review
evidence as the substitute.

Do not make raw `codex exec` or raw `claude` the normal path for UT-TDD work.
Use UT-TDD wrappers so session lifecycle, handover warnings, and audit evidence
can be recorded.

## 着手前 advisor 合意形成 (PO ルール 2026-07-28、Claude 固有)

設計・実装・修正の方式判断は着手前に `ut-tdd advisor` で合意形成する。本文は C §着手前 advisor 合意形成 (方式判断をするとき)。

## 委譲と判断層 (PO ルール 2026-07-28、Claude 固有)

作業は下位モデルへ委ね、判断層を厚くする。review は成果物を書いていない family の上位モデルで行う。本文は C §委譲と判断層 (委譲・review するとき)。

### あなたが○○なら (指揮モデル別の振る舞い、PO ルール 2026-10-09)

指揮モデル別の相談先と委譲先の表。本文は C §あなたが○○なら (指揮を担うとき)。

### lane 間の依頼

止まったら待たずに依頼をかける。正本は `../CLAUDE.md` §lane 間の依頼 (本文は C §lane 間の依頼)。

### 唯一の回避条件: 利用上限による停止

委譲・cross-review の構造を外してよいのは、担当 family のモデルが利用上限で停止したときだけ。本文は C §唯一の回避条件: 利用上限による停止。

## Native Tool Invocation

Claude Code tools must be invoked through Claude Code's native tool-use
mechanism only. Never print or continue XML-like pseudo tool calls such as
`<invoke name="Bash">`, `<parameter name="command">`, or role markers such as
`court`.

If a previous transcript contains XML-like pseudo tool calls, treat that
transcript as corrupted context. Do not echo, repair, or continue the XML. Use
the native Claude Code tool UI for Read/Grep/Bash/Edit/Write, or provide a
plain fenced command for a human to run if the native tool is unavailable.

## Subagent Guard

`PreToolUse(Agent|Task)` uses `node "${CLAUDE_PROJECT_DIR}/.claude/hooks/agent-guard.ts"`. Rules 1-7 and `blind-reviewer`: C §Subagent Guard の規則本文. A subagent has no closing authority; `fable` is not allowed; bypass only with `UT_TDD_ALLOW_RAW_AGENT=1`.

Allowlist:

- `general-purpose`
- `Explore`
- `Plan`
- `claude`

## Parallel Task Limit

Default upper limit **8** concurrent subagent slots (`DEFAULT_MAX_PARALLEL`, `src/runtime/agent-slots.ts`, fail-open advisory). 本文は C §Parallel Task Limit の本文。

## Guard Rules

Escalate before auth / payments / PII / licenses / production / destructive / external API changes. foreign-edit override (`UT_TDD_ALLOW_FOREIGN_EDIT=1` or one-shot `.ut-tdd/state/foreign-edit-override` with a reason) is not session-scoped. 本文は C §Guard Rules の本文。

## Cutover Boundary

UT-TDD imports design concepts from previous framework but current product code is
TypeScript/Node. Do not describe legacy Python modules or legacy commands as the
current operating path.

Cutover evidence is recorded in the migration strategy under `docs/migration/`.
The projection writer and its tests are here.
- `tests/projection-writer.test.ts`
- `src/state-db/projection-writer.ts`

## Local Preconditions

- `node` (see `package.json` `engines.node`) is available on PATH.
- `CLAUDE_PROJECT_DIR` points to the repository root during hook execution.
- `.ut-tdd/` is writable generated runtime state.
- `.claude/settings.json` uses package-local commands only.
- Personal absolute paths are not required for normal operation.


## UT-TDD Adapter Rule Markers

This section is machine-checked by `rule-drift` so Codex and Claude adapters do
not silently diverge.

- Shared project context: `../CLAUDE.md`
- Codex project rules: `../AGENTS.md`
- Modes: `standalone` / `claude-only` / `codex-only` / `hybrid`
- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Handover: `ut-tdd handover`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude delegation: `ut-tdd claude --role <role> --task "..."`
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
