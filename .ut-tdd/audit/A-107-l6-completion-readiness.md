# A-107 L6 Completion Readiness Pre-Audit

Date: 2026-06-09
Scope: L6 function-design completion readiness for G6.
Status: not ready / Forward continuing.

## Evidence

- `bun run lint`: green.
- `bun run typecheck`: green.
- `npx vitest run`: green, 33 files / 277 tests.
- `bun src\cli.ts doctor`: exit 0.
- `doctor l6-fr-coverage`: OK, FR registry 46 rows all mapped to L6 unit contract and U-* oracle.
- `doctor l6-completion`: not ready, with `freeze-inputs OK` and `unit-contract substance gaps: 0`.

## Current Not-Ready Conditions

`l6-completion` currently reports:

- L6 design docs: 18 total, 18 draft.
- L6 freeze inputs: OK (owning-plan trace, L7 pair trace, and unit-contract substance are complete before status flip).
- L6 unit-contract substance gaps: 0.
- L6 design/add-design PLANs: 11 draft.
- L7 unit-test-design: draft.
- G6 gate row: not reached.

## Added Guard

PLAN-L6-22 / PLAN-L7-23 / PLAN-REVERSE-22 added `l6-completion` as a warn-only readiness lint:

- `src/lint/l6-completion.ts`
- `tests/l6-completion.test.ts`
- `src/doctor/index.ts` `checkL6Completion`

The guard now checks L6 doc status, owning `plan:` trace, L7 pair trace, L6 PLAN status/review evidence, L7 status, and G6 status. It is intentionally warn-only until the G6 audit can harden it without creating a false fail before L6 is ready.

`gate-confirm` was also tightened so gate cells with generated suffix text still parse as `G*`. This exposed two stale confirmed L6 docs while G6 was not reached; both were returned to `status: draft`, and the L6 master inventory was aligned.

## Completion Criteria For G6

L6 can be called complete only when:

- every file under `docs/design/harness/L6-function-design/*.md` is `status: confirmed` or explicitly superseded by a confirmed PLAN;
- every L6 design doc resolves to an owning `plan:` reference and is referenced by L7 by filename;
- all owning L6 design/add-design PLANs are `status: confirmed` and have valid `review_evidence`;
- `docs/test-design/harness/L7-unit-test-design.md` is `status: confirmed`;
- `docs/governance/gate-design.md` records G6 PASS or references a matching audit record;
- `l6-completion` changes from not-ready to OK;
- `l6-fr-coverage`, `pair-freeze`, `plan-schedule`, `review-evidence`, lint, typecheck, vitest, and doctor remain green.

## Residual Work

- G6 semantic review has not been performed in this session.
- Cross-agent / independent reviewer evidence is still needed before flipping the draft L6 docs and PLANs.
- L6 completion is therefore not achieved yet.
