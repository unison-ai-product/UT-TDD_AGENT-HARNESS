# Claude Code Runtime Policy - UT-TDD Agent Harness

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

- `PreToolUse(Agent)`: `bun "$CLAUDE_PROJECT_DIR/.claude/hooks/agent-guard.ts"`
- `PreToolUse(Edit|Write|MultiEdit)`: `bun "$CLAUDE_PROJECT_DIR/.claude/hooks/work-guard.ts"`
- `SessionStart`: `bun "$CLAUDE_PROJECT_DIR/src/cli.ts" session start`
- `PostToolUse(Edit|Write|MultiEdit|Bash)`: `bun "$CLAUDE_PROJECT_DIR/src/cli.ts" hook post-tool-use`
- `Stop`: `bun "$CLAUDE_PROJECT_DIR/src/cli.ts" session summary`
- `SubagentStop`: `bun "$CLAUDE_PROJECT_DIR/src/cli.ts" hook subagent-stop`

Historical behavior may be referenced for migration, but implementation must
live in UT-TDD-owned paths.

## PLAN Rules

Before creating or updating PLAN files, inspect existing `docs/plans/` entries.
Prefer extending an existing PLAN over creating an overlapping one.

PLAN requirements:

- `plan_id` is unique and matches the filename.
- `kind`, `layer`, `status`, `dependencies`, and `review_evidence` match the
  current schema.
- Schedule steps show parallel or serial mode.
- `kind=add-impl` carries the required Reverse pairing.
- Design / implementation / add-* changes update terminology and L0 glossary
  where relevant.
- Review evidence is recorded before asking for confirmation gates.

PLAN claim discipline (errata countermeasure, PLAN-L7-89):

- A falsifiable safety / completeness claim in `review_evidence` or AC — e.g.
  "blast radius 0", "no false positives", "N green", "fully covered" — must
  cite the test or command that substantiates it, not be asserted in prose.
  The mechanical substitute for a prose claim is a real-repo regression test
  (the gate run against the repo), never a sentence (`coding ≠ substance`).
- When a confirmed PLAN's claim is later found wrong, do not silently overwrite
  it: the successor PLAN declares `supersedes: [<old plan_id>]` and the
  superseded PLAN gets a correction note naming the successor. `doctor
  plan-supersession` fail-closes if a declared supersede target is missing or
  lacks the reciprocal back-reference (errata stay bidirectional).

Use `ut-tdd plan lint`, targeted tests, and `ut-tdd doctor`.

## Runtime And Delegation

Current command path:

- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Handover: `ut-tdd handover`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude delegation: `ut-tdd claude --role <role> --task "..."`
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`

Runtime mode is one of `standalone`, `claude-only`, `codex-only`, or `hybrid`.
In `hybrid`, judgement gates should use a different runtime / model family when
feasible. In single-runtime modes, record `intra_runtime_subagent` review
evidence as the substitute.

Do not make raw `codex exec` or raw `claude` the normal path for UT-TDD work.
Use UT-TDD wrappers so session lifecycle, handover warnings, and audit evidence
can be recorded.

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

`PreToolUse(Agent)` uses:

```bash
bun "$CLAUDE_PROJECT_DIR/.claude/hooks/agent-guard.ts"
```

Rules:

1. `subagent_type` must be in the allowlist.
2. Agent calls without a model are blocked.
3. The requested model must match the agent frontmatter family.
4. Bypass is allowed only with `UT_TDD_ALLOW_RAW_AGENT=1` and must leave
   evidence.
5. Invalid stdin JSON or unverifiable state fails closed.

Allowlist:

- `pmo-sonnet`
- `pmo-haiku`
- `pmo-project-explorer`
- `pmo-project-scout`
- `pmo-tech-docs`
- `pmo-tech-fork`
- `pmo-tech-news`
- `pdm-tech-innovation`
- `pdm-marketing-innovation`
- `pdm-innovation-manager`
- `code-reviewer`
- `security-audit`
- `qa-test`

Source-snapshot exploration is not an active Claude Code subagent route. Use
project-focused agents for repository inspection and treat migration snapshots
as read-only material.

## Guard Rules

- Escalate before changing authentication, authorization, payments, PII,
  licenses, production infrastructure, destructive operations, or external API
  assumptions.
- `PreToolUse(Edit|Write|MultiEdit)` blocks edits to uncommitted files not
  touched by the current Claude session. This prevents one runtime from
  overwriting the other runtime's in-flight work. Override with
  `UT_TDD_ALLOW_FOREIGN_EDIT=1` (env, human/out-of-band) or, mid-session, by
  writing a non-empty reason to `.ut-tdd/state/foreign-edit-override`; marker
  bypasses are audited to `.ut-tdd/logs/foreign-edit-overrides.jsonl`. An empty
  marker does not bypass (no silent override without a recorded reason). The
  marker is **one-shot**: it is consumed (deleted) on the foreign edit it
  authorizes, so a stale marker cannot keep bypassing the guard. The env
  override is human-managed and not consumed.
- Do not treat `legacy local state/` as active runtime state.
- Do not write secrets, PII, or credentials into docs, examples, or audit
  evidence.
- Respect explicit fail-open / fail-close hook design; do not ignore hook
  failures silently.
- Native Windows behavior is first-class. WSL2 is optional compatibility, not a
  required condition.

## Cutover Boundary

UT-TDD imports design concepts from previous framework but current product code is
TypeScript/Bun. Do not describe legacy Python modules or legacy commands as the
current operating path.

Current cutover evidence:

- migration strategy docs under `docs/migration/`
- `docs/plans/PLAN-M-01-cutover-backfill.md`
- `docs/plans/PLAN-L7-44-harness-db-master.md`
- `tests/projection-writer.test.ts`
- `src/state-db/projection-writer.ts`

## Local Preconditions

- `bun` is available on PATH.
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
