---
schema_version: skill.v1
name: quality-lv5
skill_type: testing
applies_to:
  layers:
    - L4
    - L6
  drive_models:
    - Forward
    - Add-feature
    - Refactor
    - Recovery
---

# quality lv5

This is a UT-TDD Agent Harness skill document. Use it with the repository workflow, ut-tdd commands, and .ut-tdd/ state.

## Scope

- Applies to the layers and drive models declared in frontmatter.
- Supports design, implementation, review, verification, or handover work according to skill_type.
- Treats docs/skills/ as the canonical skill catalog for this repository.

## Operating Rules

- Read the relevant repository docs and target files before editing.
- Keep changes scoped to the requested workflow and existing design boundaries.
- Use deterministic ut-tdd validation, TypeScript/Bun checks, and focused tests.
- Record handover or evidence in .ut-tdd/ when a task crosses session or runtime boundaries.
