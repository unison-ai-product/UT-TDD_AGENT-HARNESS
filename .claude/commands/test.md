---
description: Drive the change test-first (Red → Green → Refactor) per UT-TDD TDD discipline
argument-hint: "<unit or behavior under test>"
---

Implement test-first for UT-TDD. Use the `test-driven-development` skill (and
`testing` for level/fixture choices).

Target: $ARGUMENTS

Discipline (FR-L1-02 — test-first order, no implement-before-test):

1. **Red** — write the failing test against the L6 unit-test design (or the
   spec's acceptance criteria). Run `bun run test` and confirm it fails for the
   right reason. Commit the failing test as Red evidence.
2. **Green** — write the minimum implementation to pass. Run `bun run test`.
3. **Refactor** — clean up with tests green; run `bun run typecheck` and
   `bun run lint`.

Oracle strength: assert real behavior (no `toBeTruthy()` on complex objects, do
not mock the unit under test, use real harness state for integration paths).
Use Vitest (`bun run test`), not `bun test` (its sync timeout is flaky).

Before trace-freeze: `bun run typecheck`, `bun run lint`, `bun run test`, and
`ut-tdd doctor` all green; then `ut-tdd review --uncommitted` for evidence.
