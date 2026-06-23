---
plan_id: PLAN-L7-109-review-green-command-db-projection
title: "PLAN-L7-109: Review green command DB projection"
kind: add-impl
layer: L7
drive: db
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
agent_slots:
  - role: tl
    slot_label: "TL - review green command test_runs projection"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-109-review-green-command-db-projection.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-109-review-green-command-db-projection.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/review-green-command-projection.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-108-review-green-command-evidence.md
  requires:
    - docs/plans/PLAN-L7-108-review-green-command-evidence.md
    - docs/plans/PLAN-REVERSE-109-review-green-command-db-projection.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23"
    tests_green_at: "2026-06-23"
    verdict: approve
    scope: "Project review_evidence.green_commands into harness.db test_runs so green review evidence is queryable by PLAN/evidence path/digest."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun test tests\\review-green-command-projection.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23"
        evidence_path: tests/review-green-command-projection.test.ts
        output_digest: "sha256:d288dc9ff7118c9cb76e83d2c5357e0312a66a2430a3774933f35f671a227009"
---

# PLAN-L7-109: Review green command DB projection

## Objective

Make the `green_commands[]` evidence introduced by PLAN-L7-108 queryable through
harness.db instead of leaving it only in PLAN frontmatter.

## Scope

- Project `review_evidence.green_commands[]` into `test_runs` during deterministic
  `rebuildHarnessDb`.
- Preserve command, runner, scope, exit code, evidence path, output digest, and
  completed timestamp.
- Add a focused regression test proving PLAN-L7-108 green command evidence appears
  in `test_runs`.
- Record the implementation note in L5 physical data.

## Acceptance Criteria

- Rebuild creates `test_runs` rows for `PLAN-L7-108-review-green-command-evidence`.
- Projected rows have exit code 0, evidence paths, and SHA-256 output digests.
- `bun test tests\review-green-command-projection.test.ts` passes.
- `bun run typecheck`, `bun run lint`, and `bun run src\cli.ts doctor` pass.
