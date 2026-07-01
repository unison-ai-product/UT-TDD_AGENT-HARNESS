# A-165 Pack-safe test surface sync

- **date**: 2026-07-01
- **source commit**: `5b819e8 fix: use pack-safe test script in clean export`
- **Pack commit**: `cda1656 chore: sync clean pack 5b819e8`
- **source CI**: `28516994517` success
- **Pack CI**: `28517083924` success

## 背景

Pack で `bun run test` を実行したところ、source-only の `docs/plans`、`docs/design`、`.ut-tdd`、root adapter docs を前提にする実 repo 回帰テストが落ちた。Pack はそれらを意図的に含めないため、Pack の既定 `test` が source 全量テストを向くこと自体が境界違反だった。

## 是正

`transformCleanDistributionArtifact("package.json", ...)` を追加し、clean export / `sync-stage` / `sync-pack` / package の `package.json` materialize 時だけ `scripts.test` と `scripts["test:pack"]` を Pack-safe smoke へ差し替え、元の full source test を `test:source` として保持する。source repo の `package.json` 自体は変えない。

Pack-safe smoke は次の source/Pack 両方で成立するテストに限定する。

- `tests/setup.test.ts`
- `tests/distribution-acceptance.test.ts`
- `tests/skill-recommend.test.ts`
- `tests/skill-scaffold.test.ts`
- `tests/dependency-drift.test.ts`
- `tests/readability.test.ts`

## 検証

Source:

- `bun run typecheck`: pass
- `bun run vitest run tests\setup.test.ts tests\distribution-acceptance.test.ts tests\cli-surface.test.ts -t "Pack|clean distribution|distribution" --reporter=dot`: pass (3 files, 11 passed / 39 skipped)
- `bun run lint -- src\cli.ts src\setup\index.ts tests\setup.test.ts tests\distribution-acceptance.test.ts`: pass
- Source CI `28516994517`: pass

Pack:

- `sync-pack --tag 5b819e8`: copied `428`, unmanaged `0`
- `package.json` `scripts.test`: `vitest run tests/setup.test.ts tests/distribution-acceptance.test.ts tests/skill-recommend.test.ts tests/skill-scaffold.test.ts tests/dependency-drift.test.ts tests/readability.test.ts --reporter=dot`
- `package.json` `scripts["test:source"]`: `vitest run`
- `bun run test`: pass (6 files / 56 tests)
- `bun run typecheck`: pass
- `bun run lint`: pass
- Pack CI `28517083924`: pass

## 境界

これは Pack のローカル / CI 自己完結性証跡であり、署名 tarball publish、PO UAT、post-release telemetry は引き続き外部 / 人間境界である。
