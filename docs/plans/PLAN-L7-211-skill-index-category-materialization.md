---
plan_id: PLAN-L7-211-skill-index-category-materialization
title: "PLAN-L7-211: Skill index category and scaffolder materialization"
kind: impl
layer: L7
drive: agent
status: confirmed
created: 2026-06-30
updated: 2026-06-30
owner: Codex
parent_design: docs/plans/PLAN-L5-06-skill.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
backprop_decision: not_required
backprop_decision_reason: "This materializes the existing skill-index category model, catalog projection, recommender de-saturation, and scaffold CLI without introducing a new L1 requirement."
agent_slots:
  - role: qa
    slot_label: "QA - skill index/category/scaffolder regression"
  - role: tl
    slot_label: "TL - dogfood adapter parity and distribution boundary review"
generates:
  - artifact_path: docs/plans/PLAN-L7-211-skill-index-category-materialization.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/design/harness/L6-function-design/skill-index.md
    artifact_type: design_doc
  - artifact_path: src/lint/skill-assignment.ts
    artifact_type: source_module
  - artifact_path: src/assets/catalog.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-tables-core.ts
    artifact_type: source_module
  - artifact_path: src/skill-engine/recommend.ts
    artifact_type: source_module
  - artifact_path: src/skill-engine/scaffold.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/runtime/agent-guard-policy.ts
    artifact_type: source_module
  - artifact_path: .claude/CLAUDE.md
    artifact_type: markdown_doc
  - artifact_path: .claude/agents/ut-tdd-tl.md
    artifact_type: markdown_doc
  - artifact_path: .claude/commands/ut-tdd-status.md
    artifact_type: markdown_doc
  - artifact_path: .claude/commands/ut-tdd-test.md
    artifact_type: markdown_doc
  - artifact_path: tests/skill-assignment.test.ts
    artifact_type: test_code
  - artifact_path: tests/skill-recommend.test.ts
    artifact_type: test_code
  - artifact_path: tests/asset-catalog.test.ts
    artifact_type: test_code
  - artifact_path: tests/skill-scaffold.test.ts
    artifact_type: test_code
  - artifact_path: tests/agent-guard.test.ts
    artifact_type: test_code
dependencies:
  requires:
    - docs/plans/PLAN-L5-06-skill.md
    - docs/plans/PLAN-DISCOVERY-03-skill-design.md
    - docs/plans/PLAN-L7-70-skill-pack-curation.md
  references:
    - docs/plans/PLAN-L6-37-skill-index-category.md
    - docs/plans/PLAN-L7-157-distribution-clean-pull.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "Skill category/index implementation, skill new scaffolder, catalog/recommender regressions, and dogfood adapter parity for ut-tdd-tl/status/test."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\skill-assignment.test.ts tests\\skill-recommend.test.ts tests\\asset-catalog.test.ts tests\\skill-scaffold.test.ts tests\\agent-guard.test.ts tests\\setup.test.ts tests\\distribution-acceptance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/skill-scaffold.test.ts
        output_digest: "sha256:c357ebd21caa8f164ea9415f364d13caa032fb25acc2fed9c0a25f0abe35e439"
      - kind: unit_test
        command: "bun run vitest run tests\\skill-assignment.test.ts tests\\skill-recommend.test.ts tests\\asset-catalog.test.ts tests\\skill-scaffold.test.ts tests\\agent-guard.test.ts tests\\setup.test.ts tests\\distribution-acceptance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/asset-catalog.test.ts
        output_digest: "sha256:79fc89eec778b9e6c5d317efc8752cb2eef7e5052df7fe179965415a105bf7b4"
      - kind: unit_test
        command: "bun run vitest run tests\\skill-assignment.test.ts tests\\skill-recommend.test.ts tests\\asset-catalog.test.ts tests\\skill-scaffold.test.ts tests\\agent-guard.test.ts tests\\setup.test.ts tests\\distribution-acceptance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T18:00:00+09:00"
        evidence_path: tests/agent-guard.test.ts
        output_digest: "sha256:d63d4b93fa5ff137ea1dd3b44177af15915c7274fa4d84d2b2b2fc99c0d71f7c"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/skill-engine/scaffold.ts
        output_digest: "sha256:55b7a910e8fa5d3c5251edfc2d18479f0439cfca1162b5b58ccac7825f6d034c"
      - kind: unit_test
        command: "bun run vitest run tests\\skill-assignment.test.ts tests\\skill-recommend.test.ts tests\\asset-catalog.test.ts tests\\skill-scaffold.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: docs/design/harness/L6-function-design/skill-index.md
        output_digest: "sha256:99f20045a262862f3f9756694cbe755819af9334668a6afe0cf2e9b43d10e18f"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:37a71b9f9ad4d5edc8ee77f7b29f3662ba21fde3dbec8316ddebecef77338ab1"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T18:00:00+09:00"
        evidence_path: src/skill-engine/recommend.ts
        output_digest: "sha256:bc70b172a9dfd750ae950eb5fb573479a8cc9932e422ae915d46662d96d5e961"
---

# PLAN-L7-211: Skill index category and scaffolder materialization

## Purpose

Bind the current skill-index implementation work to an L7 owner PLAN so the new
`src/skill-engine/scaffold.ts` module, category-aware skill catalog/recommender
changes, and dogfood adapter parity are not orphaned implementation.

## Scope

- Add `skill new` scaffolding support as a pure generator plus CLI caller.
- Preserve the distribution boundary: workflow/domain skills go under
  `docs/skills/`, while project skills default to consumer-owned `.ut-tdd/skills`.
- Keep category-aware catalog/recommender behavior covered by unit tests.
- Add dogfood `ut-tdd-tl`, `ut-tdd-status`, and `ut-tdd-test` runtime adapter
  files so the local roster mirrors the clean adapter templates.
- Add `ut-tdd-tl` to the enforced subagent allowlist with explicit Sonnet model
  coverage.

## Acceptance

- Targeted skill/catalog/recommender/agent/setup/distribution tests pass.
- `bun run typecheck` passes.
- `bun run lint` passes.
- `ut-tdd doctor` and strict telemetry doctor must remain green after DB rebuild.
