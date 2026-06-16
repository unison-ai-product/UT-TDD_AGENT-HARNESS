---
plan_id: PLAN-L7-67-team-launch-policy
title: "PLAN-L7-67: deterministic team launch policy"
kind: impl
layer: L7
drive: agent
parent_design: docs/design/harness/L6-function-design/agent-slots.md
status: completed
created: 2026-06-16
updated: 2026-06-16
review_evidence:
  - reviewer: Godel
    review_kind: intra_runtime_subagent
    worker_model: gpt-5.4
    reviewer_model: inherited
    tests_green_at: "2026-06-16"
    reviewed_at: "2026-06-16"
    verdict: pass
    scope: "deterministic team suggest launch policy, CLI surface, tests, README and L6/L7 trace updates; reviewer findings addressed for Windows CLI timeout margin and standard/risk oracle coverage"
agent_slots:
  - role: tl
    slot_label: "TL - deterministic team launch policy"
generates:
  - artifact_path: src/team/launch-policy.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/team-launch-policy.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: README.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/agent-slots.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: PLAN-L7-65
  requires:
    - docs/design/harness/L6-function-design/agent-slots.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-67: deterministic team launch policy

## Objective

Make subagent launch timing explicit and machine-checkable before provider CLIs are started.

## Scope

- Add `recommendTeamLaunch` so free-form tasks deterministically return launch/no-launch, trigger, reason, difficulty, and an optional `TeamDefinition`.
- Add `ut-tdd team suggest --task ... --json` as the non-destructive CLI surface.
- Keep non-`hybrid` modes fail-closed with `trigger="unavailable"` instead of silently replacing cross-provider review.
- Route recommended definitions through the existing `teamDefinitionSchema` / `team run` flow.
- Document launch triggers in README, L6 design, and L7 test design.

## Verification

- [x] `bun run typecheck`
- [x] `bunx vitest run tests\team-launch-policy.test.ts tests\team-run.test.ts tests\cli-surface.test.ts`
- [x] `bun run lint`
- [x] `bun run test:node-fallback`
- [x] `bun src\cli.ts db rebuild --json`
- [x] `bun src\cli.ts doctor`
- [x] `bun run test`

## DoD

- [x] Trivial/simple tasks do not launch a team unless risk terms are present.
- [x] Standard+ or risk-bearing tasks recommend a cross-provider team in `hybrid` mode.
- [x] Non-`hybrid` modes return unavailable without implicit fallback.
- [x] Critical recommendations add implementation, review, and QA roles with deterministic high-effort model selection.
- [x] CLI output is JSON-machine-readable and does not start providers.
