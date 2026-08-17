---
description: Drive the change test-first (Red → Green → Refactor) per UT-TDD TDD discipline
argument-hint: "<unit or behavior under test>"
---

Implement test-first for UT-TDD. Use the `test-driven-development` skill (and
`testing` for level/fixture choices).

Target: $ARGUMENTS

Discipline (FR-L1-02 — test-first order, no implement-before-test):

1. **Red** — write the failing test against the L6 unit-test design (or the
   spec's acceptance criteria). Run `npm run test` and confirm it fails for the
   right reason. Commit the failing test as Red evidence.
2. **Green** — write the minimum implementation to pass. Run `npm run test`.
3. **Refactor** — clean up with tests green; run `npm run typecheck` and
   `npm run lint`.

Oracle strength: assert real behavior (no `toBeTruthy()` on complex objects, do
not mock the unit under test, use real harness state for integration paths).
Use Vitest (`npm run test`), not Node's built-in `node --test` runner.

Before trace-freeze: `npm run typecheck`, `npm run lint`, `npm run test`, and
`ut-tdd doctor` all green; then `ut-tdd review --uncommitted` for evidence.
