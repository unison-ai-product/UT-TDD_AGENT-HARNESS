---
plan_id: PLAN-REVERSE-121-branch-kind-check
title: "PLAN-REVERSE-121: branch-kind check fullback"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: db
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
forward_routing: L3
promotion_strategy: reuse-with-hardening
backprop_scope:
  - layer: requirements
    decision: updated
    evidence_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    reason: "Requirements now name branch-kind-check as the github_issue_id warning surface."
  - layer: L4-basic-design
    decision: not_impacted
    reason: "The change implements an existing governance rule; no new architecture component is introduced."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The checker is a lint module wired through the established doctor path."
agent_slots:
  - role: tl
    slot_label: "TL - branch-kind fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-121-branch-kind-check.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-121-branch-kind-check.md
  requires:
    - docs/plans/PLAN-L7-121-branch-kind-check.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T13:45:00+09:00"
    tests_green_at: "2026-06-23T13:45:00+09:00"
    verdict: approve
    scope: "R4 fullback from implemented branch-kind checker to requirements."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\branch-kind.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T13:45:00+09:00"
        evidence_path: tests/branch-kind.test.ts
        output_digest: "sha256:d75b67733f22630222c3ddffdc379c691ba299b22da3109b1bb76114f93c630e"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T13:45:00+09:00"
        evidence_path: src/lint/branch-kind.ts
        output_digest: "sha256:27410a6c1ff6cad593bfa919427fb24189dd05dc1b7a63c12a15198ed6e84f08"
---

# PLAN-REVERSE-121: branch-kind check fullback

## Objective

Back-fill the branch-kind implementation result into requirements.

## Scope

- Requirements §6.8.2 now points the `github_issue_id` branch warning to
  `branch-kind-check`.
- Requirements §7.4 acceptance criteria now includes the `github_issue_id`
  warning behavior.

## Acceptance Criteria

- The implemented checker and requirements text name the same warning surface.
- R4 fullback evidence records unchanged L4/L5 impact.
