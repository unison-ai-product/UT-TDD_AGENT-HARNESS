---
plan_id: PLAN-L7-186-test-lane-granularity
title: "PLAN-L7-186: test lane granularity"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/process/gates.md
backprop_decision: not_required
backprop_decision_reason: "This adds local verification lanes and runner guardrails without changing acceptance criteria or product behavior."
dependencies:
  parent: docs/process/gates.md
  requires:
    - package.json
    - src/lint/runtime-portability.ts
    - tests/runtime-portability.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T15:00:55+09:00"
    tests_green_at: "2026-06-29T15:00:38+09:00"
    verdict: approve
    scope: "Vitest full/fast/DB/CLI test lane scripts, runtime-portability guardrails, and verification documentation."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\runtime-portability.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T14:43:00+09:00"
        evidence_path: tests/runtime-portability.test.ts
        output_digest: "sha256:5a2a4a64c94334bddd84f505a38d23514b23664a6f92f2fea268af0c74d4b4d3"
      - kind: unit_test
        command: "bun run test:fast"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T14:47:00+09:00"
        evidence_path: package.json
        output_digest: "sha256:2a2ae24df3662d784c4bfc19437d52c3dcaba3ceb4f4aa51797e43f5181cdac7"
      - kind: unit_test
        command: "bun run test:db"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T14:51:00+09:00"
        evidence_path: package.json
        output_digest: "sha256:2a2ae24df3662d784c4bfc19437d52c3dcaba3ceb4f4aa51797e43f5181cdac7"
      - kind: unit_test
        command: "bun run test:cli"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T14:52:00+09:00"
        evidence_path: package.json
        output_digest: "sha256:2a2ae24df3662d784c4bfc19437d52c3dcaba3ceb4f4aa51797e43f5181cdac7"
      - kind: unit_test
        command: "bun run test"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-29T15:00:38+09:00"
        evidence_path: package.json
        output_digest: "sha256:2a2ae24df3662d784c4bfc19437d52c3dcaba3ceb4f4aa51797e43f5181cdac7"
agent_slots:
  - role: tl
    slot_label: "TL - test lane granularity"
  - role: aim
    slot_label: "AIM - Vitest runner script guard"
  - role: qa
    slot_label: "QA - fast/heavy lane smoke"
generates:
  - artifact_path: docs/plans/PLAN-L7-186-test-lane-granularity.md
    artifact_type: markdown_doc
  - artifact_path: package.json
    artifact_type: json_config
  - artifact_path: src/lint/runtime-portability.ts
    artifact_type: source_module
  - artifact_path: tests/runtime-portability.test.ts
    artifact_type: test_code
  - artifact_path: docs/process/forward/L07-implementation.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L3-functional/nfr-grade.md
    artifact_type: design_doc
  - artifact_path: README.md
    artifact_type: markdown_doc
---

# PLAN-L7-186: test lane granularity

## Objective

Make the verification loop faster and less error-prone while keeping the full
CI gate unchanged.

## Scope

- Keep `bun run test` as the canonical full Vitest suite.
- Add a fast local lane that excludes slow DB/CLI/runtime integration files.
- Add named DB and CLI heavy lanes so slow verification remains explicit.
- Mechanically require these lanes through `runtime-portability`.
- Remove stale process/NFR references that present bare `bun test` as a valid
  full-gate substitute.

## Acceptance

- `package.json` exposes `test`, `test:fast`, `test:db`, `test:cli`, and
  `test:node-fallback`.
- Runtime portability lint fails if the Vitest full/fast/DB/CLI lanes are
  missing.
- `bun run test:fast`, `bun run test:db`, and `bun run test:cli` all pass.
- Full `bun run test` remains the merge/CI gate.
