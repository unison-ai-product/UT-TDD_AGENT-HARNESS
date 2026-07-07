# A-159 - Pack main sync

- **date**: 2026-07-01
- **source commit**: `a03d1b2 feat: materialize clean pack sync stage`
- **Pack repository**: `unison-ai-product/UT-TDD_AGENT-HARNESS-Pack`
- **Pack commit**: `6969e4a chore: sync clean pack a03d1b2`
- **Pack author**: `unison-ai-product <253932653+unison-ai-product@users.noreply.github.com>`

## Scope

The clean Pack artifact set from the source repository was materialized into a temporary clone of the Pack repository and pushed to `main`.

Included:

- root `skills/` assets, not `docs/skills/`
- adapter templates under `docs/templates/adapter/`
- runtime source and Pack smoke tests
- Pack workflow `.github/workflows/harness-check.yml`

Excluded by inspection before push:

- `docs/plans/`
- `docs/design/`
- `docs/test-design/`
- `.ut-tdd/`
- `src/web/`
- `docs/adr/`
- `.claude/`, `.codex/`, `AGENTS.md`, `CLAUDE.md` setup outputs
- generated `.ut-tdd-pack-sync-manifest.json`

## Local Pack Verification Before Push

Commands run in the temporary Pack clone:

| command | result |
| --- | --- |
| `bun install --frozen-lockfile` | pass |
| `bun run typecheck` | pass |
| `bun src\cli.ts status --json` | pass: `nonTerminalPlansTotal=0` |
| `bun run vitest run tests/setup.test.ts tests/distribution-acceptance.test.ts tests/skill-recommend.test.ts tests/skill-scaffold.test.ts tests/dependency-drift.test.ts --reporter=dot` | pass: 5 files / 42 tests |
| `bun run lint` | pass |
| `bun src\cli.ts setup --solo; bun .ut-tdd\bin\ut-tdd.mjs doctor --setup-smoke` | pass: `doctor: setup-smoke - OK (checked=22, failed=0)` |

Full `bun run test` was intentionally not used as Pack close evidence because Pack excludes source-repo design docs, PLANs, test-design docs, and `.ut-tdd` audit state. The full source self-test profile is not the Pack CI contract.

## Remote Verification

Pack push:

- `git push origin main`: `8550d1e..6969e4a main -> main`

GitHub Actions:

- run: `28511932992`
- job: `84514117941`
- status: pass
- workflow: `harness-check`
- steps: checkout, setup bun, install deps, typecheck, pack smoke tests, lint, setup smoke

## Remaining Boundary

This closes the clean Pack main sync evidence. It does not close:

- signed tarball publication
- PO UAT / release acceptance
- post-release telemetry from a real consumer deployment
