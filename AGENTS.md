# Codex CLI - UT-TDD Agent Harness

This file is the Codex CLI project rules for this repository.

Separation of responsibilities:

- `CLAUDE.md`: shared project context.
- `.claude/CLAUDE.md`: Claude Code runtime / hook policy.
- `AGENTS.md`: Codex CLI project rules.

## コミュニケーション (報連相)

チャット上の報連相 (報告・連絡・相談) は **日本語** で行う (PO ルール、2026-06-22)。
進捗報告・調査結論・選択肢提示・確認依頼など PO へ向けた chat 出力は日本語を既定とし、
見出し・箇条書きラベルも日本語を優先する。これは Claude / Codex 両ランタイム共通のルール
(`CLAUDE.md` / `.claude/CLAUDE.md` と同一)。

ただし成果物はそれぞれの規約に従う: コード/識別子/commit message は従来どおり、ファイル名は
英語 (文字化け回避)、技術用語・コマンド・PLAN ID・パスは原語のまま埋め込んでよい (無理に和訳しない)。

## Core Reads

For work in this repository, read the repository-owned sources below and follow
their workflow.

- `docs/governance/ut-tdd-agent-harness-concept_v3.1.md` - concept for internal rollout
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` - requirements and acceptance criteria
- `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md` - extraction / cutover plan from the source snapshot
- `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md` - redesign policy and TypeScript/Bun implementation language
- `docs/governance/README.md` - canonical / reference / archive boundary under governance

Migration snapshots and inventories are not Core Reads. Read `docs/migration/`
only when migration, gap audit, or regression-source inspection requires it. Do
not treat it as UT-TDD runtime state or execution paths.

Do not load `docs/design/harness/L3-functional/roadmap.md` as a normal startup
read. The verification roadmap is read dynamically only at V-model freeze
boundaries when a verification cycle is being run. Normal work follows the
Forward descent path from L0 to L14.

ADR-001 is binding: The previous framework is a design source only. UT-TDD core implementation is
TypeScript/Bun. old W1-W3a Python is not ported as product runtime.
Thin `.ps1` / `.sh` entrypoints may call the compiled or Bun-based TypeScript
core. The language of repositories governed by UT-TDD is independent of the
harness implementation language.

`docs/archive/` is not canonical; it is historical material only. The HELIX
vendor snapshot has been removed now that the fork is complete (see
`docs/migration/helix-fork-completion-plan.md` §11).

## Session Start

1. Confirm the Core Reads above exist.
2. If `.ut-tdd/handover/CURRENT.json` exists, check it and follow any non-stale
   next action.
3. If `legacy local state/` exists, treat it as historical source state, not UT-TDD state.
4. If there is no active handover, start normally and say
   `OK: UT-TDD session initialized`.

## TL Driven Mode

When Codex CLI is used without another active runtime, act as the technical lead
for the current slice. This does not replace Claude Code; it means Codex can
execute, verify, and make gate decisions in `codex-only` or `standalone` modes.

- Carry design, implementation, review, tests, and verification through when
  feasible.
- Read relevant existing files before editing.
- Match existing structure, naming, and test placement.
- State gate outcomes in the final response when the change size requires them.
- Escalate before changing production infrastructure, authentication,
  authorization, payment, PII, secrets, licensing, external APIs, or other
  high-impact environment assumptions.

## UT-TDD Workflow

- Forward: `plan` -> `pair-freeze` -> `implement` -> `trace-freeze` -> `review` -> `accept`
- Reverse: `reverse <type> R0` -> `R1` -> `R2` -> `R3` -> `R4` -> Forward merge
- Scrum / PoC: `S0 backlog` -> `S1 plan` -> `S2 poc` -> `S3 verify` -> `S4 decide`
- Additive change: preserve existing design and add deltas through `add-design`
  / `add-impl`.
- Handover: use `.ut-tdd/handover/` as the session / cross-runtime handover
  source.

## Codex / Claude Code Harness

Codex and Claude Code are managed by UT-TDD Agent Harness through contract
plans, local CLIs, and hooks. They are not direct API calls in this product.

Runtime modes:

- `standalone`
- `claude-only`
- `codex-only`
- `hybrid`

Canonical commands:

- Codex execution: `ut-tdd codex --role <role> --task "..."`
- Claude prompt generation: `ut-tdd claude --role <role> --task "..." --dry-run`
- Team delegation: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
- Task classification: `ut-tdd task classify --text "..."` / `ut-tdd task estimate --plan <path>`
- Skill recommendation: `ut-tdd skill suggest --plan <path>`
- Review packet: `ut-tdd review --uncommitted`
- Handover: `ut-tdd handover`
- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`

When multiple AI runtimes are available, separate creation from judgement.
Design decisions, judgement gates, and R4 merge decisions should go through a
different runtime / model family when feasible. In single-runtime modes, record
`intra_runtime_subagent` as the review substitute and leave evidence.

Do not add legacy commands as current company/product execution paths.

## Hooks (Codex orchestrator parity)

Codex enforces the same guardrails as Claude through repo-local
`.codex/hooks.json` (PLAN-L7-139). It is **repo-relative only**; never write
hook config to global `~/.codex/`. It reuses the SAME TypeScript hook entrypoints
as Claude (`.claude/hooks/work-guard.ts`, `src/cli.ts session ...`) with NO logic
fork — the guard logic lives in `src/runtime/*.ts` and is runtime-agnostic.

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
- `agent-guard` (`Agent`) is **not yet wired** for Codex. Codex DOES have a
  sub-agent surface (`spawn_agent` / `wait_agent` / `list_agents` tools), so an
  agent-guard analog is a **deferred follow-up** (a real, currently-unguarded
  surface), **not** an absent one. Wiring it needs a Codex allowlist/model design
  because `spawn_agent` semantics differ from Claude's `subagent_type`.

`.codex/hooks.json` parity with `.claude/settings.json` is machine-checked by `doctor`
`codex-hook-adapter`, which fails closed if a guard diverges, drops
`blockOnFailure`, depends on `$CLAUDE_PROJECT_DIR`, or references global
`~/.codex/`.

Scope boundary: `.codex/hooks.json` guards direct Codex CLI / Codex IDE sessions
only. Hosted API/developer tools supplied by the surrounding chat runtime (such
as this environment's `apply_patch`) do not execute through the Codex hook
engine, so repo hooks cannot mechanically intercept them. In that surface,
Codex must treat the hook as non-enforcing and perform explicit git/status
preflight before edits; do not claim mechanical hook coverage for API tool
calls.

## Skills

- Read only the relevant `SKILL.md` for matching triggers.
- Do not bulk-load all skills.
- Resolve `references/` relative to the skill directory.
- Legacy-derived skill material is migration source material. UT-TDD skill docs
  live under `docs/skills/`.

## Editing Rules

- Read target files before editing them.
- Match existing code structure, naming, and test placement.
- Treat existing uncommitted changes and **commits made by the other runtime
  (Claude)** as legitimate work; do not revert/reset/checkout them without
  explicit instruction.
- Do not write secrets, PII, or credentials into docs, rules, examples, or audit
  evidence.

## Git Rules (hybrid 多ランタイム協調)

- Use Conventional Commits. Stage explicit paths only (`git add <path>`; never
  `git add -A` / `git add .`).
- **history を書き換える前に `git log` / `git reflog` を確認**し、もう一方のランタイム
  (Claude) の commit を `reset` / `revert` / `checkout` / force で破棄・デグレさせない。
  working tree の foreign 変更は既定で「相手ランタイムの正規作業」とみなす。判断不能なら
  revert せず PO 確認。
- 自分の成果は相手の commit の上に積み、相手のファイルに触れない。
- **commit 直前に `git status` + `git diff --staged` (or `ut-tdd review --staged` /
  `--uncommitted`)** で、authored した意図ファイルのみが staged であることを検証する。
- push 済み履歴は破壊しない。
- **引き継ぎ・検証の基準点は commit/push 済 HEAD ただ一つ**。hybrid では working tree を
  相手ランタイムが常時書き換えるため、full tree の計測値は transient で非正本。検証は HEAD
  (+ 自分の意図変更のみ) に固定し、測定値が動いたら相手を疑う前に自分の baseline を疑う
  (foreign tree の transient を相手の退行と帰責しない)。引き継ぎ feedback は harness.db
  (`feedback_events`、PLAN-L7-110) から受け取り、stale 化する prose handover を正本にしない。

## Test Rules

- Docs changes: use `rg` to check old assumptions such as WSL2-required wording,
  migration-source-as-current wording, personal absolute paths, and mojibake
  markers.
- Bash changes: `bash -n <changed-script>`.
- PowerShell changes: `powershell -NoProfile -ExecutionPolicy Bypass -File <changed-script>`.
- TypeScript core changes: `tsc --noEmit` plus targeted `vitest`.
- CLI / hook changes: smoke test Windows PowerShell and POSIX shell paths when
  relevant.

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
