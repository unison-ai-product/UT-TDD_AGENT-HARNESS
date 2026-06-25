---
plan_id: PLAN-REVERSE-117-kind-layer-governance-gate
title: "PLAN-REVERSE-117: kind layer governance gate"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: db
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
forward_routing: L3
promotion_strategy: reuse-with-hardening
backprop_scope:
  - layer: requirements
    decision: updated
    evidence_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    reason: "Requirements define kind/layer compatibility as a plan-governance fail-close rule."
  - layer: L4-basic-design
    decision: not_impacted
    reason: "The gate changes PLAN governance only, not external basic design behavior."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The gate changes PLAN governance only, not detailed runtime design behavior."
agent_slots:
  - role: tl
    slot_label: "TL - kind layer fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-117-kind-layer-governance-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-117-kind-layer-governance-gate.md
  requires:
    - docs/plans/PLAN-L7-117-kind-layer-governance-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T12:45:00+09:00"
    tests_green_at: "2026-06-23T12:45:00+09:00"
    verdict: approve
    scope: "Requirements fullback for kind/layer governance gate."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun test tests\\plan-lint.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T12:45:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:ba64ea807951fdf6b3c3d0891e5525afe5b32e9599129db35e6870da0706826d"
      - kind: lint
        command: "bun run src\\cli.ts plan lint --gate governance"
        runner: bun
        scope: gate
        exit_code: 0
        completed_at: "2026-06-23T12:45:00+09:00"
        evidence_path: src/plan/lint.ts
        output_digest: "sha256:40c960d0d4d0b49ef3aff27e12291b7a5851077e6fdcf7aca1868bdf0d964510"
---

# PLAN-REVERSE-117: kind layer governance gate

## Objective

Back-fill the kind/layer compatibility rule into requirements. The previous
gate verified PLAN token and enum validity but did not prove that authoring kind
matched the layer where the work was filed.

## Scope

- Requirements record the `kind_layer_mismatch` governance violation.
- Design and add-design work are constrained to their authoring layers.
- Implementation, refactor, retrofit, and troubleshoot work are constrained to
  L7.
- Research remains constrained to L1-L4.
- Legacy PLANs before the enforcement date remain non-blocking unless updated.

## Acceptance Criteria

- A new PLAN filed with an incompatible kind/layer pair fails.
- The same PLAN with a compatible kind/layer pair passes.
- Fullback evidence points to the requirements update.
