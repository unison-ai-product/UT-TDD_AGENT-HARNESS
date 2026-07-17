# deliverable trace debt audit

## 目的

PLAN-L7-450 W3/W4 の縮小専用 baseline 台帳。`scripts/`、`.claude/`、`tests/**/*.test.ts` の
PLAN `generates` 未宣言成果物を全数固定し、台帳外の追加と、既に trace された台帳行の残留を
`deliverable-plan-trace` hard gate が fail-close する。新規行の追加は許可しない。

## 棚卸し基準

2026-07-17 に `git ls-files scripts .claude tests` と全 PLAN `generates[].artifact_path` を突合した。
既存 debt の remediation owner は `PLAN-REVERSE-450-test-traceability-detector-backfill` とし、
各行を PLAN 宣言へ backfill してこの台帳から削除する。`promote_by` は台帳の無期限化を防ぐ期限である。

| artifact_path | owner_plan | justification | promote_by |
| --- | --- | --- | --- |
| `.claude/agents/be-api.md` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical agent artifact predates trace gate | 2026-08-31 |
| `.claude/agents/be-logic.md` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical agent artifact predates trace gate | 2026-08-31 |
| `.claude/agents/blind-reviewer.md` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical agent artifact predates trace gate | 2026-08-31 |
| `.claude/agents/db-schema.md` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical agent artifact predates trace gate | 2026-08-31 |
| `.claude/agents/devops-deploy.md` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical agent artifact predates trace gate | 2026-08-31 |
| `.claude/agents/pdm-innovation-manager.md` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical agent artifact predates trace gate | 2026-08-31 |
| `.claude/agents/pdm-marketing-innovation.md` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical agent artifact predates trace gate | 2026-08-31 |
| `.claude/agents/pdm-tech-innovation.md` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical agent artifact predates trace gate | 2026-08-31 |
| `.claude/agents/pmo-haiku.md` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical agent artifact predates trace gate | 2026-08-31 |
| `.claude/agents/pmo-project-explorer.md` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical agent artifact predates trace gate | 2026-08-31 |
| `.claude/agents/pmo-project-scout.md` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical agent artifact predates trace gate | 2026-08-31 |
| `.claude/agents/pmo-sonnet.md` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical agent artifact predates trace gate | 2026-08-31 |
| `.claude/agents/pmo-tech-docs.md` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical agent artifact predates trace gate | 2026-08-31 |
| `.claude/agents/pmo-tech-fork.md` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical agent artifact predates trace gate | 2026-08-31 |
| `.claude/agents/pmo-tech-news.md` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical agent artifact predates trace gate | 2026-08-31 |
| `.claude/hooks/agent-guard.ts` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical hook artifact predates trace gate | 2026-08-31 |
| `scripts/git-hooks/pre-push` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical hook artifact predates trace gate | 2026-08-31 |
| `scripts/git-hooks/secret-scan-diff.ts` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical hook artifact predates trace gate | 2026-08-31 |
| `scripts/ut-tdd` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W3 inventory: historical entrypoint predates trace gate | 2026-08-31 |
| `tests/delegation-routing.test.ts` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W4 inventory: existing test debt predates standing gate | 2026-08-31 |
| `tests/plan-asset/evidence-policy.test.ts` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W4 inventory: existing test debt predates standing gate | 2026-08-31 |
| `tests/secret-scan-diff.test.ts` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W4 inventory: existing test debt predates standing gate | 2026-08-31 |
| `tests/setup-agent-floor.test.ts` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W4 inventory: existing test debt predates standing gate | 2026-08-31 |
| `tests/vmodel-source-assets.test.ts` | `PLAN-REVERSE-450-test-traceability-detector-backfill` | W4 inventory: existing test debt predates standing gate | 2026-08-31 |
