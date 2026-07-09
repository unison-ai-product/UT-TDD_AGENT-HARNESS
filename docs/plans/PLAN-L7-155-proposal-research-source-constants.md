---
plan_id: PLAN-L7-155-proposal-research-source-constants
title: "PLAN-L7-155: proposal research source constants"
kind: refactor
layer: L7
drive: db
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant literal externalization inside the proposal research catalog. No public CLI/API contract, persisted schema, requirement semantics, or workflow semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - proposal research literal externalization"
  - role: tl
    slot_label: "TL - classification invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-155-proposal-research-source-constants.md
    artifact_type: markdown_doc
  - artifact_path: src/task/proposal-research-data.ts
    artifact_type: source_module
  - artifact_path: tests/task-classify.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-154-proposal-document-pack-split.md
  requires:
    - docs/plans/PLAN-L7-154-proposal-document-pack-split.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T17:34:46+09:00"
    tests_green_at: "2026-06-25T17:34:46+09:00"
    verdict: approve
    scope: "Behavior-invariant source-name constant extraction in proposal research catalog."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\task-classify.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T17:34:20+09:00"
        evidence_path: tests/task-classify.test.ts
        output_digest: "sha256:4354ec1766680c77a56569eb7c6fbfafdff3b568beafed6092c3da2a8375b075"
        anchor_commit: 80dc4c8e4e61b0a8d2c8e6de0e2ccb70a5fa57fe
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T17:34:18+09:00"
        evidence_path: src/task/proposal-research-data.ts
        output_digest: "sha256:c028b8e6d44f65a79159a3741073753bdb1f33774976f2fcee39179e89b1ffbe"
        anchor_commit: 6df9a823a9de546e394f5224c80eb740d73a7993
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T17:34:21+09:00"
        evidence_path: src/task/proposal-research-data.ts
        output_digest: "sha256:c028b8e6d44f65a79159a3741073753bdb1f33774976f2fcee39179e89b1ffbe"
        anchor_commit: 6df9a823a9de546e394f5224c80eb740d73a7993
---

# PLAN-L7-155: proposal research source constants

## Objective

Close the remaining `externalize-literal` candidate in
`src/task/proposal-research-data.ts` by replacing repeated source-name strings
with named constants.

## Scope

- Add named constants for repeated research source names.
- Preserve all research adoption/rejection output values.
- Keep task classification behavior unchanged.

## Acceptance Criteria

- `proposal-research-data.ts` no longer emits an `externalize-literal` candidate.
- `bun run vitest run tests\task-classify.test.ts` passes.
- `bun run typecheck`, `bun run lint`, DB rebuild, and doctor pass.
