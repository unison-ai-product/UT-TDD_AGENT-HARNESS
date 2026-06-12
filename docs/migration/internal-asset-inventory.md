# UT-TDD Internal Asset Inventory

Status: current-backfilled
Original audit date: 2026-05-29
Current backfill date: 2026-06-12

This document records the inventory of HELIX-derived internal runtime assets: subagents, skills, and command templates. It was originally created as evidence for `PLAN-RECOVERY-01` after a gap was found: the guard mechanism existed, but the assets themselves had not yet been treated as UT-TDD-owned product assets.

## Current Status

The original gap is closed for the active repository.

- Active subagent / skill / prompt assets are checked by `asset-drift`.
- `ut-tdd doctor` currently reports HELIX path residue 0, legacy command residue 0, and allowlist missing 0.
- `pmo-helix-explorer` and `pmo-helix-scout` remain as vendor snapshot exploration roles only. They are not HELIX runtime delegation paths.
- HELIX-derived materials remain historical or migration reference unless they are curated into UT-TDD-owned paths.

## Original Finding

The initial inventory found three asset classes.

| Asset class | Original finding | UT-TDD target | Current control |
| --- | --- | --- | --- |
| subagent prompts | 19 prompts copied from vendor with HELIX assumptions | Markdown prompts curated in `.claude/agents/`, role/capability/model boundary defined | `agent-guard`, `asset-drift`, `rule-drift` |
| skills | 107 vendor skill files, with `docs/skills/` initially empty | Curated UT-TDD skill docs and skill injection semantics | `docs/skills/`, `asset-drift` |
| command docs/templates | HELIX command docs existed only as source material | UT-TDD CLI subcommands and templates | `ut-tdd` CLI, `schema` command validation |

## Subagent Roster

The active roster is not treated as a byte-for-byte vendor copy. It is a UT-TDD-owned prompt layer with TypeScript guard and lint controls.

| Category | Count | Guard treatment | Current role |
| --- | ---: | --- | --- |
| PMO | 9 | allowlisted where applicable | project / tech / vendor snapshot exploration |
| PdM | 3 | allowlisted | optional product / market / innovation analysis |
| review | 3 | allowlisted | code review, security audit, QA |
| BE | 2 | blocked from direct Agent use | route to `ut-tdd codex --role ...` when needed |
| DB | 1 | blocked from direct Agent use | route to Codex role when needed |
| DevOps | 1 | blocked from direct Agent use | route to Codex role when needed |

Closed risks:

- Absolute local HELIX paths in active assets are not allowed.
- Legacy HELIX command delegation in active assets is not allowed.
- Guard allowlist entries must resolve to agent prompt files.
- Empty `docs/skills` is not allowed once the asset roots are enrolled.

## Skill Inventory

The vendor snapshot remains read-only. Skills are not executable as-is and are not bulk-loaded into UT-TDD. They are classified before use.

| Class | Treatment |
| --- | --- |
| core | Curate into UT-TDD-owned docs when directly tied to the harness workflow |
| optional | Keep as reference until a PLAN requires it |
| drop | Do not migrate unless a future requirement explicitly reopens it |

Representative core candidates remain Reverse, PoC, verification, quality, debt, design-doc, API contract, schedule/WBS, requirements handover, agent design, and agent teams.

## Command Inventory

HELIX commands are not current operating paths. Command behavior must be reimplemented or represented as UT-TDD subcommands.

Current rule:

- Current commands begin with `ut-tdd`.
- Recommended command schemas reject HELIX command strings.
- Historical command names may appear only in migration evidence, tests, or explicit "rejected/superseded" context.

## FR Backfill

The original missing feature requirements were backfilled as:

| Candidate | Backfilled target | Meaning |
| --- | --- | --- |
| FR-AST-1 | FR-L1-46 | UT-TDD subagent roster hardening |
| FR-AST-2 | FR-L1-47 | UT-TDD skill pack curation |
| FR-AST-3 | FR-L1-48 | UT-TDD command/subcommand asset curation |
| FR-AST-4 | FR-L1-49 | Internal asset drift lint |

## Reuse Rule

Executable behavior is reimplemented in TypeScript/Bun under `src/`. Markdown assets may be curated into UT-TDD-owned paths, but vendor files remain read-only reference. Runtime use without curation is not allowed.
