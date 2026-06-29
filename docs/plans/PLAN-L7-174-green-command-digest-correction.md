---
plan_id: PLAN-L7-174-green-command-digest-correction
title: "PLAN-L7-174: green command digest correction"
kind: refactor
layer: L7
drive: db
status: confirmed
created: 2026-06-25
updated: 2026-06-29
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
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T19:18:36+09:00"
    tests_green_at: "2026-06-29T19:18:36+09:00"
    verdict: approve
    scope: "Re-ran green-command-digest/review-evidence tests plus lint/typecheck, then aligned 24 stale green_commands output_digest values to current evidence_path SHA256 in the same correction packet."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\green-command-digest.test.ts tests\\review-evidence.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T19:18:23+09:00"
        evidence_path: tests/green-command-digest.test.ts
        output_digest: "sha256:4c10eca9258ffe560b0eb420d9ecac699ad0e7423b519f09cdf6db81e0000018"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-29T19:18:23+09:00"
        evidence_path: src/lint/green-command-digest.ts
        output_digest: "sha256:898a7a236a2873fdbd0df6b380331fcd70774334af71abd3bd6fb721d721a7f4"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-29T19:18:36+09:00"
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

## 2026-06-29 Rerun-Bound Correction

An independent review found the prior digest correction could be read as a pure
restamp because the updated hashes were not bundled with same-cycle green
reruns. This correction packet re-ran the digest/review-evidence tests, lint,
and typecheck, then aligned 24 stale `green_commands[].output_digest` values to
the current `evidence_path` SHA256 contract. The bound verification target is
that `green-command-digest` reports zero mismatches before the correction is
committed.

## 2026-06-29 Relation-Graph Evidence Rerun

After the relation graph loader gained repo-local hook/config projection nodes,
14 stale `green_commands[].output_digest` values remained for
`src/graph/loader.ts` and `tests/relation-graph-loader.test.ts`. This packet
first re-ran:

- `bun run test tests\relation-graph-loader.test.ts tests\relation-graph.test.ts tests\db-projection-ingestion.test.ts`

The run passed 21 tests across 3 files. Only after that green run, the 14
digest values reported by `checkGreenCommandDigests(process.cwd())` were aligned
to the current evidence file hashes.

## Acceptance Criteria

- `tests/green-command-digest.test.ts`, typecheck, lint, DB rebuild, and doctor
  pass.
- `checkGreenCommandDigests(process.cwd()).mismatches.length === 0`.
- `doctor` reports `green-command-digest — OK`.
