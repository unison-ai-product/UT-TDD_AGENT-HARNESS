---
plan_id: PLAN-L7-135-dynamic-skill-injection-materialization
title: "PLAN-L7-135: Dynamic skill injection materialization"
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
    slot_label: "TL - dynamic skill injection materialization"
generates:
  - artifact_path: docs/plans/PLAN-L7-135-dynamic-skill-injection-materialization.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-135-dynamic-skill-injection-materialization.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
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
  - artifact_path: tests/skill-recommend.test.ts
    artifact_type: test_code
  - artifact_path: tests/runtime-adapter.test.ts
    artifact_type: test_code
  - artifact_path: tests/team-run.test.ts
    artifact_type: test_code
  - artifact_path: tests/tier-router.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-134-tdd-drive-fit-classification.md
  requires:
    - docs/plans/PLAN-L7-134-tdd-drive-fit-classification.md
    - docs/plans/PLAN-REVERSE-135-dynamic-skill-injection-materialization.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T18:42:32+09:00"
    tests_green_at: "2026-06-23T18:42:32+09:00"
    verdict: approve
    scope: "Skill recommendation manifest is materialized into Claude/Codex adapter stdin and team-run adapters."
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
        output_digest: "sha256:a6a91e6d525acfd91ad51f61c7cde4a2cf1a53171109548a9e8ff1e37a0e86b8"
      - kind: unit_test
        command: "bun run vitest run tests\\skill-recommend.test.ts tests\\runtime-adapter.test.ts tests\\team-run.test.ts tests\\tier-router.test.ts tests\\doctor.test.ts tests\\cli-surface.test.ts -t \"routeToAdapterPlan|codex-wrapper-parity|skill|inject|shared Claude/Codex launch plan|provider-neutral|stdin|task route\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T18:42:32+09:00"
        evidence_path: tests/runtime-adapter.test.ts
        output_digest: "sha256:77a73cf0120efafc8679fc7a8ed57e7b0f7d0e357ed41abba5ce0c2771a0c077"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T18:42:32+09:00"
        evidence_path: src/runtime/adapter.ts
        output_digest: "sha256:b4edbc7c304d747d8e816a4cee85f0a744334f91668a64034d067ccc5814e65a"
      - kind: lint
        command: "bunx biome check src\\runtime\\adapter.ts src\\team\\run.ts src\\task\\tier-router.ts src\\doctor\\index.ts src\\cli.ts src\\skills\\recommend.ts tests\\runtime-adapter.test.ts tests\\team-run.test.ts tests\\tier-router.test.ts tests\\doctor.test.ts tests\\skill-recommend.test.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T18:42:32+09:00"
        evidence_path: src/skills/recommend.ts
        output_digest: "sha256:ca03d4be0354e7c497cd1eeb90c8c9ad9abdcdd734ba173b7912f45f8263f553"
---

# PLAN-L7-135: Dynamic skill injection materialization

## Objective

Close the dynamic skill injection gap: recommendation rows and `skill suggest`
output must become actual provider context for Claude and Codex, not a report
that agents have to remember manually.

## Scope

- Add a path-only `SkillInjectionSet` manifest built from skill recommendations.
- Add `ut-tdd skill suggest --inject --json` for provider-neutral consumers.
- Pass `contextInjection` into `buildAdapterPlan` and append scoped skill paths
  to provider stdin.
- Wire `ut-tdd codex|claude --plan` and `ut-tdd team run --plan` to resolve the
  same injection from the rebuilt harness DB projection.
- Wire `task route --plan ... --execute` through `routeToAdapterPlan` so
  difficulty/cost-tier routing and dynamic skill injection meet in the same
  adapter plan.

## Acceptance Criteria

- Manifest contains skill paths/reasons only and does not copy skill bodies.
- Claude and Codex adapters receive the same injection format.
- Prompt text and skill paths stay in stdin; argv remains fixed command flags.
- Team-run applies the same injection to every runtime member adapter.
