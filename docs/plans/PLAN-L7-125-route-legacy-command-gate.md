---
plan_id: PLAN-L7-125-route-legacy-command-gate
title: "PLAN-L7-125: route legacy command gate"
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
    slot_label: "TL - route legacy command gate"
generates:
  - artifact_path: docs/plans/PLAN-L7-125-route-legacy-command-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-125-route-legacy-command-gate.md
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
    - docs/plans/PLAN-REVERSE-125-route-legacy-command-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T16:40:00+09:00"
    tests_green_at: "2026-06-23T16:40:00+09:00"
    verdict: approve
    scope: "Route-map command output fails closed when a legacy runtime command name is configured."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T16:40:00+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:2a08f62b3f8de0104c840e9941a3c33fc6b4c26e66e0ba47070f6398d93d6590"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T16:40:00+09:00"
        evidence_path: tsconfig.json
        output_digest: "sha256:290e679c492d7c229373061b313ab332394da783b08c9eff85bbb81275f96afc"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T16:40:00+09:00"
        evidence_path: src/workflow/contracts.ts
        output_digest: "sha256:fff49252866a549ac96498c868bc193410867829a119f1a93d9d52e36551e791"
---

# PLAN-L7-125: route legacy command gate

## Objective

Prevent `ut-tdd route eval` from emitting a runnable command when route-map
configuration contains a legacy runtime command name.

## Scope

- Validate route-map command outputs with `RecommendedCommandV1`.
- Return exit 1 and a `legacy-runtime-command` finding when the command does not
  start with `ut-tdd`.
- Add `--route-map <path>` as an explicit override surface for deterministic
  route-map validation.
- Back-fill requirements and L4 function design.

## Acceptance Criteria

- A route-map entry such as `command: helix reverse` returns exit 1.
- The result does not include `recommended_command`.
- Existing built-in routes still return schema-valid `ut-tdd` commands.
