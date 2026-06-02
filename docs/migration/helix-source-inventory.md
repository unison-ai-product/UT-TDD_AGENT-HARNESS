# HELIX Source Snapshot Inventory

## Snapshot

| Item | Value |
|---|---|
| Source | `C:\Users\micro\ai-dev-kit-vscode` |
| Destination | `vendor/helix-source/` |
| Purpose | UT-TDD Agent Harness の TS 再実装に使う能力インベントリ / historical reference snapshot |
| Snapshot policy | 素材としては原則すべて保持し、正本化は段階再実装 / curate で行う。runtime として無修正転用しない |

## Copied Scope

| Top-level path | File count |
|---|---:|
| `.claude/` | 54 |
| `.claude-plugin/` | 2 |
| `.github/` | 9 |
| `.helix/` | 15 |
| `cli/` | 710 |
| `docs/` | 338 |
| `harness/` | 1 |
| `helix/` | 5 |
| `scripts/` | 6 |
| `skills/` | 255 |
| `src/` | 3 |
| `tests/` | 11 |
| `verify/` | 32 |
| `workflows/` | 1 |
| root files | 9 |

Total copied files after runtime cleanup: 1451 files, about 12.2 MiB.

## Excluded Runtime / Local State

The snapshot intentionally excludes local or generated state:

- `.git/`
- `.pytest_cache/`
- `.venv/`, `venv/`, `node_modules/`
- `__pycache__/`, `.mypy_cache/`, `.ruff_cache/`
- `.helix/helix.db`
- `.helix/orchestration.db`
- `.helix/audit/`
- `.helix/cache/`
- `.helix/locks/`
- `.helix/tasks/`
- `.helix/tmp/`
- `.helix/budget/cache/`
- `.claude/settings.local.json`
- `.claude/agent-memory/`
- `.claude/scheduled_tasks.lock`
- `.env`, `.env.*`, `*.pem`, `*.key`, `credentials.json`

## Verification

Checked absent after copy:

- `vendor/helix-source/.git`
- `vendor/helix-source/.pytest_cache`
- `vendor/helix-source/.helix/helix.db`
- `vendor/helix-source/.helix/orchestration.db`
- `vendor/helix-source/.helix/audit`
- `vendor/helix-source/.helix/cache`
- `vendor/helix-source/.helix/locks`
- `vendor/helix-source/.helix/tasks`
- `vendor/helix-source/.claude/settings.local.json`
- `vendor/helix-source/.env`

## Migration Findings

- 1010 files in the snapshot still contain `HELIX`, `helix`, `ai-dev-kit-vscode`, or `C:\Users\micro` references.
- `vendor/helix-source/.gitignore` contains rules that ignore `.helix/**`; if this snapshot is committed and `.helix` template files must be preserved, add them with an explicit force add or move the needed templates into `docs/migration/` or a UT-TDD template path.
- `.claude/settings.json` and hook scripts still point at the original HELIX runtime and absolute local paths. These are import sources, not ready-to-use UT-TDD configuration.

## First Migration Targets

| Priority | Source | UT-TDD target |
|---|---|---|
| P0 | `cli/helix-doctor`, `cli/lib/doctor_*`, `cli/lib/setup_helper.py` | `ut-tdd doctor` / `ut-tdd setup` |
| P0 | `.claude/settings.json`, `.claude/hooks/*` | package-local Claude hook config |
| P0 | `cli/codex`, `cli/codex.ps1`, `cli/claude` | Windows-safe Codex / Claude shims |
| P1 | `cli/lib/team_runner.py`, `cli/templates/teams/*` | UT-TDD review/team runner |
| P1 | `skills/`, `skills/SKILL_MAP.md` | UT-TDD skill pack / role map |
| P1 | `docs/commands/ai-harness.md`, `docs/commands/index.md` | UT-TDD CLI docs |
| P2 | `docs/v2/`, `docs/plans/PLAN-080..100` | design assets for later migration |

## High-impact Reuse Backlog

The snapshot contains enough reusable behavior and design ideas to guide a large part of the UT-TDD harness rebuild. Do not treat these as Python code-port waves; use them as TypeScript/Bun reimplementation waves.

The execution-level mapping is maintained in `docs/migration/helix-porting-map.md`.

| Wave | Source assets | UT-TDD feature | Reuse class | Notes |
|---|---|---|---|---|
| W1 | `cli/lib/plan_*`, `cli/templates/plan/*`, `cli/lib/tests/test_plan_*` | `ut-tdd plan lint`, PLAN templates, frontmatter schema | rename + adapt | Highest leverage. Mostly pure Python / markdown, low external dependency. |
| W2 | `cli/lib/vmodel_*`, `cli/templates/state/vmodel.json`, `cli/lib/tests/test_vmodel_*` | `ut-tdd vmodel lint`, 4 artifact trace | adapt | Align enum names and UT-TDD trace wording, keep validator/test structure. |
| W3 | `cli/lib/effort_classifier.py`, `task_type_inference.py`, `task_dispatcher.py`, `skill_recommender.py`, `skill_catalog.py`, related tests | `ut-tdd task classify`, `task estimate`, `skill suggest` | adapt | Directly maps to the new task/effort/skill commands. |
| W4 | `cli/lib/team_runner.py`, `model_registry.py`, `model_fallback.py`, `budget.py`, `cli/templates/teams/*`, related tests | `.ut-tdd/teams/*.yaml`, orchestration policy | adapt | Replace HELIX model names with capability classes (`frontier-reviewer`, `worker`, `fast-checker`). |
| W5 | `cli/lib/handover.py`, `handover_auto_dump.py`, `transcript_summary.py`, `cli/templates/handover-*` | `ut-tdd handover`, session recovery | rename + adapt | Strong fit for cross-agent and crash/restart continuity. |
| W6 | `.claude/hooks/*`, `.claude/settings.json`, `.claude/agents/*`, hook tests | Claude Code hook guard / subagent templates | harden + adapt | Must remove absolute paths and route through package-local `ut-tdd`. |
| W7 | `.github/workflows/*`, `scripts/git-hooks/*`, `.commitlintrc.json`, PR template | `harness-check`, commitlint, branch-kind-check | redesign wrapper + reuse snippets | Existing branch workflows should be collapsed into one required `harness-check`. |
| W8 | `cli/lib/escalation_*`, `doctor_recovery_check.py`, `recovery_plan_check.py`, `deferred_findings.py` | escalation L0-L3, recovery PLAN, debt/carry | adapt | Good fit, but local `.helix` DB assumptions must be removed. |
| W9 | `cli/lib/scrum_*`, `reverse_local.py`, `scrum_to_reverse_routing.py`, matrix tests | Scrum x Reverse, R4 routing, `promotion_strategy` | adapt later | High value after Phase 0 CLI is stable. |
| W10 | `skills/**/SKILL.md`, `docs/agent-skills/*`, references | `docs/skills/*.md` skill packs | curate | Do not bulk-copy as runtime config. Convert into UT-TDD-owned skill docs. |

## Reuse Classification

| Class | Meaning | Examples |
|---|---|---|
| `copy-with-rename` | Mostly path/name changes from HELIX to UT-TDD | PLAN templates, handover templates, commitlint |
| `adapt` | Logic can stay, but paths/enums/runtime state must change | plan/vmodel validators, task classifier, skill recommender, team runner |
| `harden` | Useful but security/path/OS behavior must be reviewed first | hooks, Claude settings, shell scripts |
| `redesign-wrapper` | Keep pieces but wrap in new UT-TDD architecture | GitHub workflows, branch protection, escalation aggregation |
| `curate` | Knowledge asset, not executable as-is | skills, docs, old PLANs, audit findings |

## Immediate Candidates for "7割構築"

If the goal is to quickly produce a usable system, start with these concrete modules and their tests:

- `plan_frontmatter.py`, `plan_parser.py`, `plan_schema.py`, `plan_validator.py`, `plan_lint.py`
- `vmodel_loader.py`, `vmodel_lint.py`
- `effort_classifier.py`, `task_type_inference.py`, `skill_recommender.py`, `skill_catalog.py`
- `team_runner.py`, `model_registry.py`, `model_fallback.py`, `budget.py`
- `handover.py`, `handover_auto_dump.py`
- `setup_helper.py`, `doctor_plan_checks.py`, `doctor_recovery_check.py`
- `agent_slots.py`, `agent_mandatory.py`, `agent_policy_guard.py`
- `llm_guard.py`, `research_guard.py`, `redaction.py`, `context_guard.py`
- `audit_validator.py`, `audit_inventory.py`, `audit_hash.py`
- `code_catalog.py`, `code_edges.py`, `code_recommender.py`
- `builders/*`
- corresponding `cli/lib/tests/test_*` files

These are mostly local logic and should be reimplemented in TypeScript/Bun once `.helix` paths, command names, HELIX-specific enums, and Python state assumptions are identified.

## Rule

`vendor/helix-source/` is read-only source material. Do not edit it while productizing. Copy selected markdown/templates into UT-TDD-owned paths only when they are being curated; re-create executable behavior in TypeScript/Bun under UT-TDD-owned paths.
