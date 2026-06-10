# A-106 - L5 Completion Re-Review (2026-06-09)

## Scope

Re-review of L5 detailed-design completion status (PLAN-L5-00..08, the four L5 sub-docs, and the L5↔L8 pair). Goal: confirm whether the A-104/A-105 G5 freeze holds on a substance basis (coverage ≠ substance: read the doc bodies, not just ID coverage).

## Method

- pmo-sonnet substance review of all four L5 sub-docs + L8 + ADR-007 (read content, not ID counts).
- Machine checks: `bun run typecheck` (0), `bun run src/cli.ts doctor` (0), targeted `plan lint`, full `npx vitest run`.

## Verdict

L5 substance holds as **conditional pass at review time → pass after fixes below**. The four sub-docs (physical-data / module-decomposition / internal-processing / if-detail) carry real design substance: physical schema (field type / required / default / zod), module boundaries with dependency direction, DbC pre/post/invariant, D-CONTRACT external contracts, and ADR-007 safety boundary. Declared carries (SubDoc zod / planIdSchema regex / adapter detail zod / edge docstring transcription) are explicit defer, not under-design.

## Findings Fixed In This Re-Review

1. **Critical — L8 doc body mojibake.** The G5 freeze commit (14792e3) itself corrupted the L8 doc body (§0-§4 + Appendix A) via a UTF-8→CP932 misread; only the English §5 GWT and Appendix B stayed intact, so the cross-agent review passed over an unreadable Japanese narrative (a coverage≠substance miss — structure/IDs checked, full readability not). CP932 reversal was lossy (79 replacement chars), so the clean Japanese body was restored from the pre-corruption version (7d6449c) and spliced with the intact English §5/Appendix B and the confirmed frontmatter. Encoding-fix note added to the doc header.
2. **Critical — stale "SQLite 不採用" in PLAN-L5-00-master §1 triage.** Contradicted ADR-007 (SQLite adopted as projection/feedback DB) and the master's own Appendix B (PLAN-L5-08). Updated to: file-based JSON/YAML as SSoT + `.ut-tdd/harness.db` SQLite as projection/feedback DB (ADR-007, ADR-001 defer released). Cleanup-principle (MUST) violation resolved.
3. **Important — stale DoD checkboxes.** §5 DoD had two unchecked items that were actually done: L8 pair_artifact connection (now GWT-level via L8 §5) and G5 readiness (frozen by A-104). Both checked with evidence references.

## Remaining Carry (not freeze blockers)

- IMP-004: `planIdSchema` in `src/schema/frontmatter.ts` does not yet accept layered/drive IDs; declared carry with a blocking dependency to resolve before `plan lint` hard-enforcement (physical-data.md §4). Cross-series ID patterns (DISCOVERY/REVERSE/RECOVERY/M) not yet enumerated in physical-data §4.
- L6/L7 carry: function signatures, pseudocode, resolver/scoring/regex, TypeScript + vitest materialization.
- Security/PO: authentication and secret-management operational decision remains human/security approval carry.

## Test State

- typecheck 0, doctor 0, `plan lint` (L5-00 / L5-08) OK.
- `npx vitest run`: 7 pre-existing failures, none introduced by this re-review (verified by stashing the two doc edits and reproducing on HEAD): `tests/runtime-hook-entrypoints.test.ts` (bun subprocess spawn `status: null`, environment flakiness) + `tests/l6-fr-coverage.test.ts` (PO parallel WIP, untracked). The two doc edits are markdown-only and imported by no test.

## Note

Working tree contains parallel PO edits (L6 FR-unit-coverage: function-spec.md / concept / L7-unit-test-design.md / doctor / l6-fr-coverage). This re-review touched only docs/test-design/harness/L8-integration-test-design.md and docs/plans/PLAN-L5-00-master.md; a commit must stage only those two.
