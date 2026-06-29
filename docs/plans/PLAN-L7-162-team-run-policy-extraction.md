---
plan_id: PLAN-L7-162-team-run-policy-extraction
title: "PLAN-L7-162: team run policy extraction"
kind: refactor
layer: L7
drive: agent
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant extraction of team run prompt and validation policy constants. No public CLI/API contract, persisted schema, or workflow semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - team run policy extraction"
  - role: tl
    slot_label: "TL - team run invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-162-team-run-policy-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/team/run.ts
    artifact_type: source_module
  - artifact_path: src/team/run-policy.ts
    artifact_type: source_module
  - artifact_path: tests/team-run.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-161-task-classify-policy-extraction.md
  requires:
    - docs/process/modes/refactor.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T20:00:37+09:00"
    tests_green_at: "2026-06-25T20:00:37+09:00"
    verdict: approve
    scope: "Extract team run prompt, validation, frontier block, and dependency failure policy strings into a sidecar module. Follow-up: team member prompts expose resolved provider separately from model_family so cross-provider review evidence is unambiguous."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\team-run.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T19:58:58+09:00"
        evidence_path: tests/team-run.test.ts
        output_digest: "sha256:48679da7a5a6db9c2bce6753cf353943e40f0865b240244fff4a3f4c966f70d9"
      - kind: unit_test
        command: "bun run vitest run tests\\team-run.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T19:58:58+09:00"
        evidence_path: src/team/run.ts
        output_digest: "sha256:a31e6a97262d7a4beaabfcf0ad0e8ddfbcf20771c445d82f2d92eb3d5c96a634"
      - kind: unit_test
        command: "bun run vitest run tests\\team-run.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T19:58:58+09:00"
        evidence_path: src/team/run-policy.ts
        output_digest: "sha256:abb6418997ff1639ca6a083eceb02fa51c3e4c254a26e27330eaffd6fff1c7a9"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T20:00:37+09:00"
        evidence_path: src/team/run.ts
        output_digest: "sha256:a31e6a97262d7a4beaabfcf0ad0e8ddfbcf20771c445d82f2d92eb3d5c96a634"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T20:00:37+09:00"
        evidence_path: tests/team-run.test.ts
        output_digest: "sha256:48679da7a5a6db9c2bce6753cf353943e40f0865b240244fff4a3f4c966f70d9"
---

# PLAN-L7-162: team run policy extraction

## Objective

Reduce the remaining `externalize-policy` candidates by extracting team run
prompt and validation policy strings from `src/team/run.ts`.

## Scope

- Move member prompt headings/rules, validation messages, frontier-block
  messages, and dependency failure messages to `src/team/run-policy.ts`.
- Keep `src/team/run.ts` responsible for team construction, dependency ordering,
  adapter planning, and execution.
- Keep team member prompts explicit about resolved `provider` so cross-provider
  review evidence cannot confuse provider routing with model-family selection.
- Add direct test coverage for the sidecar policy through existing team run
  tests.

## Acceptance Criteria

- Team run behavior remains unchanged.
- `tests/team-run.test.ts` passes and directly imports the sidecar policy.
- Typecheck, lint, DB rebuild, and doctor pass.
