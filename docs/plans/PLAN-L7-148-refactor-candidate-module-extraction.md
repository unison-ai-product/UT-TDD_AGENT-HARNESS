---
plan_id: PLAN-L7-148-refactor-candidate-module-extraction
title: "PLAN-L7-148: refactor candidate detector module extraction"
kind: refactor
layer: L7
drive: db
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant module extraction inside existing state-db projection boundary. No public CLI/API contract, persistence schema, requirements, or L4/L6 design semantics changed; Refactor mode guidance was updated in-place as the canonical process artifact."
agent_slots:
  - role: se
    slot_label: "SE - detector module extraction"
  - role: tl
    slot_label: "TL - refactor model precision review"
generates:
  - artifact_path: docs/plans/PLAN-L7-148-refactor-candidate-module-extraction.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/modes/refactor.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/refactor-candidates.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-147-refactor-candidate-detector.md
  requires:
    - docs/plans/PLAN-L7-147-refactor-candidate-detector.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T14:52:00+09:00"
    tests_green_at: "2026-06-25T14:52:00+09:00"
    verdict: approve
    scope: "Behavior-invariant extraction of detector logic plus Refactor mode precision guidance."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T14:49:29+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:54a0128ece0ed84a75ca94323c74181c81089262a4ef81d406621640215a82dd"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T14:49:41+09:00"
        evidence_path: src/state-db/refactor-candidates.ts
        output_digest: "sha256:0e270c1572d46850fe94dd43359a38c04b75ecc7b23a62cf8bf983f74c8f601a"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T14:49:41+09:00"
        evidence_path: src/state-db/projection-writer.ts
        output_digest: "sha256:3ec94213b5788a3dbce52c375a7dcbf01593c233c47d8afcd88e55da869ff4af"
      - kind: smoke
        command: "bun run src\\cli.ts db rebuild"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T14:50:05+09:00"
        evidence_path: docs/process/modes/refactor.md
        output_digest: "sha256:915ec6686156b8ed12e57a18b666105a488bc3ae85c31e1d89db2c1336ac94b4"
---

# PLAN-L7-148: refactor candidate detector module extraction

## Objective

Execute a behavior-invariant Refactor from the detector's own top
`split-module` candidate and feed the result back into the Refactor driving
model.

## Scope

- Extract refactor candidate detection from `projection-writer.ts` into a
  dedicated `src/state-db/refactor-candidates.ts` module.
- Keep `projection-writer.ts` responsible only for projecting candidate rows
  into `quality_signals` and `feedback_events`.
- Preserve detector output semantics, schema, CLI behavior, and public
  contracts.
- Update Refactor mode guidance with the precision/triage rule learned by
  running the detector against the repository.

## Acceptance Criteria

- `analyzeRefactorCandidates` remains covered by the existing projection writer
  tests.
- Rebuilding `harness.db` still emits refactor candidate quality signals and
  promoted feedback events.
- `bun run vitest run tests\projection-writer.test.ts` passes.
- `bun run typecheck` passes.
- `bun run lint` passes.
- `bun run src\cli.ts doctor` passes or reports only pre-existing non-blocking
  warnings.

## Refactor Invariant

- No persisted schema changes.
- No new user-visible CLI behavior.
- No functional scope beyond module extraction and process guidance.
- Detector candidate ranking and promotion rules remain unchanged.

## Review Evidence

- reviewer: codex-intra-runtime
- review_kind: intra_runtime_subagent
- reviewed_at: 2026-06-25T14:52:00+09:00
- tests_green_at: 2026-06-25T14:52:00+09:00
- verdict: approve
- scope: Behavior-invariant extraction of detector logic plus Refactor mode
  precision guidance.

Green commands:

- `bun run vitest run tests\projection-writer.test.ts` exit 0
  (`tests/projection-writer.test.ts`,
  `sha256:c2103c58ac697008d1b532d5cb5e91f0d7950b7b480048e6b4ec4335f2e715ca`)
- `bun run typecheck` exit 0 (`src/state-db/refactor-candidates.ts`,
  `sha256:b69ae5d05ee9ff7029c7f290a1e2fa7b6d636d8fd141a66a7622a220946036d9`)
- `bun run lint` exit 0 (`src/state-db/projection-writer.ts`,
  `sha256:152268bfc67b38d7c5f3fe9c4eba7ee052fafdc934370f19ece1b6cfe4430a4e`)
- `bun run src\cli.ts db rebuild` exit 0 (`docs/process/modes/refactor.md`,
  `sha256:fc06ec424d72496170fa17325a0041ba00112ce0fa01b519e65b3ae6c18342bf`)
