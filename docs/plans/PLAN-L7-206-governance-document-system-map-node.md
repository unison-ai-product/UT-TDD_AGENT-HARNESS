---
plan_id: PLAN-L7-206-governance-document-system-map-node
title: "PLAN-L7-206: relation graph node coverage for document-system-map"
kind: troubleshoot
layer: L7
drive: db
status: confirmed
created: 2026-06-30
updated: 2026-06-30
owner: Codex
parent_design: docs/plans/PLAN-L7-142-relation-graph-requirement-nodes.md
backprop_decision: not_required
backprop_decision_reason: "DB feedback exposed a loader projection coverage gap for docs/governance/document-system-map.md. The fix extends the existing governance-doc relation graph node allowlist; no public CLI/API, persisted schema, or workflow semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - governance document relation graph coverage"
  - role: tl
    slot_label: "TL - DB feedback gate verification"
  - role: aim
    slot_label: "AIM - troubleshoot classification and closure"
generates:
  - artifact_path: docs/plans/PLAN-L7-206-governance-document-system-map-node.md
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
    reviewed_at: "2026-06-30T14:07:00+09:00"
    tests_green_at: "2026-06-30T14:06:54+09:00"
    verdict: approve
    scope: "Relation graph loader now materializes docs/governance/document-system-map.md as a design-like node so DB feedback missing-projection gates are not silently bypassed."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph-loader.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T14:06:54+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:059140121829947cc7b3c0e1940d21979c5277249e7e4b94c6d5a87de3da111b"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T14:06:53+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:055b93545785609a87658ed82d16a4c8ccc23efe860c3796369dea983f98e76d"
---

# PLAN-L7-206: relation graph node coverage for document-system-map

## Objective

Resolve the DB feedback gate:

`missing-projection: changed-path-docs-governance-document-system-map.md-has-no-relation-graph-node-impact-cannot-be-analyzed-no-silent-change-impact-fallback`

The detector is correct. A changed governance document must have a relation graph node so graph impact can fail closed instead of falling back to weaker change-set heuristics.

## Scope

- Add `docs/governance/document-system-map.md` to the relation graph loader's governance document node allowlist.
- Keep the existing relation graph schema and impact expansion semantics unchanged.
- Add a real-repo regression assertion that `analyzeRelationImpact` maps the changed path to `design:docs/governance/document-system-map.md` and does not emit `missing-projection`.

## Verification

- `bun run vitest run tests\relation-graph-loader.test.ts --reporter=dot` passes.
- `bun run typecheck` passes.
- `bun run lint` passes.
- `bun src\cli.ts db rebuild` passes and rebuilds the projection.
- `bun src\cli.ts doctor --strict-telemetry-provenance` passes, including `green-command-digest — OK`.
