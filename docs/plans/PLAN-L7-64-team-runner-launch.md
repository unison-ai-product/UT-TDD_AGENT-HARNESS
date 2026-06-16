---
plan_id: PLAN-L7-64-team-runner-launch
title: "PLAN-L7-64: shared Claude/Codex team runner launch flow"
kind: impl
layer: L7
drive: fullstack
parent_design: docs/design/harness/L6-function-design/agent-slots.md
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
    scope: "team run launch plan and explicit execute path for shared Claude/Codex provider adapters"
agent_slots:
  - role: tl
    slot_label: "TL - shared team runner launch flow"
generates:
  - artifact_path: src/team/run.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/team-run.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/agent-slots.md
    artifact_type: design_doc
dependencies:
  parent: PLAN-L7-62
  requires:
    - docs/design/harness/L6-function-design/agent-slots.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-64: shared Claude/Codex team runner launch flow

## Objective

Move `ut-tdd team run` beyond validate-only so Claude and Codex members use one shared execution
flow for speed-oriented delegation.

## Scope

- Build a normalized launch plan from `.ut-tdd/teams/*.yaml` members.
- Keep dry-run as the default and require `--execute` for provider CLI launch.
- Use the existing provider adapters for Claude and Codex so runtime differences stay behind the adapter boundary.
- Record `team_runner` slots around explicit executions.
- Honor `strategy=parallel` / `max_parallel`; force sequential when serialization reasons are present.

## Verification

- [x] `bunx vitest run tests\team-run.test.ts tests\cli-surface.test.ts`

## DoD

- [x] Dry-run JSON shows both Claude and Codex launch plans from the same team definition.
- [x] Explicit execution path runs provider adapters through `team_runner` slots.
- [x] Parallel strategy is executed in `max_parallel` batches without serializing all members.
- [x] CLI surface remains non-destructive unless `--execute` is supplied.
