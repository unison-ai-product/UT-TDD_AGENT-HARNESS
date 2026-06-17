---
description: Author a spec-first design before any implementation (spec → test design → impl)
argument-hint: "<feature description>"
---

Write the spec/design first for UT-TDD, before any code. Use the
`spec-driven-development` and `documentation-and-adrs` skills.

Target: $ARGUMENTS

Produce a design doc under `docs/design/` at the correct V-model layer with:
Objective/TL;DR, Scope/Non-goals, Prerequisites (upstream layer docs, PLAN/ADR
IDs), the design at unit-test-design granularity, and acceptance/verification
criteria. New terms go to the L0 glossary.

The spec is paired (V-model): an L5/L6 design section maps 1:1 to an L6/L8 test
design. Do not embed test cases or code in the design doc — they are separate
artifacts linked by reference.

Freeze readiness: run the readability check (Objective present, no half-width
kana / U+FFFD), `ut-tdd plan lint`, and `ut-tdd doctor` (exit 0) before
pair-freeze. Implementation follows only after the spec and its paired test
design are frozen.
