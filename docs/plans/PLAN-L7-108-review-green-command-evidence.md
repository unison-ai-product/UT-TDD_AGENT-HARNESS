---
plan_id: PLAN-L7-108-review-green-command-evidence
title: "PLAN-L7-108: Review green command evidence gate"
kind: add-impl
layer: L7
drive: db
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
parent_design: docs/design/harness/L6-function-design/test-before-review.md
agent_slots:
  - role: tl
    slot_label: "TL - review_evidence green command evidence gate"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-108-review-green-command-evidence.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-108-review-green-command-evidence.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/test-before-review.md
    artifact_type: design_doc
  - artifact_path: src/lint/review-evidence.ts
    artifact_type: source_module
  - artifact_path: src/schema/frontmatter.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db.ts
    artifact_type: source_module
  - artifact_path: src/workflow/contracts.ts
    artifact_type: source_module
  - artifact_path: tests/review-evidence.test.ts
    artifact_type: test_code
  - artifact_path: tests/frontmatter.test.ts
    artifact_type: test_code
  - artifact_path: tests/workflow-contracts.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-107-reverse-fullback-scope-gate.md
  requires:
    - docs/plans/PLAN-L7-107-reverse-fullback-scope-gate.md
    - docs/plans/PLAN-REVERSE-108-review-green-command-evidence.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23"
    tests_green_at: "2026-06-23"
    verdict: approve
    scope: "IMP-108 green command evidence gate: review_evidence requires structured command evidence for 2026-06-23+ confirmed/completed entries; schema, lint, design, requirements, and tests updated together."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun test tests\\review-evidence.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23"
        evidence_path: tests/review-evidence.test.ts
        output_digest: "sha256:dfbf0e3feee78280b464dbae6e28bc3b5c0a652e416c6587f14c2d90c95f6af2"
      - kind: unit_test
        command: "bun test tests\\frontmatter.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23"
        evidence_path: tests/frontmatter.test.ts
        output_digest: "sha256:5ef62e98c92039bfc63a5e760a0e7235c768832c7752f18dd6ddb44e9b2be655"
      - kind: unit_test
        command: "bun test tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:2a08f62b3f8de0104c840e9941a3c33fc6b4c26e66e0ba47070f6398d93d6590"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: gate
        exit_code: 0
        completed_at: "2026-06-23"
        evidence_path: src/lint/review-evidence.ts
        output_digest: "sha256:e4709a1807e1532f2b31d9baa54773707355859ae06acd73e7214b434e830d44"
---

# PLAN-L7-108: Review green command evidence gate

## Objective

Close the gap where `review_evidence.tests_green_at` proved only timestamp order,
not which quantitative command set was green. New review evidence updated on or
after 2026-06-23 must carry structured green command evidence.

## Scope

- Extend `review_evidence` parsing with `green_commands[]`.
- Fail confirmed/completed PLANs updated on or after 2026-06-23 when review
  entries omit green command evidence or contain nonzero/invalid command records.
- Add frontmatter schema support for the same structure.
- Add `test_runs.output_digest` and preserve it through the workflow projection contract.
- Back-propagate the rule to requirements and L6 function design.

## Acceptance Criteria

- Legacy 2026-06-22 timestamp-only review evidence remains valid.
- New 2026-06-23 confirmed review evidence without `green_commands[]` fails.
- Structured green command evidence with exit 0 passes.
- Nonzero command exit code fails.
- `frontmatterSchema` accepts the valid shape and rejects nonzero exits.
- `recordTestRunEvidence` persists `output_digest` into `test_runs`.
- `bun test tests\review-evidence.test.ts` passes.
- `bun test tests\frontmatter.test.ts` passes.
- `bun test tests\workflow-contracts.test.ts` passes.
- `bun run typecheck`, `bun run lint`, and `bun run src\cli.ts doctor` pass.
