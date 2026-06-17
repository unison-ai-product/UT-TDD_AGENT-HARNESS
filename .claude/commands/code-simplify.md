---
description: Behavior-invariant refactor/simplification under a regression fence
argument-hint: "[optional file/scope]"
---

Simplify or refactor without changing behavior, for UT-TDD. Use the
`refactoring` skill.

Target: $ARGUMENTS

This is a `kind=refactor` activity (FR-L1-25): behavior is held invariant and
verified by regression, not by judgement.

1. **Fence** — confirm a protecting test net exists for the target's observable
   behavior. If coverage is thin, add characterization tests first (Green) before
   any structural change.
2. **One structural change per commit** — extract, rename, inline, or dedupe in
   isolation. Do not mix a refactor with a feature change or a bug fix.
3. **Verify after each step** — `bun run typecheck`, `bun run lint`,
   `bun run test` all green; `ut-tdd doctor` exit 0.
4. **No new behavior, no new tests of new behavior** during the refactor step —
   the existing net must stay green unchanged.

Update any design doc the refactor affects (dependency map / module boundaries),
then `ut-tdd review --uncommitted` for evidence before accept.
