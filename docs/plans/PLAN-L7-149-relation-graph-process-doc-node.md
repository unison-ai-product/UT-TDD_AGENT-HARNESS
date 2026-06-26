---
plan_id: PLAN-L7-149-relation-graph-process-doc-node
title: "PLAN-L7-149: relation graph process document node coverage"
kind: troubleshoot
layer: L7
drive: db
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/plans/PLAN-L7-142-relation-graph-requirement-nodes.md
backprop_decision: not_required
backprop_decision_reason: "DB feedback exposed a loader projection coverage gap for docs/process/**. The fix extends the existing relation graph loader coverage boundary; no public CLI/API contract, persistence schema, or requirements semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - relation graph process document node coverage"
  - role: tl
    slot_label: "TL - DB feedback gate verification"
  - role: aim
    slot_label: "AIM - troubleshoot classification and closure"
generates:
  - artifact_path: docs/plans/PLAN-L7-149-relation-graph-process-doc-node.md
    artifact_type: markdown_doc
  - artifact_path: src/graph/loader.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph-loader.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-142-relation-graph-requirement-nodes.md
  requires:
    - docs/plans/PLAN-L7-142-relation-graph-requirement-nodes.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T15:05:00+09:00"
    tests_green_at: "2026-06-25T15:05:00+09:00"
    verdict: approve
    scope: "Relation graph loader now materializes docs/process/** as design-like nodes so DB feedback missing-projection gates are not silently bypassed."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph-loader.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T15:04:43+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:8b119a0324d46bf51628db846951cb9745c10bcb15f7017cc970e3b66a49af2b"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T15:05:00+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:d4194530fe20b96ef4740ccdf70dbe323771ee2dfc3a4529b9e580e86602cffc"
---

# PLAN-L7-149: relation graph process document node coverage

## Objective

Resolve the DB feedback gate:

`missing-projection: changed-path-docs-process-modes-refactor.md-has-no-relation-graph-node-impact-cannot-be-analyzed-no-silent-change-impact-fallback`

## Scope

- Add `docs/process/**` Markdown files to the relation graph loader as
  design-like nodes.
- Keep the existing relation graph schema unchanged.
- Add a regression fixture proving `docs/process/modes/refactor.md` has a graph
  node and `analyzeRelationImpact` does not emit `missing-projection`.

## Acceptance Criteria

- `loadRelationGraphSourceSet` returns a node source for
  `docs/process/modes/refactor.md`.
- `analyzeRelationImpact` succeeds for a process mode document change.
- `bun run vitest run tests\relation-graph-loader.test.ts` passes.
- `bun run src\cli.ts db rebuild` clears the open DB feedback gate.
- `bun run src\cli.ts doctor` passes.
