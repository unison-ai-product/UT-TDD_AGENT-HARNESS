---
plan_id: PLAN-L7-182-readme-relation-graph-projection
title: "PLAN-L7-182: README relation graph projection"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/plans/PLAN-L7-180-g9-evidence-relation-graph-projection.md
backprop_decision: not_required
backprop_decision_reason: "This fixes relation graph projection coverage for an already tracked root canonical document. No requirement or lower-layer design contract changes."
agent_slots:
  - role: tl
    slot_label: "TL - README missing-projection feedback"
  - role: qa
    slot_label: "QA - relation graph regression"
  - role: aim
    slot_label: "AIM - root canonical doc projection"
generates:
  - artifact_path: docs/plans/PLAN-L7-182-readme-relation-graph-projection.md
    artifact_type: markdown_doc
  - artifact_path: src/graph/loader.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph-loader.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-180-g9-evidence-relation-graph-projection.md
  requires:
    - src/graph/loader.ts
    - tests/relation-graph-loader.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T13:37:00+09:00"
    tests_green_at: "2026-06-29T13:36:00+09:00"
    verdict: approve
    scope: "Materialize README.md as a root canonical relation graph node so README changes do not produce missing-projection feedback."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph-loader.test.ts tests\\relation-graph.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T13:36:00+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:2cd13824089171ce59ccceae767e6b6196a46f1cca15452f222829ed2ef53533"
---

# PLAN-L7-182: README relation graph projection

## Objective

Close the DB feedback gate:

`missing-projection: changed-path-README.md has no relation-graph node`

`README.md` is a tracked root canonical document and should be visible to change-impact analysis without a silent fallback.

## Scope

- Add `README.md` to the relation graph loader as a root canonical design-like node when present.
- Add fixture and real-repo regression coverage for README impact analysis.
- Preserve existing README content and do not modify user-authored README text.

## Acceptance

- `analyzeRelationImpact` on `README.md` returns `ok=true`.
- No `missing-projection` finding is produced for README changes.
- `doctor` feedback no longer reports the README missing-projection gate.
