---
plan_id: PLAN-L7-112-reverse-r4-claimed-artifact-gate
title: "PLAN-L7-112: Reverse R4 claimed artifact gate"
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
    slot_label: "TL - Reverse R4 claimed artifact gate"
generates:
  - artifact_path: docs/plans/PLAN-L7-112-reverse-r4-claimed-artifact-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-112-reverse-r4-claimed-artifact-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/reverse-fullback-backprop-audit-2026-06-22.md
    artifact_type: markdown_doc
  - artifact_path: docs/improvement-backlog.md
    artifact_type: markdown_doc
  - artifact_path: src/plan/lint.ts
    artifact_type: source_module
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-111-reverse-fullback-claimed-artifact-gate.md
  requires:
    - docs/plans/PLAN-L7-111-reverse-fullback-claimed-artifact-gate.md
    - docs/plans/PLAN-REVERSE-112-reverse-r4-claimed-artifact-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T23:55:00+09:00"
    tests_green_at: "2026-06-23T23:54:00+09:00"
    verdict: approve
    scope: "Reverse R4 claimed artifact path lint for non-fullback reverse types."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun test tests\\plan-lint.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T23:53:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:ba64ea807951fdf6b3c3d0891e5525afe5b32e9599129db35e6870da0706826d"
      - kind: lint
        command: "bun run src\\cli.ts plan lint --gate governance"
        runner: bun
        scope: gate
        exit_code: 0
        completed_at: "2026-06-23T23:54:00+09:00"
        evidence_path: src/plan/lint.ts
        output_digest: "sha256:40c960d0d4d0b49ef3aff27e12291b7a5851077e6fdcf7aca1868bdf0d964510"
---

# PLAN-L7-112: Reverse R4 claimed artifact gate

## Objective

Close the non-fullback Reverse R4 trace hole found during the 2026-06-23 sweep.
When a confirmed/completed R4 Reverse PLAN with `confirmed_reverse_type` other
than `fullback` cites an upstream artifact path in its body, that path must also
be listed in `generates`.

## Scope

- Add `reverse_r4_claimed_artifact_missing` to `plan-governance`.
- Apply the rule only to new or updated non-fullback R4 Reverse PLANs from
  2026-06-23 onward.
- Keep older PLANs as audit debt instead of retroactively failing the repository.

## Acceptance Criteria

- A new non-fullback R4 Reverse PLAN that cites an ungenerated upstream artifact
  path fails.
- A matching generated artifact passes.
- Legacy non-fullback R4 Reverse debt remains visible in the audit document.
