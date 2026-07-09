---
plan_id: PLAN-L7-192-db-telemetry-provenance-enforcement
title: "PLAN-L7-192: DB telemetry provenance enforcement switch"
kind: impl
layer: L7
drive: db
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - telemetry provenance enforcement switch"
  - role: tl
    slot_label: "TL - projection versus runtime evidence review"
generates:
  - artifact_path: docs/plans/PLAN-L7-192-db-telemetry-provenance-enforcement.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/db-projection-ingestion.ts
    artifact_type: source_module
  - artifact_path: tests/db-projection-ingestion.test.ts
    artifact_type: test_code
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-110-takeover-feedback-surface.md
  requires:
    - docs/plans/PLAN-L7-110-takeover-feedback-surface.md
  references:
    - docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T19:46:29+09:00"
    tests_green_at: "2026-06-29T19:46:29+09:00"
    verdict: approve
    scope: "Add provenance-enforced DB projection ingestion mode so projection-only telemetry can fail-close for fired/used/works claims while default doctor continues to expose current runtime-capture gap as partial."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\review-evidence.test.ts tests\\db-projection-ingestion.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T19:46:29+09:00"
        evidence_path: tests/db-projection-ingestion.test.ts
        output_digest: "sha256:53507c4d465d3fde47369dbcb3051da02dd7f0df502924239086634b07ff5fef"
        anchor_commit: 9321d946ea91b3180823a20efab6869e75abeb8d
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-29T19:46:29+09:00"
        evidence_path: src/lint/db-projection-ingestion.ts
        output_digest: "sha256:2c399eef3a217df89caaf12c429fd27171e2385d0e079ba19be3334f2473a1ac"
        anchor_commit: 9321d946ea91b3180823a20efab6869e75abeb8d
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-29T19:46:29+09:00"
        evidence_path: src/lint/db-projection-ingestion.ts
        output_digest: "sha256:2c399eef3a217df89caaf12c429fd27171e2385d0e079ba19be3334f2473a1ac"
        anchor_commit: 9321d946ea91b3180823a20efab6869e75abeb8d
---

# PLAN-L7-192: DB telemetry provenance enforcement switch

## Objective

Close the checker-contract part of the telemetry provenance gap identified in
PLAN-L7-188: populated telemetry tables must not be usable as evidence for
"fired", "used", "executed", or "works" claims when all rows are deterministic
projection and none have runtime provenance.

## Scope

- Add an enforcement switch to `analyzeDbProjectionIngestion`.
- Keep default doctor behavior migration-compatible: current runtime capture
  gaps remain visible as `db-telemetry-provenance - partial`.
- Record the physical-data invariant and the L7 unit oracle.
- Do not claim full PLAN-L7-188 close; runtime capture and rebuild-time
  ingestion remain future work.

## Acceptance Criteria

- Projection-only telemetry tables fail closed when
  `enforceTelemetryProvenance` is enabled.
- Default doctor still reports the current gap as partial rather than hiding it.
- `green-command-digest`, review-evidence lint, typecheck, lint, and doctor are
  green for this slice.
