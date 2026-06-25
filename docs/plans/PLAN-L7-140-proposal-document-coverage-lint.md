---
plan_id: PLAN-L7-140-proposal-document-coverage-lint
title: "PLAN-L7-140: Proposal document coverage routing and lint wiring"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-24
updated: 2026-06-24
owner: Codex
backprop_decision: not_required
backprop_decision_reason: "Implements mechanical consistency checks for the existing FR-L1-39 proposal document coverage classifier and its test-design routing document. It does not add a new product requirement."
agent_slots:
  - role: tl
    slot_label: "TL - proposal document coverage lint"
  - role: aim
    slot_label: "AIM - dependency-neutral lint wiring review"
generates:
  - artifact_path: src/task/classify.ts
    artifact_type: source_module
  - artifact_path: src/team/model-policy.ts
    artifact_type: source_module
  - artifact_path: src/team/launch-policy.ts
    artifact_type: source_module
  - artifact_path: src/team/run.ts
    artifact_type: source_module
  - artifact_path: src/schema/team.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/lint/proposal-document-coverage.ts
    artifact_type: source_module
  - artifact_path: tests/proposal-document-coverage.test.ts
    artifact_type: test_code
  - artifact_path: tests/task-classify.test.ts
    artifact_type: test_code
  - artifact_path: tests/team-run.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/model-id-ssot.test.ts
    artifact_type: test_code
  - artifact_path: tests/lint-wiring.test.ts
    artifact_type: test_code
  - artifact_path: docs/test-design/harness/proposal-document-coverage-routing.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-95-lint-wiring-meta-gate.md
  requires:
    - PLAN-L7-95-lint-wiring-meta-gate
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-24T12:10:00+09:00"
    tests_green_at: "2026-06-24T12:06:05+09:00"
    verdict: approve
    scope: "Proposal document coverage lint, routing document consistency, lint-wiring deferred registration, team suggestion bridge, and dependency-neutral injection boundary."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/proposal-document-coverage.test.ts tests/lint-wiring.test.ts tests/task-classify.test.ts tests/dependency-drift.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-24T12:06:05+09:00"
        evidence_path: tests/proposal-document-coverage.test.ts
        output_digest: "sha256:b83eb982966a0e6fa019a4fd2bf59e2284cec83a168268f5c845e34243fb8fb1"
---

# PLAN-L7-140: Proposal Document Coverage Routing And Lint

## 1. Objective

Add a mechanical regression fence for proposal-to-document coverage routing so
future template or classifier changes cannot silently remove required design or
test-design documents.

## 2. Scope

- Add a pure lint module for representative `classifyProposalDocumentCoverage`
  scenarios.
- Verify required design/test-design document paths exist.
- Verify the cross-layer routing document is always required.
- Verify the routing document mentions every classified pattern used by the
  representative scenarios.
- Wire the lint into doctor after keeping the lint module dependency-neutral.
- Route proposal subagent recommendations into `team suggest --design-docs`
  without allowing low-cost lanes to become closing judgement owners.

## 3. Acceptance Criteria

- [x] The lint module detects missing routing docs, missing required doc paths,
  missing pattern markers, missing cross-artifact trace evidence, and missing
  shrinkage guard behavior.
- [x] The real repository passes the representative routing scenarios.
- [x] `lint-wiring` records the module as explicitly deferred rather than dead.
- [x] Dependency-neutral injection avoids a lint-to-task module cycle and lets
  doctor hard-gate the coverage routing check.
- [x] Proposal mini/spark/T1 lanes become owned, parallelizable team members
  while `T0-frontier` remains a judgement recommendation outside executable
  team launch output.

## 4. Verification

- `bun run vitest run tests/proposal-document-coverage.test.ts`
- `bun run vitest run tests/lint-wiring.test.ts`
- `bun run vitest run tests/task-classify.test.ts`
