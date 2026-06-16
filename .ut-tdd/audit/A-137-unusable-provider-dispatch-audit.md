# A-137 Unusable Provider-Dispatch Feature Audit

Date: 2026-06-16

Goal: enumerate provider-dispatch surfaces that were configured but not actually usable, then define and track countermeasures.

## Result

The self-contained UT-TDD command surface remains usable: `status`, `doctor`, DB maintenance, plan lint, `review --uncommitted`, task classification, skill suggestion, dry-runs, cutover dry-run, and handover.

The broken surface was live provider dispatch:

- `ut-tdd codex --execute`
- `ut-tdd team run --execute`
- hybrid live cross-review dispatch

Root causes:

1. Codex had no native command resolution and could hit a broken wrapper on PATH.
2. `team run --execute` spawned raw member adapter commands instead of the shared provider invocation path.
3. Runtime detection treated command-name presence as provider availability, so `hybrid` could be a false positive.
4. The adapter still carried HELIX wrapper env names even though UT-TDD provider dispatch must be product-owned.

## Unusable-Feature Matrix

| # | Feature | Root cause | Countermeasure | Status |
|---|---|---|---|---|
| 1 | `ut-tdd codex --execute` | Bare `codex` could resolve to a non-spawnable wrapper; Windows command scripts needed shell-safe invocation. | Add `resolveCodexNativeCommand()`, prefer `%APPDATA%\\npm\\codex.exe/codex.cmd`, honor `UT_TDD_CODEX_BIN`, and wrap `.cmd` / `.bat` invocation safely. | verified by unit, hook-entrypoint, full regression, and doctor |
| 2 | `ut-tdd team run --execute` | Team execution bypassed shared adapter/native resolution. | Route `runCommand` through `buildProviderInvocation(provider, command, args)`. | verified by fake-provider team execution and full regression |
| 3 | Hybrid cross-review live dispatch | Depends on #1 and #2. | Restore both provider execution paths and verify fake cross-provider team execution. | dispatch mechanism verified; live AI task invocation intentionally not run in this audit |
| 4 | `status` / `doctor` provider availability | Detection used PATH name presence without spawnability. | Use capability probe (`--version`) and report availability only when the provider can actually spawn. | verified by doctor reporting `mode=hybrid` only after provider probes |
| 5 | HELIX runtime env debt | Provider dispatch emitted or depended on HELIX wrapper env names. | Use `UT_TDD_CLAUDE_BIN` / `UT_TDD_CODEX_BIN`; strip `HELIX_ALLOW_RAW_*`, `HELIX_RAW_*_REASON`, `HELIX_CLAUDE_BIN`, and `HELIX_CODEX_BIN` from provider execution env. | verified by tests and HELIX-separation search |
| 6 | Native Claude version sort | Mixed-source lexicographic sorting may not pick semver-newest native binary. | Sort by parsed semver per source. | deferred low-priority follow-up |

## No-Omission Rule

- A provider reported available by `status` is not proven usable until the resolved binary actually spawns.
- `ut-tdd claude --execute` working does not imply `team run --execute` works.
- Cross-review policy correctness does not prove live dispatch usability.
- Countermeasures are closed only after targeted tests, full regression, `doctor`, and HELIX-separation search evidence are clean.

## Current Implementation Evidence

- `src/runtime/adapter.ts` owns provider command resolution and invocation.
- `src/runtime/detect.ts` uses provider spawnability.
- `src/cli.ts` routes both single-provider execution and team execution through `buildProviderInvocation`.
- Tests cover capability-based detection, Codex override resolution, Windows command-script invocation, provider handover kind, hook wrapper lifecycle, and fake cross-provider team execution.

## Verification Completed

- `bun run typecheck` passed.
- `bun run lint` passed.
- `bun run src\\cli.ts doctor` passed.
- `bun run test` passed: 81 files, 677 tests.
- HELIX-separation search passed for UT-TDD-owned runtime/test/handover surfaces.
- `PLAN-L7-68` and the handover docs now distinguish mechanical handover from explicit handover.

## Remaining Carry

- Native Claude version semver sorting remains a deferred low-priority follow-up.
- Live AI task execution through real cross-provider `team run --execute` was not invoked in this audit; the dispatch mechanism is covered by fake-provider execution tests and provider spawnability probes.
