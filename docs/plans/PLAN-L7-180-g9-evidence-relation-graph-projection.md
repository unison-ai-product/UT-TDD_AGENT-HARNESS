---
plan_id: PLAN-L7-180-g9-evidence-relation-graph-projection
title: "PLAN-L7-180: G9 evidence relation graph projection"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/plans/PLAN-L7-179-g9-system-workflow.md
backprop_decision: not_required
backprop_decision_reason: "This fixes relation graph projection coverage for already-tracked evidence artifacts. No requirement or lower-layer contract changes."
agent_slots:
  - role: tl
    slot_label: "TL - relation graph projection feedback"
  - role: qa
    slot_label: "QA - missing-projection regression"
  - role: aim
    slot_label: "AIM - graph evidence projection registration"
generates:
  - artifact_path: docs/plans/PLAN-L7-180-g9-evidence-relation-graph-projection.md
    artifact_type: markdown_doc
  - artifact_path: src/graph/loader.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph-loader.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-179-g9-system-workflow.md
  requires:
    - docs/plans/PLAN-L7-179-g9-system-workflow.md
    - src/graph/loader.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T13:05:00+09:00"
    tests_green_at: "2026-06-29T13:05:00+09:00"
    verdict: approve
    scope: "Relation graph loader projection for G9 evidence JSON paths after DB feedback missing-projection gate."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph-loader.test.ts tests\\relation-graph.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T13:05:00+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:9ace7173778d9bff145f35de04c7497f30afe8f20b61742cfc9fe263aa967985"
---

# PLAN-L7-180: G9 evidence relation graph projection

## Objective

Close the DB feedback gate:

`missing-projection: changed-path-.ut-tdd-evidence-g9-system has no relation-graph node`

The G9 system evidence manifest is a tracked artifact and must be visible to the relation graph so change impact can be analyzed without falling back silently.

## Scope

- Change the relation graph source-set loader from G8-only evidence scanning to `.ut-tdd/evidence/**/*.json`.
- Add fixture coverage for both G8 and G9 evidence paths.
- Add real-repo regression coverage for `.ut-tdd/evidence/g9-system/20260629-st-system-minimum.json`.

## Acceptance

- `analyzeRelationImpact` on the G9 evidence manifest returns `ok=true`.
- No `missing-projection` finding is produced for G9 evidence paths.
- `doctor` feedback no longer reports the G9 evidence missing-projection gate.
