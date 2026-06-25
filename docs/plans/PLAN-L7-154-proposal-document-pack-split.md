---
plan_id: PLAN-L7-154-proposal-document-pack-split
title: "PLAN-L7-154: proposal document pack split"
kind: refactor
layer: L7
drive: db
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant catalog split inside task classification data. No public CLI/API contract, persisted schema, requirement semantics, or workflow semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - proposal document pack split"
  - role: tl
    slot_label: "TL - classification invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-154-proposal-document-pack-split.md
    artifact_type: markdown_doc
  - artifact_path: src/task/proposal-coverage-data.ts
    artifact_type: source_module
  - artifact_path: src/task/proposal-document-pack-types.ts
    artifact_type: source_module
  - artifact_path: src/task/proposal-document-packs-core.ts
    artifact_type: source_module
  - artifact_path: src/task/proposal-document-packs-operations.ts
    artifact_type: source_module
  - artifact_path: tests/task-classify.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-153-proposal-research-data-extraction.md
  requires:
    - docs/plans/PLAN-L7-153-proposal-research-data-extraction.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T17:29:00+09:00"
    tests_green_at: "2026-06-25T17:29:00+09:00"
    verdict: approve
    scope: "Behavior-invariant split of proposal document pack catalog into core and operations modules."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\task-classify.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T17:28:43+09:00"
        evidence_path: tests/task-classify.test.ts
        output_digest: "sha256:5f3b411831eaf5df7f40ac95cce1623fd7f47b85ebc2ff6012b53b5610dd519d"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T17:28:43+09:00"
        evidence_path: src/task/proposal-document-pack-types.ts
        output_digest: "sha256:e2c59a540a7b3a5e9cb4ebff4c670d15890c5e47438c6e39712ce8d0c556ce03"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T17:29:00+09:00"
        evidence_path: src/task/proposal-coverage-data.ts
        output_digest: "sha256:7d90403d7b0dcbc190e67c46405e6c468a8a481fbcfba1fdffafeff8d756807f"
---

# PLAN-L7-154: proposal document pack split

## Objective

Close the remaining `proposal-coverage-data.ts` split-module pressure by
separating document pack type/helper definitions from the two document pack
catalog groups.

## Scope

- Move `DocumentPack`, level rank maps, and `doc()` to
  `src/task/proposal-document-pack-types.ts`.
- Split document pack catalog entries into
  `src/task/proposal-document-packs-core.ts` and
  `src/task/proposal-document-packs-operations.ts`.
- Keep `src/task/proposal-coverage-data.ts` as the stable aggregate export for
  existing callers.
- Update task classification tests to import the split catalog modules
  directly.

## Acceptance Criteria

- Proposal document coverage behavior remains unchanged.
- `bun run vitest run tests\task-classify.test.ts` passes.
- `bun run typecheck`, `bun run lint`, DB rebuild, and doctor pass.
