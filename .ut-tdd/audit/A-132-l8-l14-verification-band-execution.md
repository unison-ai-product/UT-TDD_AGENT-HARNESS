# A-132 - L8-L14 verification band execution

- **date**: 2026-06-11
- **plan**: PLAN-M-00-verify-cutover
- **scope**: local verification band execution for L8-L14 using `harness.db` roadmap/review projections
- **accepted_by**: Codex TL, intra-runtime review fallback

## Result

`PLAN-VERIFY-CUTOVER-00` is completed for the local verification band.

The execution is intentionally bounded:

- L8-L11 and L14 are verified as local audit/feedback rows.
- L12 and L13 are recorded as `passed_local` with `human_required=1` because production deploy, post-deploy observation, and PO signoff are outside this local execution band.
- No production deployment, destructive cutover, credential change, vendor edit, or infrastructure change was performed.

## Evidence

- `harness.db` rebuild emits 7 `workflow_runs` for workflow `L8-L14-verification-band`.
- `harness.db` rebuild emits 7 matching `gate_runs` with gate ids `G-VERIFY.L8` through `G-VERIFY.L14`.
- `harness.db` rebuild emits `coverage` rows for:
  - `covered_program_bands = 5 / 5`
  - `reached_roadmap_gates = 20 / 20`
  - `passing_review_evidence = 2 / 2`
- `docs/plans/PLAN-M-00-verify-cutover.md` is now `status: completed`.

## Verification Commands

- `npx vitest run tests/projection-writer.test.ts`
- `npx tsc --noEmit`
- `npx vitest run tests/projection-writer.test.ts tests/state-db.test.ts tests/roadmap.test.ts tests/review-evidence.test.ts tests/doctor.test.ts tests/verification-profile.test.ts tests/relation-graph.test.ts`
- `bun run src/cli.ts db rebuild --json`
- `bun run src/cli.ts doctor`

## Boundary

This audit closes the local L8-L14 verification band execution. It is not approval for production deployment, PO final UAT signoff, or destructive HELIX-to-UT cutover.
