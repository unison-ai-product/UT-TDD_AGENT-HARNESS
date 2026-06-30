---
plan_id: PLAN-L7-170-g8-evidence-graph-node
title: "PLAN-L7-170: G8 evidence graph node coverage"
kind: troubleshoot
layer: L7
drive: db
status: confirmed
created: 2026-06-26
updated: 2026-06-26
owner: Codex
parent_design: docs/plans/PLAN-L7-32-cross-artifact-relation-graph.md
backprop_decision: not_required
backprop_decision_reason: "DB feedback exposed a relation graph projection coverage gap for G8 integration evidence manifests. The fix extends loader coverage only; no public CLI/API, persisted schema, or L8 workflow semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - G8 evidence relation graph coverage"
  - role: tl
    slot_label: "TL - DB feedback gate verification"
  - role: aim
    slot_label: "AIM - L8 evidence impact regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-170-g8-evidence-graph-node.md
    artifact_type: markdown_doc
  - artifact_path: src/graph/loader.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph-loader.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-165-review-artifact-graph-node.md
  requires:
    - docs/plans/PLAN-L7-32-cross-artifact-relation-graph.md
    - docs/plans/PLAN-L7-169-g8-integration-evidence-manifest.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-26T21:05:00+09:00"
    tests_green_at: "2026-06-26T21:05:00+09:00"
    verdict: approve
    scope: "Materialize .ut-tdd/evidence/g8-integration/*.json artifacts as relation graph nodes so G8 evidence changes remain analyzable by change-impact."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph-loader.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T21:05:00+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:059140121829947cc7b3c0e1940d21979c5277249e7e4b94c6d5a87de3da111b"
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph-loader.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T21:05:00+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:055b93545785609a87658ed82d16a4c8ccc23efe860c3796369dea983f98e76d"
---

# PLAN-L7-170: G8 evidence graph node coverage

## Objective

Resolve the DB feedback gate:

`missing-projection: changed-path-.ut-tdd-evidence-g8-integration-has-no-relation-graph-node-impact-cannot-be-analyzed-no-silent-change-impact-fallback`

## Scope

- Add `.ut-tdd/evidence/g8-integration/*.json` files to the relation graph
  loader as design-like evidence nodes.
- Preserve relation graph schema, edge kinds, and impact expansion semantics.
- Add fixture and real-repo regression checks for the current G8 integration
  evidence manifest.

## Acceptance Criteria

- `loadRelationGraphSourceSet` returns a node source for G8 evidence manifests.
- `analyzeRelationImpact` succeeds for a G8 evidence manifest change.
- `bun run vitest run tests\relation-graph-loader.test.ts` passes.
- `bun run src\cli.ts db rebuild` clears the open DB feedback gate.
- `bun run src\cli.ts doctor` passes.
