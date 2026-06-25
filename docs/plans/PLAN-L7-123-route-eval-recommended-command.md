---
plan_id: PLAN-L7-123-route-eval-recommended-command
title: "PLAN-L7-123: route eval RecommendedCommandV1 surface"
kind: add-impl
layer: L7
drive: agent
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
agent_slots:
  - role: tl
    slot_label: "TL - route eval contract surface"
generates:
  - artifact_path: docs/plans/PLAN-L7-123-route-eval-recommended-command.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-123-route-eval-recommended-command.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: src/workflow/contracts.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/workflow-contracts.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-72-task-classify-cli.md
  requires:
    - docs/plans/PLAN-L7-72-task-classify-cli.md
    - docs/plans/PLAN-REVERSE-123-route-eval-recommended-command.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T15:30:00+09:00"
    tests_green_at: "2026-06-23T15:30:00+09:00"
    verdict: approve
    scope: "Signal route evaluation CLI returns a schema-validated RecommendedCommandV1 and backfills requirements/L4 design."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T15:30:00+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:2a08f62b3f8de0104c840e9941a3c33fc6b4c26e66e0ba47070f6398d93d6590"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T15:30:00+09:00"
        evidence_path: tsconfig.json
        output_digest: "sha256:290e679c492d7c229373061b313ab332394da783b08c9eff85bbb81275f96afc"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T15:30:00+09:00"
        evidence_path: src/workflow/contracts.ts
        output_digest: "sha256:fff49252866a549ac96498c868bc193410867829a119f1a93d9d52e36551e791"
---

# PLAN-L7-123: route eval RecommendedCommandV1 surface

## Objective

Make the signal routing requirement executable through `ut-tdd route eval
--signal <s> --format json`.

## Scope

- Add a deterministic route evaluation contract over known routing signals.
- Return a human-facing `suggest_command` separately from the machine-facing
  `recommended_command`.
- Validate the machine-facing command with `RecommendedCommandV1`.
- Back-fill requirements and L4 function design so this implementation is not
  detached from the design baseline.

## Acceptance Criteria

- Known signals return `mode`, `suggest_command`, and a schema-valid
  `recommended_command`.
- `recommended_command.command` starts with `ut-tdd`; legacy runtime command
  names are rejected by the existing schema.
- Unknown signals return explicit not-available routing (`exit_code=2`) without
  a runnable command.
