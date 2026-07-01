# A-156 - Pack repo default correction and digest rebind

- **date**: 2026-07-01
- **scope**: `distribution plan` / `distribution package` / consumer `tagPin` の既定値を、実際の Pack repo `unison-ai-product/UT-TDD_AGENT-HARNESS-Pack` へ揃えた増分修正。
- **boundary**: これは local distribution contract と green evidence integrity の是正であり、署名 tarball、PO UAT、post-release telemetry を代替しない。

## 発見

AGENTS/CLAUDE と実公開済み Pack repo は `unison-ai-product/UT-TDD_AGENT-HARNESS-Pack` へ揃っていたが、`distribution plan --json` の `export.cleanRepo` と consumer readiness の `tagPin` 生成経路に旧 `UNISON-TECHNOLOGY/ut-tdd-agent-harness-clean` が残っていた。

これは Pack repo への実 publish そのものを巻き戻す不具合ではないが、local distribution plan の machine-readable contract が実配布先と食い違うため、L12/L13 の release boundary evidence として弱い。

## 是正

- `src/setup/index.ts`: Pack repo 既定値を `unison-ai-product/UT-TDD_AGENT-HARNESS-Pack` に定数化。
- `src/cli.ts`: `distribution plan --clean-repo` と `distribution package --clean-repo` の CLI default を Pack repo に変更。
- `tests/setup.test.ts`: `buildCleanDistributionPlan` の既定 `cleanRepo` と consumer `tagPin` を検証。
- `tests/cli-surface.test.ts`: CLI surface の `cleanRepo` と `tagPin` を検証。
- `docs/design/harness/L6-function-design/setup-solo-team.md`: clean distribution repo の正本を Pack repo と明記。
- `docs/plans/PLAN-L7-157-distribution-clean-pull.md`: 旧 repo default 除去を PLAN 証跡に記録。

## 検証

| command | result |
| --- | --- |
| `bun run typecheck` | pass |
| `bun run vitest run tests\setup.test.ts tests\distribution-acceptance.test.ts --reporter=dot` | pass: 2 files / 17 tests |
| `bun run lint` | pass |
| `bun src\cli.ts distribution plan --json` | pass: `cleanRepo=unison-ai-product/UT-TDD_AGENT-HARNESS-Pack`, `tagPin=github:unison-ai-product/UT-TDD_AGENT-HARNESS-Pack#77be7c3` |

## Digest rebind

Pack repo default correction で `src/cli.ts`、`src/setup/index.ts`、`tests/setup.test.ts`、`tests/cli-surface.test.ts` が変わったため、既存 PLAN の `green_commands.output_digest` が stale になった。hash-only restamp にしないため、上記 green 実行後に現 `evidence_path` SHA-256 へ再束ねした。

| item | count |
| --- | ---: |
| updated command entries | 100 |
| touched PLAN files | 51 |

後続確認として `doctor --strict-green-command-digest`、full `bun run test`、`db rebuild`、`doctor` を再実行して、strict close の最終証跡にする。
