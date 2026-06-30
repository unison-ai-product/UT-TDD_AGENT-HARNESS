# A-147 - Post-A-146 remediation verification audit

- **date**: 2026-06-30
- **scope**: verify, against current committed state and runtime evidence, the remediation stack
  landed after A-146 (the consolidated substance-gap audit) and re-classify each A-146 finding.
- **successor of**: [A-146](A-146-substance-gap-consolidated-remediation.md). A-146 stays the
  point-in-time record at its own baseline; this audit supersedes its dispositions where noted.
- **baseline**: committed local `HEAD = 4fbdc9c docs: park central ui vscode delivery plan`.
- **git state (material)**: `main` is **17 commits ahead of `origin/main`**. Local verification is
  current; remote CI/release verification is not current until the stack is pushed and checked.
- **method**: baseline fixed to committed HEAD. Hybrid working-tree changes outside this audit are
  excluded unless explicitly mentioned.

## Current local gate results

- `bun run test`: **117 files passed / 1203 tests passed** on Windows
  (`U-ADAPTER-009` Windows `.cmd` provider path included).
- `bun run typecheck`: clean.
- `bun run lint`: clean (`biome check src tests`, 273 files).
- `bun src\cli.ts doctor`: clean. Notable gates:
  - `l7-completion - OK`;
  - `l14-close-audit - OK`;
  - `codex-hook-adapter - OK`;
  - `runtime-portability - OK`;
  - `readability - OK`;
  - `green-command-digest - OK`;
  - `drive-db-registration - OK`.
- `bun src\cli.ts status --json`: `nonTerminalPlansTotal=6`, all `versionUpParked=6`;
  `activeDraftTotal=0`; `openDefers=0`.

## A-146 finding re-classification

| id | A-146 finding | current evidence | A-147 disposition |
|---|---|---|---|
| A146-1 | Shipped adapter lacked enforced guard governance. | `.claude/settings.json` wires `Agent|Task` to agent-guard; `.codex/hooks.json` wires `spawn_agent|spawn_agents_on_csv` to the same guard and `apply_patch|write_file` to work-guard. `doctor codex-hook-adapter` OK; `tests/agent-guard.test.ts` and `tests/codex-hook-adapter.test.ts` pass. | **Resolved locally.** Hosted/API tool surfaces remain explicitly outside repo-hook enforcement and are disclosed by doctor. |
| A146-2 | Consumer install/PATH could fail because hooks call bare `ut-tdd`. | `package.json` has `bin.ut-tdd = ./src/cli.ts`; setup/distribution tests pass, including `U-SETUP-013 / AT-DIST-001` clean artifact install and CLI surface smoke. | **Resolved locally.** Public consumer install remains post-publication evidence. |
| A146-3 | Green evidence integrity relied on digest restamp instead of re-run. | `green-command-digest` is a doctor hard gate and reports OK; current full test/typecheck/lint/doctor were re-run on this baseline. | **Resolved at gate level.** Stronger runtime-vs-projection test provenance remains A146-4 / L7-188 carry. |
| A146-4 | DB operation telemetry mixed runtime provenance with projection facade. | `doctor --strict-telemetry-provenance` exists and was added as a CLI surface; regular doctor green. `test_runs` still includes projected green-command evidence by design. | **Partial / carry.** The projection-vs-runtime distinction is now surfaced, but full runtime test-run capture is still L7-188 work. |
| A146-5 | Clean distribution allowlist leaked dogfood governance/audit material. | `tests/setup.test.ts` includes clean artifact denial of dogfood governance audit docs and passes; doctor `asset-drift`, `readability`, and distribution acceptance are green. | **Resolved locally.** |
| A146-6 | FE design L3/L5/L6 bodies remain pending / coverage is presence-heavy. | `frontend-design-coverage` remains green but explicitly reports body present 3 / pending 3. | **Open / parked population work.** Not a current consumer setup blocker, but blocks a claim of full FE design population. |
| A146-7 | Entry selection could degrade (`signal -> mode`, `kind x layer/drive`). | `task classify` route metadata and frontmatter `kind x layer` fail-close are in place; doctor `plan-governance`, `branch-kind-check`, and `drive-model-passage` green. | **Resolved for surfaced authoring gates.** Full automatic fail-close at every future work-entry surface is still future integration. |
| A146-8 | Claude subagent matcher could miss `Task` vs `Agent`; Codex spawn surface needed guard parity. | `.claude/settings.json` uses `Agent|Task`; `AGENT_TOOL_NAMES` includes `Agent`, `Task`, `spawn_agent`, and `spawn_agents_on_csv`; `.codex/hooks.json` guards Codex spawn verbs. | **Resolved locally.** Target-runtime release proof remains external/post-publication. |

## Post-A-146 findings

### A147-1 - Windows provider-spawn regression

**Previous state.** At baseline `7def93a`, native Windows provider-spawn tests failed because the
`.cmd` provider path was not handed to `cmd.exe` with the correct verbatim quoting contract.

**Current state.** Fixed locally by `12f7c9e fix: repair windows provider spawn quoting` under
`PLAN-L7-203`. Evidence:

- `ProviderInvocation` carries `windowsVerbatimArguments`.
- `src/runtime/adapter.ts` launches Windows `.cmd` / `.bat` providers through a fully wrapped
  `cmd.exe /d /s /c ""<script.cmd>" "<arg>""` form.
- `src/cli.ts` propagates `windowsVerbatimArguments` through adapter and team execution paths.
- `tests/runtime-adapter.test.ts` includes `U-ADAPTER-009`, a Windows-host regression test for a
  `.cmd` provider under a space-containing path.
- Current `bun run test` passes 1203/1203, including the previously failing provider-spawn lane
  (`runtime-hook-entrypoints`, `cli-surface`, and `distribution-acceptance`).

**Disposition:** **Resolved locally.**

### A147-2 - Local stack outruns remote CI

`main` is 17 commits ahead of `origin/main`. Local gates are green, but remote CI has not verified
this stack and release/tag artifacts have not been published from it.

**Disposition:** **External / human-required.** Do not claim production, release, or public
distribution close until push + CI + release publication evidence exists.

### A147-3 - Handover pointer drift

The stale handover pointer recorded by the earlier A-147 draft has been synced. Current doctor
reports handover OK.

**Disposition:** **Resolved locally.**

## Close classification

- **L7 local close:** acceptable. Current machine state has `activeDraftTotal=0`, no open defers,
  and all non-terminal L7 plans are `versionUpParked`.
- **L8-L10 local workflow close:** acceptable for the implemented local gates: G8/G9/G10 workflow
  gates, distribution acceptance, runtime portability, provider-spawn, and doctor are green.
- **L12/L13/release/UAT:** still external/human-required. Current evidence does not include push,
  CI on the new remote HEAD, signed release artifact, tag publication, or real post-publication
  consumer install.
- **Known local carries:** A146-4 runtime-vs-projection telemetry provenance strategy and A146-6
  FE design body population/substance checks.

## Next recommended slice

1. Push the corrected stack and wait for CI to verify the new remote HEAD.
2. Publish/verify the clean distribution artifact and tag if release close is being attempted.
3. Continue L7-188 runtime test-run provenance so projected green-command evidence cannot be
   confused with actual runtime test telemetry.
4. Populate or explicitly defer the remaining FE L3/L5/L6 design bodies before claiming full FE
   design population.
