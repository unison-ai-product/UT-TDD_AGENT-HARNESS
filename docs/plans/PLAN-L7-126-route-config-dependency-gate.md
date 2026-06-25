---
plan_id: PLAN-L7-126-route-config-dependency-gate
title: "PLAN-L7-126: route config dependency gate"
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
    slot_label: "TL - route config dependency gate"
generates:
  - artifact_path: docs/plans/PLAN-L7-126-route-config-dependency-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-126-route-config-dependency-gate.md
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
  parent: docs/plans/PLAN-L7-123-route-eval-recommended-command.md
  requires:
    - docs/plans/PLAN-L7-123-route-eval-recommended-command.md
    - docs/plans/PLAN-REVERSE-126-route-config-dependency-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T17:05:00+09:00"
    tests_green_at: "2026-06-23T17:05:00+09:00"
    verdict: approve
    scope: "Route-map configuration fails closed when it contains legacy DB or personal absolute path dependencies."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T17:05:00+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:2a08f62b3f8de0104c840e9941a3c33fc6b4c26e66e0ba47070f6398d93d6590"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T17:05:00+09:00"
        evidence_path: tsconfig.json
        output_digest: "sha256:290e679c492d7c229373061b313ab332394da783b08c9eff85bbb81275f96afc"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T17:05:00+09:00"
        evidence_path: src/workflow/contracts.ts
        output_digest: "sha256:fff49252866a549ac96498c868bc193410867829a119f1a93d9d52e36551e791"
---

# PLAN-L7-126: route config dependency gate

## Objective

Prevent route-map configuration from depending on legacy DB names or personal
absolute paths.

## Scope

- Add route config text validation for `legacy DB` / `legacy_db` and personal
  user-home absolute paths.
- Fail route evaluation before command recommendation when config violations
  exist.
- Keep route state within `.ut-tdd/` YAML/JSON and `.ut-tdd/harness.db`
  projection boundaries.
- Back-fill requirements and L4 function design.

## Acceptance Criteria

- Route config text containing `legacy DB` returns exit 1.
- Route config text containing `C:\Users\<name>` / `/Users/<name>` / `~/`
  returns exit 1.
- The result does not include `recommended_command` when config dependency
  violations exist.
