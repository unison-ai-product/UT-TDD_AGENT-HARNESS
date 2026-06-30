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
        output_digest: "sha256:94e9e868a81ec6845e784a60f06528db0e5bd9f252824801d28b6a4d3cd67fbb"
      - kind: unit_test
        command: "bun run vitest run tests\\skill-recommend.test.ts tests\\runtime-adapter.test.ts tests\\team-run.test.ts tests\\tier-router.test.ts tests\\doctor.test.ts tests\\cli-surface.test.ts -t \"routeToAdapterPlan|codex-wrapper-parity|skill|inject|shared Claude/Codex launch plan|provider-neutral|stdin|task route\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T18:42:32+09:00"
        evidence_path: tests/runtime-adapter.test.ts
        output_digest: "sha256:ed8855117f7827e1da70ef4677cd539833169b02e858e56dc96cd922378f62d9"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T18:42:32+09:00"
        evidence_path: src/runtime/adapter.ts
        output_digest: "sha256:91e14872daecee813cb26ca822f18b72fd1f4c41534cbdcfd493557a916e2454"
      - kind: lint
        command: "bunx biome check src\\runtime\\adapter.ts src\\team\\run.ts src\\task\\tier-router.ts src\\doctor\\index.ts src\\cli.ts src\\skills\\recommend.ts tests\\runtime-adapter.test.ts tests\\team-run.test.ts tests\\tier-router.test.ts tests\\doctor.test.ts tests\\skill-recommend.test.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T18:42:32+09:00"
        evidence_path: src/skills/recommend.ts
        output_digest: "sha256:bc70b172a9dfd750ae950eb5fb573479a8cc9932e422ae915d46662d96d5e961"
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
