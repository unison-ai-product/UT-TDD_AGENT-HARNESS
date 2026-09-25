# HELIX to UT-TDD Cutover Strategy

Date: 2026-06-11
Status: backfilled-current
Owner: Codex TL + PO

Related:

- `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`
- `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md`
- `docs/plans/PLAN-M-01-cutover-backfill.md`
- `docs/plans/PLAN-L7-44-harness-db-master.md`
- `docs/plans/PLAN-L7-46-projection-writer.md`

## 1. Current Decision

The cutover target is UT-TDD-owned execution and state.

- HELIX is a reference source only. It supplies concepts, labels, and historical inventory.
- Executable harness behavior is owned by UT-TDD under TypeScript/Bun `src/`.
- The `ut-tdd` CLI and `.ut-tdd/` state are the current harness path.
- `.helix/` and `vendor/helix-source/` are not runtime state for this product.
- HELIX Python files are not copied as product code. Required behavior is reimplemented in TypeScript.

This means the active cutover work is not a wave-by-wave code port. It is a backfill of documentation, commands, state projection, and audit feedback so the repository describes and verifies the current UT-TDD path consistently.

## 2. Superseded Assumptions

| Old assumption | Current rule |
| --- | --- |
| Copy HELIX Python modules into a UT-TDD package | Reimplement required behavior in TypeScript/Bun `src/` |
| Use HELIX CLI commands as the operating path | Use `ut-tdd` commands as the operating path |
| Treat `.helix/` as active state | Treat `.ut-tdd/` as the active generated state area |
| Keep a HELIX fallback as normal operation | Keep HELIX materials as historical/reference inputs only |
| Define cutover as source-module swap | Define cutover as docs/config/state/projection alignment |

Legacy command names may appear only when quoting historical source or inventory. They are not instructions for new work in this repository.

## 3. Current Cutover State

The repository is already in UT-TDD-owned mode for new work:

- Project rules are split across `CLAUDE.md`, `.claude/CLAUDE.md`, and `AGENTS.md`.
- Governance documents name TypeScript/Bun as the implementation path.
- Roadmap and review checks run through the UT-TDD CLI/doctor path.
- `harness.db` is the local projection target for audit and feedback signals.
- Vendor snapshots remain read-only evidence for migration context.

The remaining cutover loop is projection completeness: automation outputs must be pulled into `harness.db` so feedback and audit checks can query the same local database instead of relying only on Markdown scans.

## 4. Harness DB Projection Backfill

`harness.db` now receives the cutover-facing projections needed for the verification band:

- `roadmap_rollups`: program-level band, gate, span, and frontier summary.
- `roadmap_band_coverage`: one row per program band with covered/parked/uncovered status.
- `roadmap_gate_progress`: one row per roadmap gate with span confirmation status.
- `review_evidence_registry`: review evidence metadata per PLAN.

These are deterministic projections. The source remains repository documents and generated evidence; `.ut-tdd/harness.db` can be rebuilt.

## 5. Verification Definition

Cutover backfill is complete when all of the following hold:

- `ut-tdd doctor` reports no active roadmap or handover drift.
- `db rebuild` creates the roadmap and review evidence projection tables.
- Projection tests prove idempotent rebuild behavior and concrete rows for the verification/cutover bands.
- This document no longer instructs a HELIX runtime path, Python port, or `.helix/` state dependency for current work.

## 6. Rollback and Recovery

This cutover does not perform destructive data migration.

- Documentation changes can be reverted by commit.
- `.ut-tdd/harness.db` can be rebuilt from repository sources.
- New projection tables are append-only schema additions and are populated by `db rebuild`.
- If projection quality regresses, keep source documents as truth and fix the projection writer before using DB rows for gate decisions.

## 7. Completion Evidence

Completion evidence is recorded in:

- `tests/projection-writer.test.ts`
- `src/schema/harness-db.ts`
- `src/state-db/projection-writer.ts`
- `.ut-tdd/handover/CURRENT.json`
- `docs/handover/session-handover-2026-06-11-cutover-db-projection.md`
