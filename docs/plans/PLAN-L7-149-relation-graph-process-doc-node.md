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
    reviewed_at: "2026-06-30T22:02:00+09:00"
    tests_green_at: "2026-06-30T22:01:00+09:00"
    verdict: approve
    scope: "Relation graph loader now materializes docs/process/** and repo-local hook/config roots (`.codex/hooks.json`, `.codex/config.toml`, `.claude/settings.json`) as design-like nodes so DB feedback missing-projection gates are not silently bypassed."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph-loader.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T22:28:36+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:a908543ff9311bf2418ba5df9d4eca41522aae4ac24a67e5bf935ffbd4dab907"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T22:01:00+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:b94ec857486716eaf5037aeaed684a88b660e7d624dc71f67fadc411e1b65f77"
---

# PLAN-L7-149: relation graph process document node coverage

## Objective

Resolve the DB feedback gate family:

`missing-projection: changed-path-docs-process-modes-refactor.md-has-no-relation-graph-node-impact-cannot-be-analyzed-no-silent-change-impact-fallback`

2026-06-29 follow-up: the same gate shape recurred for
`.codex/hooks.json` after Codex hook parity work. The root cause was identical:
the relation graph loader projected adapter templates but not repo-local
hook/config roots.

## Scope

- Add `docs/process/**` Markdown files to the relation graph loader as
  design-like nodes.
- Add repo-local `.claude/settings.json`, `.codex/config.toml`, and
  `.codex/hooks.json` to the relation graph loader as design-like config nodes.
- Keep the existing relation graph schema unchanged.
- Add a regression fixture proving `docs/process/modes/refactor.md` has a graph
  node and `analyzeRelationImpact` does not emit `missing-projection`.
- Add fixture and real-repo regression coverage proving `.codex/hooks.json` has
  a graph node and `analyzeRelationImpact` does not emit `missing-projection`.

## Acceptance Criteria

- `loadRelationGraphSourceSet` returns a node source for
  `docs/process/modes/refactor.md`.
- `loadRelationGraphSourceSet` returns a node source for `.codex/hooks.json`.
- `analyzeRelationImpact` succeeds for a process mode document change.
- `analyzeRelationImpact` succeeds for a repo-local Codex hook change.
- `bun run vitest run tests\relation-graph-loader.test.ts` passes.
- `bun run src\cli.ts db rebuild` clears the open DB feedback gate.
- `bun run src\cli.ts doctor` passes.
