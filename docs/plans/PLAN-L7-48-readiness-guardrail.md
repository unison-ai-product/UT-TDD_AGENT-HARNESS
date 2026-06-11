---
plan_id: PLAN-L7-48-readiness-guardrail
title: "PLAN-L7-48: harness.db automation-readiness + guardrail-ledger"
kind: impl
layer: L7
drive: db
status: completed
created: 2026-06-11
updated: 2026-06-11
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: gpt-5.4
    reviewer_model: gpt-5.3-codex
    tests_green_at: "2026-06-11"
    reviewed_at: "2026-06-11"
    verdict: pass-with-fixes
    scope: "readiness/guardrail span: missing evidence blocks readiness, human-required is not downgraded, self-review/missing signoff becomes guardrail finding."
generates:
  - artifact_path: src/workflow/readiness.ts
    artifact_type: source
  - artifact_path: src/guardrail/ledger.ts
    artifact_type: source
  - artifact_path: tests/readiness-guardrail.test.ts
    artifact_type: test
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires:
    - docs/plans/PLAN-L7-46-projection-writer.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/design/harness/L5-detailed-design/if-detail.md
    - docs/test-design/harness/L8-integration-test-design.md
  references:
    - docs/design/harness/L5-detailed-design/physical-data.md
    - .claude/CLAUDE.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-48: harness.db automation-readiness + guardrail-ledger

## Objective

- Implement `evaluateAutomationReadiness()` for ready / blocked / human-required projection and expose `ut-tdd automation readiness`.
- Implement `recordGuardrailDecision()` for guardrail / review / escalation / human signoff decisions and expose `ut-tdd guardrail status`.

## Invariants

- Missing evidence cannot become ready.
- Human-required boundaries are not downgraded by DB projection.
- Same-model self-review and missing signoff are blocked and surfaced.
- Secret-like content and provider transcript bodies are not stored.

## Completion Evidence

- `src/workflow/readiness.ts`, `src/guardrail/ledger.ts`, and `tests/readiness-guardrail.test.ts` exist.
- `bun test tests/search-feedback.test.ts tests/readiness-guardrail.test.ts tests/asset-catalog.test.ts` -> 7 pass.
- `bunx tsc --noEmit` -> pass.
- `bun run src/cli.ts db rebuild --json` -> pass.
- CLI smoke passed:
  - `bun run src/cli.ts automation readiness --json`
  - `bun run src/cli.ts guardrail status --json`
- `bun run src/cli.ts doctor` -> pass.

## Notes

- A parallel smoke run produced one transient `SQLiteError: database is locked` on `automation readiness`; sequential rerun passed. DB-writing smoke commands should be run sequentially unless concurrent-writer support is explicitly designed.

## DoD

- [x] IT-AUTOMATION-01 / GUARDRAIL-01 green.
- [x] `automation readiness` / `guardrail status` runnable, invariants maintained.
- [x] Regression slice + doctor green, review evidence present.
