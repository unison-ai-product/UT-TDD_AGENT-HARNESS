---
plan_id: PLAN-L7-128-route-escalation-boundary-gate
title: "PLAN-L7-128: route escalation boundary gate"
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
    slot_label: "TL - route escalation boundary gate"
generates:
  - artifact_path: docs/plans/PLAN-L7-128-route-escalation-boundary-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-128-route-escalation-boundary-gate.md
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
  parent: docs/plans/PLAN-L7-124-route-approval-gate.md
  requires:
    - docs/plans/PLAN-L7-124-route-approval-gate.md
    - docs/plans/PLAN-REVERSE-128-route-escalation-boundary-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T15:20:00+09:00"
    tests_green_at: "2026-06-23T15:20:00+09:00"
    verdict: approve
    scope: "Route eval detects escalation boundaries and requires human approval regardless of execution mode."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T15:20:00+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:2a08f62b3f8de0104c840e9941a3c33fc6b4c26e66e0ba47070f6398d93d6590"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T15:20:00+09:00"
        evidence_path: tsconfig.json
        output_digest: "sha256:290e679c492d7c229373061b313ab332394da783b08c9eff85bbb81275f96afc"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T15:20:00+09:00"
        evidence_path: src/workflow/contracts.ts
        output_digest: "sha256:fff49252866a549ac96498c868bc193410867829a119f1a93d9d52e36551e791"
---

# PLAN-L7-128: route escalation boundary gate

## Objective

Make escalation-sensitive route signals fail closed until human approval is
resolved, independent of the selected execution mode.

## Scope

- Detect escalation boundary terms in `ut-tdd route eval` signals.
- Emit `escalation_boundaries[]` in the route evaluation result.
- Promote the recommended command safety contract to
  `requires_human_approval=true` when escalation is detected.
- Allow approval through either the concrete route mode or the mode wildcard
  `mode: "*", condition: "escalation"`.
- Back-fill requirements and L4 function design.

## Acceptance Criteria

- A normal add-feature route that mentions payment exits 1 without approval.
- The same route exits 0 when an escalation approval rule and approval exist.
- The route result includes the detected escalation boundary term.
- Requirements and L4 design both record the mode-invariant escalation gate.
