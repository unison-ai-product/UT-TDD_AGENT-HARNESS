# A-147 - Post-A-146 remediation verification audit

- **date**: 2026-06-30
- **scope**: verify, against current committed state and runtime evidence, the remediation stack
  landed after A-146 (the consolidated substance-gap audit) and re-classify each A-146 finding.
- **successor of**: [A-146](A-146-substance-gap-consolidated-remediation.md). A-146 stays the
  point-in-time record at its own baseline; this audit supersedes its dispositions where noted.
- **baseline**: current local remediation stack including A146-6 FE body population.
- **git state (material)**: local verification is current; remote CI/release verification is not
  current until the stack is pushed and checked.
- **method**: baseline fixed to committed HEAD. Hybrid working-tree changes outside this audit are
  excluded unless explicitly mentioned.

## Current local gate results

- `bun run test`: **117 files passed / 1204 tests passed** on Windows
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
  - `frontend-design-coverage - OK (body present 6 / pending 0)`;
  - `drive-db-registration - OK`.
- `bun src\cli.ts doctor --strict-telemetry-provenance`: clean; projection-only telemetry is
  fail-closable when strict provenance is required.
- `bun src\cli.ts telemetry scan --json`: persisted runtime model telemetry from Claude/Codex
  session logs (`totalRuns=129258`, `knownCostUsd=15157.78208`, `runsWithoutCost=8069`).
- `bun src\cli.ts status --json`: `nonTerminalPlansTotal=6`, all `versionUpParked=6`;
  `activeDraftTotal=0`; `openDefers=0`.

## A-146 finding re-classification

| id | A-146 finding | current evidence | A-147 disposition |
|---|---|---|---|
| A146-1 | Shipped adapter lacked enforced guard governance. | `.claude/settings.json` wires `Agent|Task` to agent-guard; `.codex/hooks.json` wires `spawn_agent|spawn_agents_on_csv` to the same guard and `apply_patch|write_file` to work-guard. `doctor codex-hook-adapter` OK; `tests/agent-guard.test.ts` and `tests/codex-hook-adapter.test.ts` pass. | **Resolved locally.** Hosted/API tool surfaces remain explicitly outside repo-hook enforcement and are disclosed by doctor. |
| A146-2 | Consumer install/PATH could fail because hooks call bare `ut-tdd`. | `package.json` has `bin.ut-tdd = ./src/cli.ts`; setup/distribution tests pass, including `U-SETUP-013 / AT-DIST-001` clean artifact install and CLI surface smoke. | **Resolved locally.** Public consumer install remains post-publication evidence. |
| A146-3 | Green evidence integrity relied on digest restamp instead of re-run. | `green-command-digest` is a doctor hard gate and reports OK; current full test/typecheck/lint/doctor were re-run on this baseline. Runtime-vs-projection telemetry is handled by the L7-188 stack. | **Resolved locally.** |
| A146-4 | DB operation telemetry mixed runtime provenance with projection facade. | `PLAN-L7-188` is confirmed and binds the landed slices: strict provenance fail-close (`PLAN-L7-192` / `PLAN-L7-205`), runtime `test_runs` from session logs (`PLAN-L7-193`), runtime model telemetry (`PLAN-L7-199`), runtime guardrail decisions (`PLAN-L7-200`), and runtime skill invocations (`PLAN-L7-201`). `doctor --strict-telemetry-provenance` is clean; `telemetry scan --json` persisted 129258 runtime model rows. | **Resolved locally.** Projection rows still exist intentionally as review-evidence history, but fired/used/works claims have a strict runtime-provenance path. |
| A146-5 | Clean distribution allowlist leaked dogfood governance/audit material. | `tests/setup.test.ts` includes clean artifact denial of dogfood governance audit docs and passes; doctor `asset-drift`, `readability`, and distribution acceptance are green. | **Resolved locally.** |
| A146-6 | FE design L3/L5/L6 bodies remain pending / coverage is presence-heavy. | PLAN-L3-06 / PLAN-L5-09 / PLAN-L6-36 added confirmed body docs for L3 `screen-functional`, L5 `ui-detail`, and L6 `screen-spec`; `frontend-design-coverage` now reports body present 6 / pending 0; `l6-completion` and `oracle-test-trace` are green after adding `U-SCREEN-*` L7 oracle citation. | **Resolved locally.** This closes the FE left-arm body population gap for the harness central UI. |
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

The clean distribution repository has now been published separately as
`unison-ai-product/UT-TDD_AGENT-HARNESS-Pack`.

2026-07-01 publication evidence:

- Pack repo URL: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS-Pack
- Pack commit: `88762478c9e4bbbf0d5621a42d40719204cdff2e`
- Pack CI: `harness-pack-check` passed on run `28492769730`.
- Pack CI covers frozen install, typecheck, distribution/runtime-portability smoke, lint,
  `setup --solo`, and `doctor --setup-smoke`.

Release/tag artifacts and UAT acceptance have not been published/accepted from it.

**Disposition:** **External / human-required.** Do not claim production, release, or public
release close until tag/signature publication and UAT evidence exist.

### A147-3 - Handover pointer drift

The stale handover pointer recorded by the earlier A-147 draft has been synced. Current doctor
reports handover OK.

**Disposition:** **Resolved locally.**

## Close classification

- **L7 local close:** acceptable. Current machine state has `activeDraftTotal=0`, no open defers,
  and all non-terminal L7 plans are `versionUpParked`.
- **L8-L10 local workflow close:** acceptable for the implemented local gates: G8/G9/G10 workflow
  gates, distribution acceptance, runtime portability, provider-spawn, and doctor are green.
- **L12/L13/release/UAT:** partially externalized. Clean Pack repo publication, remote CI, and
  setup-smoke evidence exist. Signed release artifact, tag publication, UAT acceptance, and real
  post-release consumer telemetry remain external/human-required.
- **Known local carry:** none from A-146 remains open locally. Release/publication proof is still
  external/human-required.

## Next recommended slice

1. Create/push the release tag from the verified Pack state if release close is being attempted.
2. Publish the signed tarball/checksum/signature set.
3. Record PO/UAT acceptance and post-release telemetry after real consumer use.
