# UT-TDD Agent Harness

UT-TDD Agent Harness is a local TypeScript/Bun command layer for running V-model/TDD governance, doctor checks, handover state, provider adapters, and Claude/Codex team delegation without storing provider API keys in the repo.

The core is intentionally TypeScript/Node-oriented so Windows, macOS, and Linux use the same logic. Shell and PowerShell files are thin entrypoints only.

## What It Does

- Runs governance checks with `ut-tdd doctor`.
- Projects plans, artifacts, traces, telemetry, review evidence, and quality signals into `.ut-tdd/harness.db`.
- Keeps handover state in `.ut-tdd/handover/`.
- Calls Claude and Codex through official local CLIs, not direct provider APIs.
- Runs `ut-tdd team run` to build one shared launch plan for Claude/Codex members, with optional parallel execution.
- Runs `ut-tdd team suggest` to decide whether a task should launch a Claude/Codex team before any provider process starts.
- Selects model and reasoning effort deterministically from task difficulty, while keeping the selection visible in JSON and prompt metadata.
- Bootstraps a target repository with `ut-tdd setup` for solo or team use.

## Install In A Target Repo

The current distribution model is a source checkout / git dependency, not a published public package. From this harness checkout:

```powershell
bun install
bun run build
```

Then run setup from the existing project directory that should receive harness state:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\path\to\UT-TDD-agent-harness\scripts\ut-tdd.ps1 setup --dry-run
powershell -NoProfile -ExecutionPolicy Bypass -File C:\path\to\UT-TDD-agent-harness\scripts\ut-tdd.ps1 setup --solo
```

For team repositories:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\path\to\UT-TDD-agent-harness\scripts\ut-tdd.ps1 setup --team --tl-team @org/tl --qa-team @org/qa --po-team @org/po
```

POSIX shells use the same current-directory rule:

```sh
/path/to/UT-TDD-agent-harness/scripts/ut-tdd setup --dry-run
/path/to/UT-TDD-agent-harness/scripts/ut-tdd setup --solo
```

`setup` writes GitHub workflow/templates and `.ut-tdd/state/setup.json`. Branch protection is emit-only by default; applying it requires an explicit human/admin step:

```powershell
scripts/setup-branch-protection.sh
```

The setup path has built-in templates, so it can run before this repository's `docs/templates/github` tree exists in the target project.

## Daily Commands

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\ut-tdd.ps1 doctor
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\ut-tdd.ps1 db rebuild --json
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\ut-tdd.ps1 telemetry scan --json
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\ut-tdd.ps1 team suggest --task "production security schema migration" --mode hybrid --json
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\ut-tdd.ps1 team run --definition .ut-tdd\teams\team.yaml --mode hybrid --json
```

Use `--execute` only when provider CLIs should actually be launched:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\ut-tdd.ps1 team run --definition .ut-tdd\teams\team.yaml --mode hybrid --execute
```

## Team Definition

```yaml
name: speed-team
strategy: parallel
max_parallel: 2
members:
  - role: se
    engine: codex-se
    task: implement the adapter change
  - role: tl
    engine: pmo-sonnet
    task: review the adapter change
    serialize_after: se
```

Optional member fields:

- `difficulty`: `trivial`, `simple`, `standard`, `complex`, or `critical`
- `model`: explicit model override. Accepted values are provider IDs/families: `gpt-*`, `claude-*`, `codex-*`, `haiku`, `sonnet`, `opus`, or `local`
- `effort`: `low`, `medium`, or `high`

If omitted, the harness infers difficulty from task text and records `model_selection` in the launch plan. `serialize_after` is dependency control: the runner orders the dependency first and skips dependents when the dependency fails.

## When Subagents Launch

Use `team suggest` before `team run` when the task source is free-form text:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\ut-tdd.ps1 team suggest --task "subagent runtime adapter refactor" --json
```

The policy is deterministic:

- `trivial` and `simple` tasks stay single-agent unless they contain a risk term.
- `standard`, `complex`, and `critical` tasks recommend a cross-provider team in `hybrid` mode.
- Risk terms such as `auth`, `database`, `doctor`, `migration`, `production`, `runtime`, `schema`, `security`, `subagent`, and `windows` force a team recommendation in `hybrid` mode.
- Non-`hybrid` modes return `should_launch=false` with `trigger="unavailable"`; the harness does not silently fake cross-provider review.
- `complex` and `critical` recommendations serialize reviewer work after implementation; `critical` also adds a QA verifier.

The returned `definition` can be saved as `.ut-tdd/teams/<name>.yaml` or passed through the same schema used by `team run`.

## Provider Boundary

Codex is launched as `codex exec <task> -m <model>` when a model is selected. Claude is launched as `claude --print --model <model> --effort <low|medium|high> -p <prompt>` and also receives `CLAUDE_CODE_EFFORT_LEVEL` with the same effort value. Codex reasoning effort is selected deterministically and recorded in evidence/prompt metadata until a supported Codex CLI effort flag is pinned.

The harness passes raw-provider guard environment markers for managed adapter calls. Provider credentials remain owned by each official CLI login.

## Verification

Core local verification:

```powershell
bun run typecheck
bun run lint
bun run test
bun run test:node-fallback
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\ut-tdd.ps1 doctor
```

`doctor` is expected to fail if `.ut-tdd/harness.db` is stale after plan or documentation changes. Rebuild projection with `bun src/cli.ts db rebuild --json`, then rerun `doctor`.
