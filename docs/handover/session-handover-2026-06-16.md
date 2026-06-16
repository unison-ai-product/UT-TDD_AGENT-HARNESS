# Session Handover - 2026-06-16

## Mechanical Handover

Machine-readable handover state:

- Current session pointer: `.ut-tdd/handover/CURRENT.json`
- Current provider handover: `.ut-tdd/handover/provider/CURRENT.json`
- Provider package: `.ut-tdd/handover/provider/20260616091932-claude-to-codex-plan-l7-68.json`
- Provider package kind: `mechanical`
- Active plan: `PLAN-L7-68`
- Status: `confirmed`
- Latest pushed branch before this work: `codex/harden-automation-team-launch`
- Latest pushed head before this work: `8d31c3c docs: add A-137 unusable-dispatch audit and codex handover`

The mechanical handover records structured routing data only: provider direction, active plan, budget note, next actions, and relevant files. It is not the place for nuanced engineering judgement.

## Explicit Handover

Human-readable handover state:

- A-137 identified that several provider-dispatch surfaces were configured but not actually usable.
- `ut-tdd claude --execute` was usable through native `claude.exe` resolution.
- `ut-tdd codex --execute`, `ut-tdd team run --execute`, and live hybrid cross-review dispatch were not proven usable.
- Root causes were:
  - Codex did not have native command resolution.
  - `team run --execute` spawned raw member commands instead of the shared provider adapter command path.
  - `status` / `doctor` treated command-name presence as availability without probing whether the provider could actually spawn.

## Work Completed In This Continuation

- Added Codex native command resolution with `UT_TDD_CODEX_BIN` support.
- Reused provider command resolution for both single-provider execution and `team run --execute`.
- Added Windows `.cmd` / `.bat` invocation handling for provider CLIs.
- Changed runtime detection to use provider capability probes (`--version`) so `hybrid` means spawnable, not just present on PATH.
- Added tests for capability-based detection, Codex command resolution, Windows command-script invocation, and fake-provider team execution.
- Added `handover_kind: "mechanical"` to provider handover packages.
- Replaced the unreadable latest handover text with this clean explicit handover.
- Opened `PLAN-L7-69` / `IMP-135` for expanded encoding-corruption detection.
- Added A-138 HELIX separation evidence; HELIX remains historical terminology or negative-test residue, not runtime state.

## Verification

- `bun run typecheck` passed.
- `bun run lint` passed.
- `bun run src\\cli.ts doctor` passed.
- `bun run test` passed: 81 files, 677 tests.
- `bun run src\\cli.ts db rebuild` was run after PLAN changes so `harness.db` projection is current.
- HELIX legacy-provider search passed for UT-TDD-owned runtime/test/handover surfaces.

## Carry

- `PLAN-L7-69-encoding-corruption-expanded-guard` is opened to expand mojibake / encoding-corruption detection beyond the current freeze-readability slice.
- `IMP-135` tracks the same encoding-corruption prevention need in the improvement backlog.
- Native Claude version semver sorting remains deferred low-priority follow-up work.
- Real cross-provider AI task execution was not invoked in this audit. The dispatch mechanism is verified by fake-provider execution tests and provider spawnability probes.

## Do Not Break

- Do not make `status` report a provider available unless the provider command can actually spawn.
- Do not route `team run --execute` around the runtime adapter path.
- Do not reintroduce HELIX runtime state as UT-TDD product state.
- Do not put nuanced human judgement only in provider JSON; keep that in explicit handover markdown.
