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
      - kind: lint
        command: "bunx biome check src\\runtime\\adapter.ts src\\team\\run.ts src\\task\\tier-router.ts src\\doctor\\index.ts src\\cli.ts src\\skills\\recommend.ts tests\\runtime-adapter.test.ts tests\\team-run.test.ts tests\\tier-router.test.ts tests\\doctor.test.ts tests\\skill-recommend.test.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T18:42:32+09:00"
        evidence_path: src/skills/recommend.ts
        output_digest: "sha256:d8e9694551877c339a13b30e725366febb8ed15edf21308b56a8caf11a21c0bc"
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
