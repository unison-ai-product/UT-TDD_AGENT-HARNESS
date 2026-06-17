# UT-TDD Agent Harness

## Claude Code Read Order

Claude Code treats the following as canonical in this repository:

1. `CLAUDE.md`
2. `.claude/CLAUDE.md`
3. `docs/governance/README.md`
4. `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
5. `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
6. `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md`
7. `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`

Migration snapshots and migration docs are not normal startup reads. Read them
only when migration, gap audit, or regression-source inspection requires it.

Do not load `docs/design/harness/L3-functional/roadmap.md` as a normal startup
read. The verification roadmap is read dynamically only when a V-model layer
group has completed Forward freeze and a verification cycle is being run.

`docs/archive/`, `legacy local state/`, and pre-migration
`.claude/agents` / `.claude/hooks` are not canonical runtime state. Migration
source material is historical reference only; current UT-TDD runtime commands
use `ut-tdd`, not legacy commands.

ADR-001 is binding: source concepts may be used as design source material, but
UT-TDD implementation is TypeScript/Bun. old W1-W3a Python is not
current product runtime.

## Purpose

UT-TDD Agent Harness is the verification and development foundation for safely
using AI implementation agents in internal product development. The harness is
not the end product; it is the ground on which other product work runs.

Design and implementation should be judged by these pillars:

1. Foundation first: the harness must make downstream product development safer.
2. Document-first plus machine enforcement: workflow rules must be backed by
   schema, lint, doctor, hooks, or tests where appropriate.
3. Automatic state and feedback: `.ut-tdd/` state and harness DB projections
   should make progress, gaps, and drift visible.
4. Dynamic context / skill injection: load only relevant context and skills.
5. Practical orchestration: split work across roles/runtimes only where it
   reduces risk or cost.
6. Strict verification: no completion claim without tests or explicit evidence.

## Canonical Docs

- `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
- `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md`
- `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`
- `docs/governance/repository-structure.md`

## Architecture Boundary

- `docs/`: governance, requirements, ADRs, plans, design, test design, migration, archive
- `src/`: TypeScript/Bun harness core
- `tests/`: Vitest tests
- `scripts/`: thin OS entrypoints only
- `.ut-tdd/`: UT-TDD runtime state and audit/handover evidence
- `.claude/`: Claude Code runtime / hook policy
- `legacy local state/`: historical source state, not UT-TDD state

V-model artifacts must stay separated:

- design: `docs/design/`
- implementation: `src/`
- test design: `docs/test-design/`
- tests: `tests/`

## Coding Rules

- Read the relevant files before editing.
- Match local naming, structure, and test placement.
- Do not declare completion without tests or explicit verification.
- Treat Codex / Claude Code as local CLI + hook surfaces managed by UT-TDD, not
  direct API calls.
- Remove or clearly supersede wrong development residue when it is discovered;
  do not leave misleading comments or dead paths as technical debt.

## Git Rules

- Use Conventional Commits.
- Stage explicit files only.
- Keep unrelated user changes out of commits.
- Push at coherent PLAN / task boundaries when requested.
- CI is `harness-check`: typecheck, Vitest, Biome lint, and doctor.
- Review evidence is required before confirmation gates where applicable.

## Canonical Commands

- Setup: `ut-tdd setup`
- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Plan lint: `ut-tdd plan lint`
- Review: `ut-tdd review --uncommitted`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude prompt generation: `ut-tdd claude --role <role> --task "..." --dry-run`
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
- Task classification: `ut-tdd task classify --text "..."`
- Skill suggestion: `ut-tdd skill suggest --plan <path>`

When multiple AI runtimes are available, separate creation from judgement. In
single-runtime modes, record `intra_runtime_subagent` review evidence as the
fallback.

## Safety Boundaries

- Do not write API keys, secrets, PII, or credentials into rules, docs,
  examples, or audit evidence.
- Escalate before changing authentication, authorization, payments, PII,
  licenses, destructive data operations, production infrastructure, or external
  API assumptions.
- Do not track local runtime artifacts except explicitly tracked audit /
  provider-handover evidence.

## UT-TDD Workflow

- Forward: `plan` -> `pair-freeze` -> `implement` -> `trace-freeze` -> `review` -> `accept`
- Reverse: `reverse <type> R0` -> `R1` -> `R2` -> `R3` -> `R4` -> Forward merge
- Scrum / PoC: `S0 backlog` -> `S1 plan` -> `S2 poc` -> `S3 verify` -> `S4 decide`
- Handover: check `.ut-tdd/handover/CURRENT.json` if present and non-stale.

## Instruction Files

- Shared project context: `CLAUDE.md`
- Claude Code runtime / hook policy: `.claude/CLAUDE.md`
- Codex CLI project rules: `AGENTS.md`
- Personal overrides: `CLAUDE.local.md` / `AGENTS.override.md`

## UT-TDD Adapter Rule Markers

This section is machine-checked by `rule-drift` so Codex and Claude adapters do
not silently diverge.

- Codex project rules: `AGENTS.md`
- Claude runtime policy: `.claude/CLAUDE.md`
- Modes: `standalone` / `claude-only` / `codex-only` / `hybrid`
- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Handover: `ut-tdd handover`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude delegation: `ut-tdd claude --role <role> --task "..."`
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
