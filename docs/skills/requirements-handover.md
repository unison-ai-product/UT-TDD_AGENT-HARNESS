---
schema_version: skill.v1
name: requirements-handover
skill_type: process
applies_to:
  layers:
    - L1
  drive_models:
    - Forward
    - Add-feature
    - Discovery
    - Scrum
    - Reverse
    - Recovery
---

# requirements handover

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
