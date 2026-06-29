# A-145-04 - Feature review: DB registration & projection

- **index**: [A-145 feature review index](./A-145-feature-review-index.md) · **gaps**: [A-144-04 audit](./A-144-04-db-registration-projection.md)

## Features

| feature | purpose | key module | maturity |
|---|---|---|---|
| `db status` / `db rebuild` | schema + deterministic projection rebuild (atomic transaction) | `src/state-db/projection-writer.ts`, `maintenance.ts` | mature |
| `telemetry scan` | scan claude/codex session JSONL → token/cost into `model_runs` | `src/state-db/token-tracker.ts` | mature, but **manual-fire only** |
| `metrics skill` | skill firing/acceptance metrics | `src/feedback/engine.ts` | partial (depends on facade `skill_invocations`) |
| `feedback list/classify/pending` | feedback_events surface; forced-stop classification | `src/feedback/*`, `src/runtime/forced-stop.ts` | mature |
| `find <query>` | harness.db reference index search | `src/search/index.ts` | partial (only assets registered; no CLI surface noted) |
| `asset catalog` / `roster` | catalog skills/agents/commands into DB | `src/assets/catalog.ts` | mature |
| `progress artifacts` | artifact progress color view | `src/state-db/artifact-progress-decision.ts` | mature |
| document-export | section/redact/render canonical docs into DB | `src/export/document-export.ts` | mature (xlsx/pptx intentionally disabled) |
| `issue queue` / `mark-created` | GitHub-issue dry-run queue | DB (`issue_queue`) | stub (not closed-loop) |
| `trouble list` | trouble_events surface | DB (`trouble_events`) | stub |
| `improvement log` | self-improvement log | DB (`improvement_log`) | **hollow** (populate path ~empty) |
| gates | `db-projection-coverage`, `db-projection-ingestion`(substance), `db-telemetry-provenance`(creator partial-landed), `drive-db-registration`, `impl-plan-trace`, `plan-artifact-existence`, `merged-plan-status` | `src/lint/*` | mostly presence |

## Strengths
- `db rebuild` is idempotent + atomic (single transaction); deterministic projection keeps consistency.
- Safety in projection: secret-like values and raw-payload keys rejected; `.ut-tdd/` path guard; SQL identifier validation + value binding.
- `hook_events` (10082 / 167 sessions) and `drive_runs` (482 / 64 sessions) are **genuine runtime telemetry** — the real backbone of pillar 3.
- telemetry token/cost ingest does not fabricate cost (unlisted models → null), single pricing SSoT.
- Creator has partial-landed `db-telemetry-provenance` (PLAN-L7-188) which now *surfaces* the facade tables.

## Maturity verdict
Rebuild/export/telemetry/feedback are mature; the **operation-telemetry tables are facade/hollow** and the **feedback loop is not auto-closed**. Audit [A-144-04](./A-144-04-db-registration-projection.md): DB-1 (skill_invocations all projection, test_runs = projected digests, guardrail_decisions=2 unwired, model_runs cost all NULL), DB-2 (ingestion gate = populated, not provenance). Feature-review additions: `telemetry scan` / `skill suggest` / `issue queue` have **no auto-fire** (manual only → loop open); `improvement_log` is hollow; `search` lacks a producer for primary entities. Closing the auto-fire loop + real provenance capture = [PLAN-L7-188](../../docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md) follow-up (the creator's `db-telemetry-provenance` is the visibility slice, not the capture).
