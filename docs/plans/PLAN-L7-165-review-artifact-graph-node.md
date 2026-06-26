---
plan_id: PLAN-L7-165-review-artifact-graph-node
title: "PLAN-L7-165: review artifact graph node coverage"
kind: troubleshoot
layer: L7
drive: db
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/plans/PLAN-L7-32-cross-artifact-relation-graph.md
backprop_decision: not_required
backprop_decision_reason: "DB feedback exposed a relation graph projection coverage gap for existing review evidence artifacts. The fix extends loader coverage only; no public CLI/API, persisted schema, or workflow semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - review artifact relation graph coverage"
  - role: tl
    slot_label: "TL - DB feedback gate verification"
  - role: aim
    slot_label: "AIM - troubleshoot classification and closure"
generates:
  - artifact_path: docs/plans/PLAN-L7-165-review-artifact-graph-node.md
    artifact_type: markdown_doc
  - artifact_path: src/graph/loader.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph-loader.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-156-top-level-reference-doc-graph-node.md
  requires:
    - docs/plans/PLAN-L7-32-cross-artifact-relation-graph.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T20:35:00+09:00"
    tests_green_at: "2026-06-25T20:35:00+09:00"
    verdict: approve
    scope: "Materialize .ut-tdd/review/*.md artifacts as relation graph nodes so changed review evidence remains analyzable."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph-loader.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T20:34:43+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:f4bc7a9d39177c0a93e412aad4ff3148f2874469ae8e0f90f87c1d73a8c9bf22"
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph-loader.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T20:34:43+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:538f04f58b4688cfede079cc27c97078765d902efa9e67ba7b91f5c17c577dc3"
---

# PLAN-L7-165: review artifact graph node coverage

## Objective

Resolve the DB feedback gate:

`missing-projection: changed-path-.ut-tdd-review-cross-review-l7-157.md-has-no-relation-graph-node-impact-cannot-be-analyzed-no-silent-change-impact-fallback`

## Scope

- Add `.ut-tdd/review/*.md` files to the relation graph loader as design-like
  review evidence nodes.
- Preserve the existing relation graph schema and impact expansion semantics.
- Add fixture and real-repo regression checks for
  `.ut-tdd/review/cross-review-l7-157.md`.

## Acceptance Criteria

- `loadRelationGraphSourceSet` returns a node source for the review artifact.
- `analyzeRelationImpact` succeeds for a review artifact change.
- `bun run vitest run tests\relation-graph-loader.test.ts` passes.
- `bun run src\cli.ts db rebuild` clears the open DB feedback gate.
- `bun run src\cli.ts doctor` passes.
