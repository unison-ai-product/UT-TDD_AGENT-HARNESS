# Codex CLI - UT-TDD Agent Harness

This file is the Codex CLI project rules for this repository.

Separation of responsibilities:

- `CLAUDE.md`: shared project context.
- `.claude/CLAUDE.md`: Claude Code runtime / hook policy.
- `AGENTS.md`: Codex CLI project rules.

## コミュニケーション (報連相)

本文は docs/governance/operating-rules-codex.md §コミュニケーション (報連相) (chat と docs の言語を決めるとき)。

### 設計判断エリシテーション (PO ルール 2026-07-13)

本文は docs/governance/operating-rules-codex.md §設計判断エリシテーション (PO ルール 2026-07-13) (PO へ設計判断を質問するとき)。

## Core Reads

For work in this repository, read the repository-owned sources below and follow
their workflow.

- `CLAUDE.md` - **shared project rules for both runtimes** (rule placement
  convention, design and issue workflow, EOD close-out, model/effort routing). Rules that
  hold for both Codex and Claude live there and are not duplicated here, so this
  file is not self-sufficient — read it.
- `docs/governance/ut-tdd-agent-harness-concept_v3.1.md` - concept for internal rollout
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` - requirements and acceptance criteria
- `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md` - extraction / cutover plan from the source snapshot
- `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md` - redesign policy and TypeScript/Node implementation language
- `docs/governance/README.md` - canonical / reference / archive boundary under governance
- `docs/governance/operating-rules-review-merge.md` / `operating-rules-delegation-routing.md` / `operating-rules-general.md` - rule text moved verbatim out of `CLAUDE.md` (PO 2026-11-26); `CLAUDE.md` keeps headings and one-line pointers. Read the one a pointer names when its condition applies; they are canonical for both runtimes.
- `docs/governance/operating-rules-codex.md` - Codex-specific rule text moved verbatim out of this file (PO 2026-11-26); `AGENTS.md` keeps headings, one-line pointers, Core Reads, Session Start, Hooks, and the adapter markers.

Core Reads の補足 (migration の読み方・roadmap・ADR-001・archive) は docs/governance/operating-rules-codex.md §Core Reads の補足段落 (Core Reads を超えて読むとき)。

## Session Start

1. Confirm the Core Reads above exist.
2. If `.ut-tdd/handover/CURRENT.json` exists, check it and follow any non-stale
   next action.
3. If `legacy local state/` exists, treat it as historical source state, not UT-TDD state.
4. If there is no active handover, start normally and say
   `OK: UT-TDD session initialized`.

## TL Driven Mode

本文は docs/governance/operating-rules-codex.md §TL Driven Mode (Codex が他ランタイム無しで指揮するとき)。

## UT-TDD Workflow

本文は docs/governance/operating-rules-codex.md §UT-TDD Workflow (工程の流れを確かめるとき)。

## Codex / Claude Code Harness

本文は docs/governance/operating-rules-codex.md §Codex / Claude Code Harness (runtime mode・正規コマンド・creation/judgement 分離を確かめるとき)。

### あなたが○○なら (Codex 指揮モデル別の振る舞い、PO ルール 2026-10-09)

本文は docs/governance/operating-rules-codex.md §あなたが○○なら (Codex 指揮モデル別の振る舞い、PO ルール 2026-10-09) (自分の指揮モデルの行動と相談先を確かめるとき)。

### Blind review role (`--role blind-reviewer`)

本文は docs/governance/operating-rules-codex.md §Blind review role (`--role blind-reviewer`) (blind review・FLAG 是正・model/effort routing・advisor を扱うとき)。

## Hooks (Codex orchestrator parity)

Codex reuses Claude's guard entrypoints through repo-local
`.codex/hooks.json` (PLAN-L7-139). It is **repo-relative only**; never write
hook config to global `~/.codex/`. It reuses the SAME TypeScript hook entrypoints
as Claude (`.claude/hooks/work-guard.ts`, `src/cli.ts session ...`) with NO logic
fork — the guard logic lives in `src/runtime/*.ts` and is runtime-agnostic.

Codex command hooks reject the unsupported `blockOnFailure` field during static validation.
At runtime, fail-close is limited to a guard returning a confirmed deny.
Launch failure, timeout, exit 1, and invalid output are unmeasured (fail-open is possible).

Codex tool names differ from Claude, so matchers are mapped (not copied):

- `Edit|Write|MultiEdit` (Claude) -> `apply_patch|write_file` (Codex) for the
  foreign-edit `work-guard`. Codex's `apply_patch` is **freeform** and carries no
  `file_path` field — the edited paths live in the patch body
  (`*** Update File:` / `*** Add File:` / `*** Delete File:` / `*** Move to:`,
  multi-file). `work-guard` parses those headers so the foreign-edit block
  actually fires for `apply_patch` (Codex's primary edit tool), not just
  `write_file`.
- `Bash` (Claude) -> `exec_command|local_shell` (Codex) for `PostToolUse`
  session logging.
- `subagent-stop` (`SubagentStop`) has **no Codex surface** and is genuinely N/A:
  codex.exe 0.128.0 exposes only `PreToolUse` / `PostToolUse` / `SessionStart` /
  `Stop` / `UserPromptSubmit` hook events (no `SubagentStop`).
- `agent-guard` **is wired** for Codex: `.codex/hooks.json` matches
  `spawn_agent|spawn_agents_on_csv` and runs the same `.claude/hooks/agent-guard.ts`
  as a single `command` string, so Codex subagent spawns follow the same rule as Claude's
  (a missing model is blocked; #1002). (This entry read "not yet wired" until 2026-07-28, which
  the hook config itself already contradicted. Read `.codex/hooks.json` when in
  doubt — it is the SSoT for what is actually wired.)

`.codex/hooks.json` parity with `.claude/settings.json` is machine-checked by `doctor`
`codex-hook-adapter`, which fails closed if a guard diverges, carries a
field outside the supported set (`blockOnFailure`, `args`, `commandWindows` are
rejected as `unsupported_hook_field`), depends on `$CLAUDE_PROJECT_DIR`, or
references global `~/.codex/`.

Scope boundary: `.codex/hooks.json` guards direct Codex CLI / Codex IDE sessions
only. Hosted API/developer tools supplied by the surrounding chat runtime (such
as this environment's `apply_patch`) do not execute through the Codex hook
engine, so repo hooks cannot mechanically intercept them. In that surface,
Codex must treat the hook as non-enforcing and perform explicit git/status
preflight before edits; do not claim mechanical hook coverage for API tool
calls.

## Skills

本文は docs/governance/operating-rules-codex.md §Skills (skill を読み込むとき)。

## Distribution Repository

本文は docs/governance/operating-rules-codex.md §Distribution Repository (Pack を配布するとき)。

## 設計と作業の正本

設計文書と GitHub Issue の扱いは `CLAUDE.md` §設計と作業の正本 に従う。

## Editing Rules

本文は docs/governance/operating-rules-codex.md §Editing Rules (編集・UTF-8 読み取りをするとき)。

## Git Rules (hybrid 多ランタイム協調)

本文は docs/governance/operating-rules-codex.md §Git Rules (hybrid 多ランタイム協調) (commit・merge・memory 記録をするとき)。

## GitHub Issue Hierarchy

本文は docs/governance/operating-rules-codex.md §GitHub Issue Hierarchy (Issue を起票・分割するとき)。

## Doctor Invocation Discipline (PLAN-L7-442)

本文は docs/governance/operating-rules-codex.md §Doctor Invocation Discipline (PLAN-L7-442) (doctor を実行するとき)。

## Test Rules

本文は docs/governance/operating-rules-codex.md §Test Rules (検証手順を選ぶとき)。

## Local Overrides

Personal overrides go in `AGENTS.override.md`. It is not tracked by Git.

## UT-TDD Adapter Rule Markers

This section is machine-checked by `rule-drift` so Codex and Claude adapters do
not silently diverge.

- Shared context: `CLAUDE.md`
- Claude runtime policy: `.claude/CLAUDE.md`
- Modes: `standalone` / `claude-only` / `codex-only` / `hybrid`
- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Handover: `ut-tdd handover`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude delegation: `ut-tdd claude --role <role> --task "..."`
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
