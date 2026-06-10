# A-105: G5 add-design re-bless - harness.db reference-feedback and automation foundation

- Date: 2026-06-08
- Scope: PLAN-L5-08-harness-db-feedback
- Gate: G5 add-design re-bless
- Verdict: PASS

## Summary

The user clarified that `.ut-tdd/harness.db` must serve as a feedback mechanism, not only as a V-model state cache. The follow-up audit also checked whether workflow automation, guardrail safety, and skill/roster/command documentation assets were already requested but not recognized as one automation foundation. The add-design binds the request to existing FR-L1-05/06/07/09/12/13/17/18/19/20/33/37/39/40/41/45/46/47/48/49, identifies missing L5 detail, and descends it into:

- L1 functional requirement bundle
- governance requirements acceptance bundle
- L5 physical-data projection schema, workflow readiness, guardrail decisions, asset catalog, and indexes
- L5 module-decomposition DB/search/feedback/automation/guardrail/asset module boundaries
- L5 internal-processing D-API and DbC
- L5 if-detail CLI/search/automation/guardrail/asset contracts
- L8 IT-DB / IT-SEARCH / IT-FEEDBACK / IT-AUTOMATION / IT-GUARDRAIL / IT-ASSET-DB pair rows

## External References Used

- SQLite FTS5: rebuildable external/contentless full-text index pattern
- OpenTelemetry semantic conventions: common trace/log/metric/event naming
- W3C PROV: entity/activity/agent provenance framing

## Checks

- PLAN-L5-08 `§工程表`: pass (`bun run src/cli.ts plan lint docs/plans/PLAN-L5-08-harness-db-feedback.md`)
- Review evidence: intra-runtime TL self-review recorded in PLAN frontmatter
- Safety: raw provider transcript, secrets, credentials, and PII are explicitly out of scope for DB persistence
- Automation foundation: workflow readiness cannot report ready without evidence; guardrail human-required decisions cannot be downgraded by projection; skill/roster/command prompt bodies remain markdown source and only metadata is cataloged.

## Carry

- L6: function signatures, migration details, schema details
- L7: `bun:sqlite` implementation, fallback adapter, projection writer, search, feedback metrics, automation readiness, guardrail ledger, asset catalog, vitest
