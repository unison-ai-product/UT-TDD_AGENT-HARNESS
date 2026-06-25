---
plan_id: PLAN-L7-153-proposal-research-data-extraction
title: "PLAN-L7-153: proposal research data extraction"
kind: refactor
layer: L7
drive: db
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant catalog extraction inside task classification data. No public CLI/API contract, persisted schema, requirement semantics, or workflow semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - proposal research catalog extraction"
  - role: tl
    slot_label: "TL - classification invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-153-proposal-research-data-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/task/proposal-coverage-data.ts
    artifact_type: source_module
  - artifact_path: src/task/proposal-research-data.ts
    artifact_type: source_module
  - artifact_path: tests/task-classify.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-150-refactor-candidate-closure-sweep.md
  requires:
    - docs/plans/PLAN-L7-150-refactor-candidate-closure-sweep.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T17:23:53+09:00"
    tests_green_at: "2026-06-25T17:23:53+09:00"
    verdict: approve
    scope: "Behavior-invariant extraction of proposal research adoption/rejection catalog."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\task-classify.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T17:23:27+09:00"
        evidence_path: tests/task-classify.test.ts
        output_digest: "sha256:5f3b411831eaf5df7f40ac95cce1623fd7f47b85ebc2ff6012b53b5610dd519d"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T17:23:25+09:00"
        evidence_path: src/task/proposal-research-data.ts
        output_digest: "sha256:c028b8e6d44f65a79159a3741073753bdb1f33774976f2fcee39179e89b1ffbe"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T17:23:28+09:00"
        evidence_path: src/task/proposal-coverage-data.ts
        output_digest: "sha256:7d90403d7b0dcbc190e67c46405e6c468a8a481fbcfba1fdffafeff8d756807f"
---

# PLAN-L7-153: proposal research data extraction

## Objective

Reduce the `proposal-coverage-data.ts` split-module candidate by separating
proposal document-pack data from research adoption/rejection policy data.

## Scope

- Move research adoption, rejection, and LLM shrinkage catalogs to
  `src/task/proposal-research-data.ts`.
- Keep `src/task/proposal-coverage-data.ts` re-exporting the moved symbols so
  existing imports remain stable.
- Update task classification tests to import and verify the new catalog module
  directly.

## Acceptance Criteria

- Task classification and proposal document coverage behavior remains
  unchanged.
- `bun run vitest run tests\task-classify.test.ts` passes.
- `bun run typecheck`, `bun run lint`, DB rebuild, and doctor pass.
