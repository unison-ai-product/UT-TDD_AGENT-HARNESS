# A-145-03 - Feature review: Verification & gate engine

- **index**: [A-145 feature review index](./A-145-feature-review-index.md) · **gaps**: [A-144-03 audit](./A-144-03-verification-evidence-integrity.md)

## Features

| feature | purpose | key module | maturity |
|---|---|---|---|
| `doctor` | run all ~74 gates, fail-close aggregate | `src/doctor/index.ts` + `src/lint/*` | mature |
| `review --uncommitted/--staged` | change-impact + verification recommendation packet | `src/lint/change-impact.ts`, `verification-profile.ts` | mature |
| `gate <id>` | review-tier + static gate evaluation | `src/gate/*` | mature |
| `plan lint` / `vmodel lint` | PLAN schema/governance/trace; V-model 4-artifact trace | `src/plan/lint.ts`, `src/vmodel/lint.ts` | mature |
| `mcp profile list/probe`, `mcp inspect`, `verify recommend/run` | external verification profiles (Playwright/Vitest/MCP) | `src/lint/verification-profile.ts` | partial (manual run, no harness.db success capture) |
| `audit quality` / `branch audit` | hardcoded-value/security/debt scan; branch hygiene | `src/audit/*` | mature |
| `graph impact/export` | cross-artifact relation-graph impact + mermaid/dot | `src/lint/relation-graph.ts`, `src/graph/loader.ts` | mature |

## The gate engine — substance vs presence (the headline)

Of **74 gates**: **4 substance** (`propagation`, `plan-body-substance`, `db-projection-ingestion`, `green-command-digest`), **4 substance-boundary** (`review-evidence`, `l6-fr-coverage`, `descent-obligation`, `g8/g9/g10-workflow`), **66 presence/structure/drift**. So ~94% verify "registered / well-formed / no-drift", not "correct content".

## Strengths
- Consistent fail-close design (I/O failure → ok=false); pure-function + loader separation across all lint modules.
- `green-command-digest` exists at all — it is the one gate that can detect a fake/restamped digest (sha256 of evidence file vs recorded).
- `db-projection-ingestion` and `plan-body-substance` genuinely read real content (live `:memory:` rebuild; body line count excluding frontmatter).

## Maturity verdict & the critical hole
The engine is broad, wired, and fail-close — but mostly **presence**. The critical risk (audit [VER-1](./A-144-03-verification-evidence-integrity.md), now sharpened): **`green-command-digest` is advisory — it is NOT in `runDoctor.ok`** (`src/doctor/index.ts` ~L2104). Therefore a fake or mechanically-restamped digest (e.g. commit `8111a92`) passes `review-evidence` + `guardrail-invariants` + `oracle-test-trace` **without failing doctor**. `oracle-test-trace` checks citation presence (not green); `cycle-p4-verification` checks `status=closed` (not evidence content). The single mechanical fix is hardening `green-command-digest` into `ok` once the fake-digest backlog is corrected. The structural fix for substance generally is [PLAN-L7-188](../../docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md). See also VER-3 (no Vitest coverage threshold).
