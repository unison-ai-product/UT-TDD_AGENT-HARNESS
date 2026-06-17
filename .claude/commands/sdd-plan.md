---
description: Break work into verifiable, machine-checkable PLAN steps (per-requirement, parallel/serial marked)
argument-hint: "<feature or task description>"
---

Decompose the task into a UT-TDD PLAN with verifiable steps. Use the
`planning-and-task-breakdown` and `gate-planning` skills.

Target: $ARGUMENTS

Before authoring, inspect existing `docs/plans/` — prefer extending an existing
PLAN over creating an overlapping one (one PLAN per requirement that needs a
design doc; do not lump multiple requirements).

Produce:

1. **Decomposition** — steps at V-model unit-test-design granularity (each step
   = one design-doc section or one `src/` module + its test). A step labeled
   "implement feature X" without named files is too large; split it.
2. **§工程表 schedule** — each step marked `[並列]` or `[直列]`; a `[直列]` step
   must cite a serialization reason (file_conflict / downstream_dependency /
   shared_state). At least one review step is required.
3. **Acceptance criteria** — tied to the PLAN's FR or layer gate, each a
   falsifiable check naming the `ut-tdd` command that verifies it.
4. **Dependencies** — `requires` / `parent`, each pointing at an existing doc.

Validate with `ut-tdd plan lint` (schedule + dependency existence) and confirm
`ut-tdd doctor` exits 0. Author per the schema in `.claude/CLAUDE.md` PLAN Rules.
