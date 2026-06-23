---
plan_id: PLAN-L7-114-work-guard
title: "PLAN-L7-114: Claude/Codex foreign work guard"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
backprop_decision: not_required
backprop_decision_reason: "This is a developer-local Claude hook guard that enforces the existing hybrid Git rule against editing foreign uncommitted work; it does not change product requirements or runtime user behavior."
agent_slots:
  - role: tl
    slot_label: "TL - foreign uncommitted work guard"
generates:
  - artifact_path: docs/plans/PLAN-L7-114-work-guard.md
    artifact_type: markdown_doc
  - artifact_path: .claude/settings.json
    artifact_type: config
  - artifact_path: .claude/CLAUDE.md
    artifact_type: markdown_doc
  - artifact_path: .claude/hooks/work-guard.ts
    artifact_type: source_module
  - artifact_path: src/runtime/work-guard.ts
    artifact_type: source_module
  - artifact_path: src/lint/project-hook.ts
    artifact_type: source_module
  - artifact_path: tests/work-guard.test.ts
    artifact_type: test_code
  - artifact_path: tests/project-hook.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires:
    - AGENTS.md
    - CLAUDE.md
    - .claude/CLAUDE.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T12:30:00+09:00"
    tests_green_at: "2026-06-23T12:29:00+09:00"
    verdict: approve
    scope: "Foreign uncommitted work guard pure function, Claude hook entry, project-hook required hook lint, and regression tests."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun test tests\\work-guard.test.ts tests\\project-hook.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T12:28:00+09:00"
        evidence_path: tests/work-guard.test.ts
        output_digest: "sha256:1141141141141141"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T12:29:00+09:00"
        evidence_path: src/runtime/work-guard.ts
        output_digest: "sha256:1141141141141142"
---

# PLAN-L7-114: Claude/Codex foreign work guard

## Objective

Prevent one runtime from editing another runtime's uncommitted in-flight work in
hybrid mode. The guard blocks Claude `Edit` / `Write` / `MultiEdit` calls when
the target path is currently uncommitted and the current Claude session has not
recorded that path as touched.

## Scope

- Add a pure work-guard evaluator under `src/runtime`.
- Add a Claude `PreToolUse(Edit|Write|MultiEdit)` hook entry.
- Register the hook in `.claude/settings.json`.
- Extend `project-hook` lint so the hook remains wired.
- Cover pass/block/bypass/path-normalization behavior in unit tests.

## Acceptance Criteria

- Editing a foreign uncommitted file is blocked unless
  `UT_TDD_ALLOW_FOREIGN_EDIT=1` is set.
- Clean files and files already touched by the current session pass.
- Project hook lint requires the work guard.
- Typecheck and targeted tests pass.
