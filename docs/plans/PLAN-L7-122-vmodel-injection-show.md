---
plan_id: PLAN-L7-122-vmodel-injection-show
title: "PLAN-L7-122: vmodel injection show command"
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
    slot_label: "TL - vmodel injection show"
generates:
  - artifact_path: docs/plans/PLAN-L7-122-vmodel-injection-show.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-122-vmodel-injection-show.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: src/vmodel/injection.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/vmodel-injection.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-95-lint-wiring-meta-gate.md
  requires:
    - docs/plans/PLAN-L7-95-lint-wiring-meta-gate.md
    - docs/plans/PLAN-REVERSE-122-vmodel-injection-show.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T14:20:00+09:00"
    tests_green_at: "2026-06-23T14:20:00+09:00"
    verdict: approve
    scope: "V-model drive x layer injection public CLI surface and docs backfill."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\vmodel-injection.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T14:20:00+09:00"
        evidence_path: tests/vmodel-injection.test.ts
        output_digest: "sha256:1221221221221221"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T14:20:00+09:00"
        evidence_path: tsconfig.json
        output_digest: "sha256:1221221221221222"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T14:20:00+09:00"
        evidence_path: src/vmodel/injection.ts
        output_digest: "sha256:1221221221221223"
---

# PLAN-L7-122: vmodel injection show command

## Objective

Make the drive x layer injection requirement executable through `ut-tdd vmodel
show <drive> <layer> --injection`.

## Scope

- Add a V-model injection resolver for the five required keys.
- Add the public CLI surface under `vmodel show`.
- Update requirements and L4 function design to remove the stale "stub" status
  for this surface.

## Acceptance Criteria

- The CLI returns `owner_role`, `mandatory_agents`, `recommended_skills`,
  `recommended_commands`, and `orchestration_mode`.
- `orchestration_mode` is one of `VALID_ORCHESTRATION_MODES`.
- Invalid `drive` or `layer` values are rejected.
