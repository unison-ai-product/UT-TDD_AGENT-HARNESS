---
plan_id: PLAN-L7-66-existing-repo-onboarding-readme
title: "PLAN-L7-66: existing-repo onboarding fallback templates and root README"
kind: impl
layer: L7
drive: agent
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
status: completed
created: 2026-06-16
updated: 2026-06-16
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: gpt-5.4
    reviewer_model: gpt-5.4
    tests_green_at: "2026-06-16"
    reviewed_at: "2026-06-16"
    verdict: pass
    scope: "setup fallback templates for target repos without harness docs and root README onboarding guidance"
agent_slots:
  - role: tl
    slot_label: "TL - existing-repo onboarding and README"
generates:
  - artifact_path: src/setup/index.ts
    artifact_type: source_module
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
  - artifact_path: docs/design/harness/L6-function-design/setup-solo-team.md
    artifact_type: design_doc
  - artifact_path: README.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/repository-structure.md
    artifact_type: doc_update
dependencies:
  parent: PLAN-L7-65
  requires:
    - docs/design/harness/L6-function-design/setup-solo-team.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-66: existing-repo onboarding fallback templates and root README

## Objective

Make the harness understandable and bootstrap-capable when introduced into an existing project that does not yet contain this repository's documentation/template tree.

## Scope

- Add built-in GitHub setup templates used when `docs/templates/github/` is absent in the target repository.
- Keep target repository templates as overrides when present.
- Add a root `README.md` that explains purpose, Windows/TS stance, source-checkout setup, team run, model/effort policy, and verification commands.

## Verification

- [x] `bunx vitest run tests\setup.test.ts`

## DoD

- [x] `loadTemplates` returns usable templates in an empty target repository.
- [x] Team CODEOWNERS placeholders render from built-in templates.
- [x] README documents existing-repo setup from a source checkout and team-run execution boundaries without implying a published `bunx ut-tdd` package.
