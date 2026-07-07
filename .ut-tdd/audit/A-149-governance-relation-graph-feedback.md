# A-149 - Governance relation graph feedback close

- **date**: 2026-06-30
- **scope**: close `harness.db` feedback gate `missing-projection` for changed `docs/governance/*.md` files after the design-language Japanese prose cleanup.
- **source**: `ut-tdd feedback list --json --emit` / `feedback_events`, not prose handover.

## Finding

`harness.db` reported 13 open error feedback events:

- `docs/governance/ai-dev-team-concept_v1.1.md`
- `docs/governance/ai-dev-team-operations_v1.1.md`
- `docs/governance/audit-framework.md`
- `docs/governance/coding-rules.md`
- `docs/governance/conditional-backfill-decision-audit-2026-06-22.md`
- `docs/governance/ddd-tdd-rules.md`
- `docs/governance/forward-convergence-legacy-debt-audit.md`
- `docs/governance/gate-design.md`
- `docs/governance/reverse-fullback-backprop-audit-2026-06-22.md`
- `docs/governance/runtime-parity-l0-l3-design-audit-2026-06-02.md`
- `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md`
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`

Root cause: `src/graph/loader.ts` only materialized three governance docs (`README.md`, `document-system-map.md`, `repository-structure.md`) as relation graph design nodes. Other tracked governance docs therefore fell through to `missing-projection`.

## Remediation

- `src/graph/loader.ts` now walks `docs/governance/**/*.md` and materializes every governance Markdown file as a design node.
- `tests/relation-graph-loader.test.ts` covers fixture governance docs and the 13 real-repo feedback paths.
- Existing per-doc governance constants remain compatible; `addDesignDocIfAbsent` prevents duplicate nodes.

## Evidence

- `bun run vitest run tests\relation-graph-loader.test.ts --reporter=dot`: pass (4 tests)
- `bun run typecheck`: pass
- `bun src\cli.ts db rebuild`: pass (`projection ok`, rows 34000)
- `bun src\cli.ts feedback list --json --emit` filtered to `severity=error`: no rows

## Boundary

This closes the relation graph projection gap only. It does not claim release publication, remote CI, tag/signature publishing, or post-publication consumer install.
