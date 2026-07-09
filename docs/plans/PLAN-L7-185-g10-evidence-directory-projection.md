---
plan_id: PLAN-L7-185-g10-evidence-directory-projection
title: "PLAN-L7-185: G10 evidence directory projection"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/plans/PLAN-L7-184-g10-ux-workflow.md
backprop_decision: not_required
backprop_decision_reason: "This closes a relation-graph projection gap for already tracked evidence manifests. It does not change product requirements or the V-model pair contract."
dependencies:
  parent: docs/plans/PLAN-L7-184-g10-ux-workflow.md
  requires:
    - src/lint/relation-graph.ts
    - tests/relation-graph.test.ts
    - tests/relation-graph-loader.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T14:30:02+09:00"
    tests_green_at: "2026-06-29T14:28:59+09:00"
    verdict: approve
    scope: "Relation graph directory-path projection for G10 evidence feedback, including pure, fixture, and real-repo regression coverage."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph.test.ts tests\\relation-graph-loader.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T14:28:59+09:00"
        evidence_path: tests/relation-graph.test.ts
        output_digest: "sha256:248104e6101b259da78ff312b9d5cca334a37fbc250cc66c648cccb7de6efa68"
        anchor_commit: c57ad638d370b3431f44a31c5cac5eff250d835e
agent_slots:
  - role: tl
    slot_label: "TL - relation graph directory projection"
  - role: aim
    slot_label: "AIM - feedback gate registry rebuild"
  - role: qa
    slot_label: "QA - G10 feedback regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-185-g10-evidence-directory-projection.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/relation-graph.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph.test.ts
    artifact_type: test_code
  - artifact_path: tests/relation-graph-loader.test.ts
    artifact_type: test_code
---

# PLAN-L7-185: G10 evidence directory projection

## Objective

Close the feedback gate failure where a changed path reported as
`.ut-tdd/evidence/g10-ux` could not be projected even though the relation graph
already contained the child G10 evidence manifest JSON.

## Scope

- Keep exact changed-path projection as the first lookup.
- Expand changed directory paths only when projected child nodes exist under
  that directory.
- Preserve fail-closed `missing-projection` behavior for unknown paths.
- Add pure, fixture, and real-repo regression coverage for the G10 evidence
  directory case.

## Acceptance

- `.ut-tdd/evidence/g10-ux` resolves to the projected G10 evidence JSON node.
- Unknown evidence directories still return `missing-projection`.
- Feedback no longer reports the G10 evidence directory as a missing projection.
