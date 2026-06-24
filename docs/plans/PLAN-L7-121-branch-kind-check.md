---
plan_id: PLAN-L7-121-branch-kind-check
title: "PLAN-L7-121: branch-kind check doctor gate"
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
    slot_label: "TL - branch-kind check"
generates:
  - artifact_path: docs/plans/PLAN-L7-121-branch-kind-check.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-121-branch-kind-check.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/branch-kind.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/branch-kind.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-120-backfill-result-doc-sync.md
  requires:
    - docs/plans/PLAN-L7-120-backfill-result-doc-sync.md
    - docs/plans/PLAN-REVERSE-121-branch-kind-check.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-23T13:45:00+09:00"
    tests_green_at: "2026-06-23T13:45:00+09:00"
    verdict: approve
    scope: "Branch prefix to PLAN kind gate, github_issue_id warning, and doctor wiring."
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
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-23T13:45:00+09:00"
        evidence_path: tsconfig.json
        output_digest: "sha256:290e679c492d7c229373061b313ab332394da783b08c9eff85bbb81275f96afc"
      - kind: lint
        command: "bunx biome check src\\lint\\branch-kind.ts src\\doctor\\index.ts tests\\branch-kind.test.ts tests\\doctor.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-23T13:45:00+09:00"
        evidence_path: src/lint/branch-kind.ts
        output_digest: "sha256:27410a6c1ff6cad593bfa919427fb24189dd05dc1b7a63c12a15198ed6e84f08"
---

# PLAN-L7-121: branch-kind check doctor gate

## Objective

Make the requirements branch-kind rule executable so branch prefix, touched PLAN
kind, and issue linkage no longer depend on manual review only.

## Scope

- Add `src/lint/branch-kind.ts` as the pure branch-kind analyzer.
- Wire the analyzer into `doctor` so `lint-wiring` can prove it is reachable.
- Fail hard for governed branch prefixes with no touched PLAN or wrong PLAN kind.
- Keep `github_issue_id` missing on `feature/*` / `hotfix/*` as a warning, matching Phase 0-B requirements.

## Acceptance Criteria

- `feature/*` without a touched PLAN fails.
- `feature/*` with a non-`impl` PLAN fails.
- `docs/*` / `chore/*` remain exempt except for `docs/skills/*.md`.
- `doctor` surfaces `branch-kind-check` and `lint-wiring` still passes.
