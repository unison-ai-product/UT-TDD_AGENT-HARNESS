---
plan_id: PLAN-L7-65-deterministic-model-policy
title: "PLAN-L7-65: deterministic model and effort policy for team runner"
kind: impl
layer: L7
drive: agent
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
    scope: "deterministic team-run model/effort selection, launch-plan evidence, and adapter metadata"
agent_slots:
  - role: tl
    slot_label: "TL - deterministic model/effort policy"
generates:
  - artifact_path: src/team/model-policy.ts
    artifact_type: source_module
  - artifact_path: src/team/run.ts
    artifact_type: source_module
  - artifact_path: src/runtime/adapter.ts
    artifact_type: source_module
  - artifact_path: src/schema/team.ts
    artifact_type: source_module
  - artifact_path: tests/team-model-policy.test.ts
    artifact_type: test_code
  - artifact_path: tests/team-run.test.ts
    artifact_type: test_code
  - artifact_path: tests/runtime-adapter.test.ts
    artifact_type: test_code
  - artifact_path: tests/team-schema.test.ts
    artifact_type: test_code
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/agent-slots.md
    artifact_type: design_doc
dependencies:
  parent: PLAN-L7-64
  requires:
    - docs/design/harness/L6-function-design/agent-slots.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-65: deterministic model and effort policy for team runner

## Objective

Make `ut-tdd team run` choose a concrete model and reasoning effort deterministically from task difficulty, while preserving the official Claude/Codex CLI invocation boundary.

## Scope

- Add a pure team model policy that infers `trivial|simple|standard|complex|critical` from task text unless explicitly supplied.
- Reuse `recommendModelEffort` so FR-L1-37 remains the model/effort contract.
- Emit `model_selection` in dry-run JSON and prompt headers; do not hide recommendations in uninspectable prompt state.
- Pass Codex model selection through the existing `codex exec ... -m <model>` shape. Pass Claude model and effort through `claude --print --input-format text --model <model> --effort <effort>` with the prompt on stdin, and mirror effort to `CLAUDE_CODE_EFFORT_LEVEL`.
- Preserve explicit team member overrides for `difficulty`, `model`, and `effort`, with `model` limited to provider model IDs/family aliases so typos fail closed.

## Verification

- [x] `bunx vitest run tests\team-model-policy.test.ts tests\team-run.test.ts tests\runtime-adapter.test.ts tests\team-schema.test.ts`

## DoD

- [x] Team launch plans expose deterministic `model_selection` for every member.
- [x] Critical tasks map to high effort and frontier family without requiring an LLM classifier.
- [x] Simple/trivial tasks map to low effort and fast Codex model where applicable.
- [x] Official CLI boundaries are preserved: Codex model flag is used; Claude model/effort flags are used; no provider API credentials are introduced.
- [x] Overrides are schema-validated and recorded as explicit sources; arbitrary model strings are rejected before execution.
