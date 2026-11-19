---
description: Break a GitHub Issue into verifiable steps and record their ordering
argument-hint: "<feature or task description>"
---

Record the steps in the GitHub Issue. Use the
`planning-and-task-breakdown` and `gate-planning` skills.

Target: $ARGUMENTS

Search for an existing Issue for the same outcome before filing one. Follow
`docs/governance/github-issue-hierarchy.md` for parent and child Issues.

Produce:

1. **Decomposition** — steps at V-model unit-test-design granularity (each step
   = one design-doc section or one `src/` module + its test). A step labeled
   "implement feature X" without named files is too large; split it.
2. **§工程表 schedule** — each step marked `[並列]` or `[直列]`; a `[直列]` step
   must cite a serialization reason (file_conflict / downstream_dependency /
   shared_state). At least one review step is required.
3. **Acceptance criteria** — tied to the relevant FR or layer gate, each a
   falsifiable check naming the `ut-tdd` command that verifies it.
4. **Dependencies** — links to the prerequisite Issues and design revisions.

Verify that the linked Issues and design revisions exist and that their ordering
matches the stated prerequisites.
