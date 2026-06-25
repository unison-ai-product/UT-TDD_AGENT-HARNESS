---
plan_id: PLAN-L7-161-task-classify-policy-extraction
title: "PLAN-L7-161: task classify policy extraction"
kind: refactor
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant extraction of task classification policy constants. No public CLI/API contract, persisted schema, or workflow semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - task classify policy extraction"
  - role: tl
    slot_label: "TL - classifier invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-161-task-classify-policy-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/task/classify.ts
    artifact_type: source_module
  - artifact_path: src/task/classify-policy.ts
    artifact_type: source_module
  - artifact_path: tests/task-classify.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-160-runtime-adapter-policy-extraction.md
  requires:
    - docs/process/modes/refactor.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T19:39:00+09:00"
    tests_green_at: "2026-06-25T19:39:00+09:00"
    verdict: approve
    scope: "Extract task classification kind, risk, uncertainty, baseline coverage, and guardrail policy into a sidecar module."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\task-classify.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T19:37:29+09:00"
        evidence_path: tests/task-classify.test.ts
        output_digest: "sha256:5f3b411831eaf5df7f40ac95cce1623fd7f47b85ebc2ff6012b53b5610dd519d"
      - kind: unit_test
        command: "bun run vitest run tests\\task-classify.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T19:37:29+09:00"
        evidence_path: src/task/classify.ts
        output_digest: "sha256:33574ac2f312fdc154f7aef077c47a89d433e9093b077f8e9dc93ff45502f10f"
      - kind: unit_test
        command: "bun run vitest run tests\\task-classify.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T19:37:29+09:00"
        evidence_path: src/task/classify-policy.ts
        output_digest: "sha256:7781c8d712eab28fa8cffc2ade45c855c1600c921175d175b7efd67ec4900587"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T19:39:00+09:00"
        evidence_path: src/task/classify.ts
        output_digest: "sha256:33574ac2f312fdc154f7aef077c47a89d433e9093b077f8e9dc93ff45502f10f"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T19:39:00+09:00"
        evidence_path: tests/task-classify.test.ts
        output_digest: "sha256:5f3b411831eaf5df7f40ac95cce1623fd7f47b85ebc2ff6012b53b5610dd519d"
---

# PLAN-L7-161: task classify policy extraction

## Objective

Reduce the remaining `externalize-policy` candidates by extracting task
classification policy constants from `src/task/classify.ts`.

## Scope

- Move kind inference patterns, risk terms, uncertainty terms, baseline proposal
  coverage, routing test doc policy, and proposal guardrails to
  `src/task/classify-policy.ts`.
- Keep `src/task/classify.ts` responsible for deterministic composition and
  result construction.
- Add direct test coverage for the sidecar policy constants.

## Acceptance Criteria

- Task classification and proposal document coverage behavior remains unchanged.
- `tests/task-classify.test.ts` passes and directly imports the sidecar policy.
- Typecheck, lint, DB rebuild, and doctor pass.
