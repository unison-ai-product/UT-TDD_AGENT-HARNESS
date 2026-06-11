# Session Handover: Cutover Strategy Backfill + harness.db Projection

Date: 2026-06-11
Active plan: `PLAN-M-01-cutover-backfill`
Status: completed

## Completed

- Rewrote `docs/migration/helix-to-ut-tdd-cutover-strategy.md` to ADR-001 current truth:
  - HELIX is reference-only.
  - UT-TDD execution is TypeScript/Bun under `src/`.
  - `ut-tdd` and `.ut-tdd/` are the active command/state path.
  - Vendor and `.helix/` are not product runtime state.
- Implemented `harness.db` projection backfill:
  - `roadmap_rollups`
  - `roadmap_band_coverage`
  - `roadmap_gate_progress`
  - `review_evidence_registry`
- Updated `PLAN-M-01-cutover-backfill` to `completed`.
- Updated `ut-tdd db rebuild` CLI note to reflect current deterministic projections.

## Verification

- `npx tsc --noEmit`
- `npx vitest run tests/projection-writer.test.ts tests/state-db.test.ts tests/roadmap.test.ts tests/review-evidence.test.ts tests/doctor.test.ts`
  - 5 files, 68 tests passed.
- `bun run src/cli.ts db rebuild --json`
  - `roadmap_rollups`: 1
  - `roadmap_band_coverage`: 5
  - `roadmap_gate_progress`: 20
  - `review_evidence_registry`: 159
- `bun run src/cli.ts doctor`
  - roadmap-rollup: bands 5/5, gates 20/20, spans 79/79, frontier none.
- stale cutover strategy scan:
  - no hits for old Python port, HELIX runtime command route, WSL2-required wording, or personal absolute paths in the backfilled strategy doc.

## Residual State

- No production cutover was performed.
- No vendor snapshot files were modified.
- `.ut-tdd/harness.db` is generated projection state and can be rebuilt.

## Next Action

Proceed to the next larger band only after this commit:

`PLAN-VERIFY-CUTOVER-00` / L8-L14 verification band execution can now consume `harness.db` roadmap and review evidence projections as feedback/audit inputs.
