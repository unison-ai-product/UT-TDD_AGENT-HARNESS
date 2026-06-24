---
plan_id: PLAN-L7-111-reverse-fullback-claimed-artifact-gate
title: "PLAN-L7-111: Reverse fullback claimed artifact gate"
kind: add-impl
layer: L7
drive: db
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
agent_slots:
  - role: tl
    slot_label: "TL - claimed artifact gate"
generates:
  - artifact_path: docs/plans/PLAN-L7-111-reverse-fullback-claimed-artifact-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-111-reverse-fullback-claimed-artifact-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: src/plan/lint.ts
    artifact_type: source_module
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-107-reverse-fullback-scope-gate.md
  requires:
    - docs/plans/PLAN-L7-107-reverse-fullback-scope-gate.md
    - docs/plans/PLAN-REVERSE-111-reverse-fullback-claimed-artifact-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T23:20:00+09:00"
    tests_green_at: "2026-06-23T23:18:00+09:00"
    verdict: approve
    scope: "Reverse fullback claimed artifact path lint and regression test."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun test tests\\plan-lint.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T23:17:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:f05c44ce57f60c83b5099bd2d8b81cffaab88950eeed4b6cbeb6e9648ba63a2d"
      - kind: lint
        command: "bun run src\\cli.ts plan lint --gate governance"
        runner: bun
        scope: gate
        exit_code: 0
        completed_at: "2026-06-23T23:18:00+09:00"
        evidence_path: src/plan/lint.ts
        output_digest: "sha256:4e39ab5e789f3b9041f3be9243c1d0292183f0ad2675b5ff4b3c0f7097cee456"
---

# PLAN-L7-111: Reverse fullback claimed artifact gate

## Objective

Prevent a Reverse/fullback PLAN from saying that a backprop artifact path was
updated while omitting that same artifact from `generates`.

## Scope

- Add `reverse_fullback_claimed_artifact_missing` to `plan-governance`.
- Limit the rule to literal `docs/design/`, `docs/governance/`, and
  `docs/test-design/` paths in the PLAN body.
- Keep legacy natural-language claims visible through the audit document rather
  than retroactively failing existing PLANs.

## Acceptance Criteria

- A new R4 fullback whose body cites an ungenerated backprop artifact path fails.
- A live governance lint run passes for current PLANs.
- `bun test tests\plan-lint.test.ts` passes.
