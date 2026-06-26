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
  - role: aim
    slot_label: "AIM - troubleshoot classification and runtime guard review"
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
        output_digest: "sha256:5ff89dd03a0e6ec91733514d7c94ee10a7bf2dbe8b148a24c73d779a0681c35b"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T12:29:00+09:00"
        evidence_path: src/runtime/work-guard.ts
        output_digest: "sha256:ad589a73486d347838c5b913d7746df7b8037a50c2e97baa29790b2c22b8c81b"
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

## Correction note (2026-06-23, PLAN-RECOVERY-05 dogfood)

The AC "files already touched by the current session pass" was not actually met by
the first implementation. `normalizeRepoRelative` resolved repo-relative paths with
`startsWith(repoRoot)`, but the session log records `target` with a tool-name prefix
(e.g. `"Write c:\\...\\repo\\src\\x.ts"`). The prefix defeated `startsWith`, so the
session-touched set never matched git-porcelain paths and the guard false-blocked the
agent's own uncommitted files. Fixed by matching `repoRoot` as a substring (`indexOf`),
tolerating the prefix; bare absolute paths keep identical behavior. Regression test added
in `tests/work-guard.test.ts` (session-log prefixed target -> repo-relative). Found by
dogfooding the Iron Law (PLAN-RECOVERY-05): the guard blocked an own-session edit, and
root-causing instead of overriding blindly surfaced the normalization bug.

Resolved (2026-06-23): an agent-accessible override path was added alongside the env var.
Writing a non-empty reason to `.ut-tdd/state/foreign-edit-override` (gitignored runtime
state, writable mid-session via the Write tool) bypasses the guard; an empty/whitespace
marker does not (no silent bypass without a reason). Every marker bypass is appended to
`.ut-tdd/logs/foreign-edit-overrides.jsonl` (ts/target/reason/session) so it leaves an
audit trail. Pure resolver `resolveForeignEditOverride` + hook marker read/audit, covered
by `tests/work-guard.test.ts`.
