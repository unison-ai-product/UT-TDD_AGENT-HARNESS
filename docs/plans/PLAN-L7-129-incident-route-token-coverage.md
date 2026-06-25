---
plan_id: PLAN-L7-129-incident-route-token-coverage
title: "PLAN-L7-129: route token coverage"
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
    slot_label: "TL - route token coverage"
generates:
  - artifact_path: docs/plans/PLAN-L7-129-incident-route-token-coverage.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-129-incident-route-token-coverage.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: src/workflow/contracts.ts
    artifact_type: source_module
  - artifact_path: tests/workflow-contracts.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-123-route-eval-recommended-command.md
  requires:
    - docs/plans/PLAN-L7-123-route-eval-recommended-command.md
    - docs/plans/PLAN-REVERSE-129-incident-route-token-coverage.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T15:45:00+09:00"
    tests_green_at: "2026-06-23T15:45:00+09:00"
    verdict: approve
    scope: "Route eval covers missing requirements 7.8.1 tokens and removes stale helper routing."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T15:45:00+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:2a08f62b3f8de0104c840e9941a3c33fc6b4c26e66e0ba47070f6398d93d6590"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T15:45:00+09:00"
        evidence_path: tsconfig.json
        output_digest: "sha256:290e679c492d7c229373061b313ab332394da783b08c9eff85bbb81275f96afc"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T15:45:00+09:00"
        evidence_path: src/workflow/contracts.ts
        output_digest: "sha256:fff49252866a549ac96498c868bc193410867829a119f1a93d9d52e36551e791"
---

# PLAN-L7-129: route token coverage

## Objective

Make the implemented route map cover missing signal tokens declared in
requirements 7.8.1 and keep helper routing on the same rule path.

## Scope

- Add `production_incident`, `hotfix_required`, and `regression_prod` to the
  incident route token set.
- Add `drift` to the reverse route token set.
- Route lightweight interrupt tokens `new_requirement` and `po_change` to
  add-feature.
- Make `routeSignalToMode` derive from the same route map and longest-token
  priority as `evaluateRouteCommand`.
- Keep incident routes human-approval-gated through the existing approval
  resolver.
- Add regression coverage so declared tokens resolve to their expected modes.
- Back-fill requirements acceptance evidence and L4 function design.

## Acceptance Criteria

- `production_incident`, `hotfix_required`, and `regression_prod` route to
  `incident`.
- `drift` routes to `reverse`.
- `new_requirement` routes to `add-feature`.
- `routeSignalToMode` and `evaluateRouteCommand` agree on covered tokens.
- Incident routes return `requires_human_approval=true`.
- Incident routes without approval policy exit 1.
