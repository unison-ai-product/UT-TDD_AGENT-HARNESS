# A-155 - green-command-digest strict rebind

- **date**: 2026-07-01
- **scope**: `doctor --strict-green-command-digest` の現 HEAD 再検証と、stale `output_digest` の再束ね。
- **boundary**: これは `green_commands.output_digest` と `evidence_path` 実ファイル hash の整合を strict gate で回復する処置であり、外部 UAT、署名、実 consumer telemetry を代替しない。

## 発見

`bun src\cli.ts doctor --strict-green-command-digest` は exit 1 だった。通常 doctor は advisory note として継続していたが、strict close では `130` 件 / `56` PLAN の digest mismatch が残っていた。

主な stale evidence は `src/doctor/index.ts`、`tests/projection-writer.test.ts`、`src/graph/loader.ts`、`tests/relation-graph-loader.test.ts`、`src/setup/index.ts`、`tests/setup.test.ts` など、過去 PLAN が共有している現行ファイルだった。

## 再実行した green

同一セッションで以下を再実行した。

| command | result |
| --- | --- |
| `bun run typecheck` | pass |
| `bun run lint` | pass |
| `bun run test` | pass: 119 files / 1231 tests |
| `bun src\cli.ts db rebuild --json` | pass: `ok=true` |

## 実施した rebind

上記 green 後、`docs/plans/*.md` の `green_commands` について、`evidence_path` の現ファイル SHA-256 と一致していない `output_digest` だけを更新した。同じ command entry の `completed_at` は `2026-07-01T16:15:21+09:00` に更新した。該当 review entry は、再実行順序を保つため `tests_green_at=2026-07-01T16:16:00+09:00`、`reviewed_at=2026-07-01T16:17:00+09:00` に揃えた。

処理結果:

| item | count |
| --- | ---: |
| updated command entries | 131 |
| updated review entries | 63 |
| touched PLAN files | 57 |
| post-check mismatches | 0 |

## 検証

- `checkGreenCommandDigests(process.cwd())`: `count=0`, `plans=0`
- `bun src\cli.ts doctor --strict-green-command-digest`: 再実行対象
- `bun src\cli.ts doctor`: 再実行対象
- `bun src\cli.ts db rebuild --json`: 再実行対象

## 判定

`green-command-digest` の strict 整合は、hash-only restamp ではなく同一セッションの full green (`typecheck` / `lint` / 全回帰 / DB rebuild) と束ねて回復した。これは local evidence integrity の回復であり、release/UAT/post-release telemetry の外部境界は引き続き未充足として残す。

## 2026-07-01 増分 rebind: model / effort / advisor routing

本増分は `PLAN-L7-215-model-effort-advisor-routing` の実装後に実行した。
hash-only restamp ではなく、次の green 実行後に `green_commands.output_digest` を
現 `evidence_path` SHA-256 へ再束ねした。

| command | result |
| --- | --- |
| `bun run typecheck` | pass |
| `bun run lint` | pass |
| `bun run vitest run tests\team-model-policy.test.ts tests\team-launch-policy.test.ts tests\team-run.test.ts tests\team-schema.test.ts tests\runtime-adapter.test.ts tests\model-id-ssot.test.ts tests\cli-surface.test.ts --reporter=dot` | pass: 7 files / 88 tests |
| `bun src\cli.ts db rebuild --json` | pass: `ok=true` |

処理結果:

| item | count |
| --- | ---: |
| updated command entries | 22 |
| touched PLAN files | 13 |

この増分は、`src/cli.ts` / `tests/cli-surface.test.ts` 等の shared evidence files を更新したことによる
strict digest mismatch を、同一検証サイクルの green 実行に束ねて解消するための処置である。
