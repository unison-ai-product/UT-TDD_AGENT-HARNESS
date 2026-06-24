---
plan_id: PLAN-L7-127-orchestration-degradation-record
title: "PLAN-L7-127: orchestration degradation record"
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
    slot_label: "TL - orchestration degradation record"
generates:
  - artifact_path: docs/plans/PLAN-L7-127-orchestration-degradation-record.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-127-orchestration-degradation-record.md
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
  parent: docs/plans/PLAN-L7-122-vmodel-injection-show.md
  requires:
    - docs/plans/PLAN-L7-122-vmodel-injection-show.md
    - docs/plans/PLAN-REVERSE-127-orchestration-degradation-record.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T17:35:00+09:00"
    tests_green_at: "2026-06-23T17:35:00+09:00"
    verdict: approve
    scope: "V-model injection records execution-mode degradation for hybrid-only orchestration modes."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\vmodel-injection.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T17:35:00+09:00"
        evidence_path: tests/vmodel-injection.test.ts
        output_digest: "sha256:2f96c00b1a8110ee1717e291a594c68faa1eb0a9d6fe711ee5b157b3b88ff920"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T17:35:00+09:00"
        evidence_path: tsconfig.json
        output_digest: "sha256:290e679c492d7c229373061b313ab332394da783b08c9eff85bbb81275f96afc"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T17:35:00+09:00"
        evidence_path: src/vmodel/injection.ts
        output_digest: "sha256:09dfbf69280399fc50b720af5b68e4ee8b22e3d28d484997df818edcfceb9a10"
---

# PLAN-L7-127: orchestration degradation record

## Objective

Record explicit degradation when an injected `orchestration_mode` requires a
runtime that is unavailable in the current execution mode.

## Scope

- Add execution-mode-aware degradation to V-model injection.
- Expose `degraded_from`, `degraded_to`, and `degradation_reason`.
- Add `--mode <mode>` to `ut-tdd vmodel show ... --injection` for deterministic
  testing and local inspection.
- Back-fill requirements and L4 function design.

## Acceptance Criteria

- `agent/L7` in `claude-only` records degradation from
  `claude_judge_codex_impl` to `claude_design_impl`.
- `agent/L7` in `hybrid` records no degradation.
- The CLI JSON output includes degradation fields when degradation applies.
