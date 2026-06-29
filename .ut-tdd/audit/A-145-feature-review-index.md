# A-145 - Full Feature Review (index / hub)

- **date**: 2026-06-29
- **role**: Claude = independent reviewer. Companion to the issue-focused audit [A-144](./A-144-judge-audit-index.md): same 6 functional units, but this report reviews **every feature** (purpose / implementation / maturity / strengths), and links each unit's gaps to its A-144 audit doc.
- **basis**: HEAD (committed). `src/setup`/`src/cli.ts` are creator-in-flight. Surface enumerated mechanically + 3 read-only review agents (CLI surface, gate engine, supporting subsystems).
- **surface size**: ~63 `ut-tdd` CLI commands, 74 doctor gates, ~15 supporting subsystems, 56 harness.db tables (47 populated).

## Headline (what the harness *is*, as a feature platform)

The **safety + session-lifecycle core is mature and real**: hooks (SessionStart/PostToolUse/Stop/SubagentStop), guards (agent-guard, work-guard), session-log, handover, provider delegation (codex/claude adapter), setup, doctor, `db rebuild`, task classify, telemetry token/cost ingest, document-export, asset/roster catalog. These are wired and exercised (hook_events = 10082 real events / 167 sessions).

Three systemic weaknesses cut across the platform (same root as A-144 — `presence ≠ substance`, loop-not-closed):

1. **Gate engine is 94% presence-only.** Of 74 gates, **4 verify substance** (`propagation`, `plan-body-substance`, `db-projection-ingestion`, `green-command-digest`), 4 are substance-boundary, **66 check presence/structure/drift only**. The verification platform mostly checks "registered / well-formed", not "correct".
2. **The one gate that catches fake evidence is advisory.** `green-command-digest` is NOT in `runDoctor.ok`, so a fake/ restamped digest passes `review-evidence` + `guardrail-invariants` + `oracle-test-trace` simultaneously (extends [VER-1](./A-144-03-verification-evidence-integrity.md)).
3. **Auto-fire void / hollow telemetry.** `skill suggest`, `telemetry scan`, `issue queue` have NO automatic firing (manual CLI only) → feedback loop not closed; `skill_invocations`/`test_runs`/`guardrail_decisions` are projection facades and `improvement_log` is hollow (extends [DB-1](./A-144-04-db-registration-projection.md)).

## Maturity matrix by functional unit

| # | Unit | CLI cmds | Gates | Maturity headline | Review doc | Audit doc |
|---|---|---|---|---|---|---|
| 1 | Distribution & packaging | 4 | 4 | setup mature; distribution/cutover partial (apply gated); guards not portable | [R-01](./A-145-01-distribution-packaging.md) | [A-144-01](./A-144-01-distribution-packaging.md) |
| 2 | Runtime config & delegation/security | 18 | 13 | **most mature unit** (hooks/guards/handover/provider all mature); model-override security hole | [R-02](./A-145-02-runtime-config-delegation.md) | [A-144-02](./A-144-02-runtime-config-security.md) |
| 3 | Verification & gate engine | 18 | ~17 | engine broad & fail-close, but **substance 4/74**; digest gate advisory | [R-03](./A-145-03-verification-gate-engine.md) | [A-144-03](./A-144-03-verification-evidence-integrity.md) |
| 4 | DB registration & projection | 15 | ~8 | rebuild/export/telemetry mature; facade/hollow telemetry; stub dumpers | [R-04](./A-145-04-db-registration-projection.md) | [A-144-04](./A-144-04-db-registration-projection.md) |
| 5 | Design & doc coverage | 5 | ~18 | coverage model strong; gates presence; FE bodies 3/6 pending | [R-05](./A-145-05-design-doc-coverage.md) | [A-144-05](./A-144-05-design-doc-coverage.md) |
| 6 | Drive models & workflow | 3+ | ~12 | convergence enforced (strongest); entry advisory | [R-06](./A-145-06-drive-models-workflow.md) | [A-144-06](./A-144-06-drive-models.md) |

## Maturity legend used in unit docs

- **mature**: wired (CLI + hook/rebuild) and exercised with real data.
- **partial**: works but condition-gated / dry-run-only / manual-fire / DB-dependent.
- **stub**: read-only table dumper; producer is elsewhere or thin.
- **hollow**: schema/CLI exist but the populate path is essentially empty.

## Document map

1. [R-01 Distribution & packaging](./A-145-01-distribution-packaging.md)
2. [R-02 Runtime config & delegation/security](./A-145-02-runtime-config-delegation.md)
3. [R-03 Verification & gate engine](./A-145-03-verification-gate-engine.md)
4. [R-04 DB registration & projection](./A-145-04-db-registration-projection.md)
5. [R-05 Design & doc coverage](./A-145-05-design-doc-coverage.md)
6. [R-06 Drive models & workflow](./A-145-06-drive-models-workflow.md)

## Relationship to A-144 and to the creator

- A-145 (features) and [A-144](./A-144-judge-audit-index.md) (issues) share the 6 units 1:1. Read A-145-0N for "what exists + how mature"; A-144-0N for "what's wrong".
- The creator (Codex) is consuming A-144: it has partial-landed `db-telemetry-provenance` (PLAN-L7-188) addressing [DB-1/DB-2](./A-144-04-db-registration-projection.md). Maturity rows above are HEAD-as-of-this-pass and will move.
