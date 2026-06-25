---
plan_id: PLAN-REVERSE-135-dynamic-skill-injection-materialization
title: "PLAN-REVERSE-135: Dynamic skill injection materialization fullback"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: agent
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
forward_routing: L4
promotion_strategy: reuse-with-hardening
backprop_scope:
  - layer: requirements
    decision: updated
    evidence_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    reason: "Requirements now state that --inject and adapter stdin materialization are part of dynamic skill injection closure."
  - layer: L4-basic-design
    decision: updated
    evidence_path: docs/design/harness/L4-basic-design/function.md
    reason: "L4 records provider-neutral skill manifest and Claude/Codex adapter materialization."
  - layer: L5-detailed-design
    decision: not_impacted
    evidence_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    reason: "No module boundary changes; existing skills/runtime/team modules are connected."
  - layer: L6-function-design
    decision: updated
    evidence_path: docs/design/harness/L6-function-design/function-spec.md
    reason: "L6 adds buildSkillInjectionSet and buildAdapterPlan(contextInjection) contracts."
  - layer: implementation
    decision: updated
    evidence_path: src/runtime/adapter.ts
    reason: "Adapter stdin and task-route adapter plans now materialize scoped skill paths for both providers."
agent_slots:
  - role: tl
    slot_label: "TL - dynamic skill injection fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-135-dynamic-skill-injection-materialization.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: src/skills/recommend.ts
    artifact_type: source_module
  - artifact_path: src/runtime/adapter.ts
    artifact_type: source_module
  - artifact_path: src/team/run.ts
    artifact_type: source_module
  - artifact_path: src/task/tier-router.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
dependencies:
  parent: docs/plans/PLAN-L7-135-dynamic-skill-injection-materialization.md
  requires:
    - docs/plans/PLAN-L7-135-dynamic-skill-injection-materialization.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T18:42:32+09:00"
    tests_green_at: "2026-06-23T18:42:32+09:00"
    verdict: approve
    scope: "Reverse fullback for skill injection materialization."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\skill-recommend.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T18:42:32+09:00"
        evidence_path: tests/skill-recommend.test.ts
        output_digest: "sha256:5ff2a93bed92158fd45d452d57bc26f9594b9051bf00947f6f918b4aeb1f4df1"
      - kind: unit_test
        command: "bun run vitest run tests\\skill-recommend.test.ts tests\\runtime-adapter.test.ts tests\\team-run.test.ts tests\\tier-router.test.ts tests\\doctor.test.ts tests\\cli-surface.test.ts -t \"routeToAdapterPlan|codex-wrapper-parity|skill|inject|shared Claude/Codex launch plan|provider-neutral|stdin|task route\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T18:42:32+09:00"
        evidence_path: tests/runtime-adapter.test.ts
        output_digest: "sha256:6b44d631e7c6bcc39784a825d2ac0f4e72a2d0fc9758b420fb915b691244f95a"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T18:42:32+09:00"
        evidence_path: src/runtime/adapter.ts
        output_digest: "sha256:29ce38af802aed290df9ccd3bd38897cf77ced160e84a82518ea6aaa495cc3f2"
---

# PLAN-REVERSE-135: Dynamic skill injection materialization fullback

## Objective

Back-propagate the implementation correction from recommendation-only skill
surfaces to actual Claude/Codex provider context materialization.

## R4 Routing

Forward routing is L4 because the external behavior changes: provider execution
surfaces now receive a scoped skill context manifest through stdin when a PLAN is
attached. L5 module boundaries do not change.

## Acceptance Criteria

- Requirements and L4 define `--inject` plus adapter stdin materialization.
- L6 documents `buildSkillInjectionSet` and `buildAdapterPlan(contextInjection)`.
- Implementation and tests prove the same manifest works for Claude, Codex,
  team-run, and cost-tier task routing.
