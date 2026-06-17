# Codex CLI - UT-TDD Agent Harness

This file is the Codex CLI project rules for this repository.

Separation of responsibilities:

- `CLAUDE.md`: shared project context.
- `.claude/CLAUDE.md`: Claude Code runtime / hook policy.
- `AGENTS.md`: Codex CLI project rules.

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

## Skills

- Read only the relevant `SKILL.md` for matching triggers.
- Do not bulk-load all skills.
- Resolve `references/` relative to the skill directory.
- Legacy-derived skill material is migration source material. UT-TDD skill docs
  live under `docs/skills/`.

## Editing Rules

- Read target files before editing them.
- Match existing code structure, naming, and test placement.
- Treat existing uncommitted changes as user work; do not revert them without
  explicit instruction.
- Do not write secrets, PII, or credentials into docs, rules, examples, or audit
  evidence.

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
