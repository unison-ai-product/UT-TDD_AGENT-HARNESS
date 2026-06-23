---
plan_id: PLAN-L7-134-tdd-drive-fit-classification
title: "PLAN-L7-134: TDD drive fit classification"
kind: add-impl
layer: L7
drive: agent
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
agent_slots:
  - role: tl
    slot_label: "TL - TDD drive fit classification"
generates:
  - artifact_path: docs/plans/PLAN-L7-134-tdd-drive-fit-classification.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-134-tdd-drive-fit-classification.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/modes/README.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L3-functional/functional-requirements.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: src/workflow/contracts.ts
    artifact_type: source_module
  - artifact_path: tests/workflow-contracts.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-133-refactor-brush-up-workflow.md
  requires:
    - docs/plans/PLAN-L7-133-refactor-brush-up-workflow.md
    - docs/plans/PLAN-REVERSE-134-tdd-drive-fit-classification.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T18:11:57+09:00"
    tests_green_at: "2026-06-23T18:11:57+09:00"
    verdict: approve
    scope: "Classifies drive models and design specialties by TDD fit and DB firing sources."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts -t \"implements routing\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T18:11:57+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:059ef9f190b9f9d3ebb788f34a5ce67ff43dd58749c66422a73bfe3d178eb49b"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T18:11:57+09:00"
        evidence_path: src/workflow/contracts.ts
        output_digest: "sha256:c255c2d521dc672b954d41c1c03fc55e57a8adcb6d8195e00526ba5929ad4d40"
---

# PLAN-L7-134: TDD drive fit classification

## Objective

Extend the Refactor brush-up work into a cross-drive TDD-style classification:
which drive models fit Red/Yellow/Green loops, which are partial/weak, and what
DB projection rows can fire the Red state.

## Scope

- Add `classifyDriveTddFits` as the machine-readable contract.
- Record strong/partial/weak TDD fit for drive models and design specialties.
- Add DB firing sources: findings, quality signals, feedback events, relation
  graph nodes/edges, impact results, and artifact progress.
- Back-propagate the rule to requirements, L3, L4, L6, and process mode docs.

## Acceptance Criteria

- Strong targets include design, add-feature, refactor, reverse, retrofit,
  recovery, incident, screen-design, and frontend-design.
- Discovery/Scrum are partial, Research is weak.
- DB firing sources create PLAN input/workflow signals only and do not rewrite
  authored docs/source directly.
- Targeted workflow contract test passes.
