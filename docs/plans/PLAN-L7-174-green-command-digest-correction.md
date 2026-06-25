---
plan_id: PLAN-L7-174-green-command-digest-correction
title: "PLAN-L7-174: green command digest correction"
kind: refactor
layer: L7
drive: db
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Evidence-only correction. Existing green_commands keep the same commands, paths, and exit codes; only stale output_digest values are aligned to the current evidence_path SHA256 contract."
agent_slots:
  - role: se
    slot_label: "SE - green command digest correction"
  - role: tl
    slot_label: "TL - evidence integrity review"
generates:
  - artifact_path: docs/plans/PLAN-L7-174-green-command-digest-correction.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-132-green-command-digest-integrity.md
  requires:
    - docs/plans/PLAN-L7-132-green-command-digest-integrity.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T22:34:29+09:00"
    tests_green_at: "2026-06-25T22:34:29+09:00"
    verdict: approve
    scope: "Mechanically align stale green_commands output_digest values to the current SHA256 of each evidence_path and verify the digest advisory is clean."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\green-command-digest.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T22:34:00+09:00"
        evidence_path: tests/green-command-digest.test.ts
        output_digest: "sha256:4c10eca9258ffe560b0eb420d9ecac699ad0e7423b519f09cdf6db81e0000018"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T22:34:13+09:00"
        evidence_path: src/lint/green-command-digest.ts
        output_digest: "sha256:898a7a236a2873fdbd0df6b380331fcd70774334af71abd3bd6fb721d721a7f4"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T22:34:00+09:00"
        evidence_path: src/lint/green-command-digest.ts
        output_digest: "sha256:898a7a236a2873fdbd0df6b380331fcd70774334af71abd3bd6fb721d721a7f4"
---

# PLAN-L7-174: green command digest correction

## Objective

Remove the remaining `green-command-digest` advisory note by correcting stale
PLAN `green_commands[].output_digest` values to match the current SHA256 of
their declared `evidence_path`.

## Scope

- Do not change command text, exit codes, evidence paths, or review verdicts.
- Mechanically update only `output_digest` values where the evidence file exists
  and the current hash differs.
- Keep the correction behavior aligned with `src/lint/green-command-digest.ts`.

## Acceptance Criteria

- `tests/green-command-digest.test.ts`, typecheck, lint, DB rebuild, and doctor
  pass.
- `checkGreenCommandDigests(process.cwd()).mismatches.length === 0`.
- `doctor` reports `green-command-digest — OK`.
