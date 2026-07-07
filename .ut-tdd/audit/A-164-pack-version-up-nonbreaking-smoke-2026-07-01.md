# A-164 Pack version-up nonbreaking smoke

## 目的

Pack `v0.1.3` で導入済みの consumer repo に Pack `main` を当てても、既存 project の文面や managed files を無断で破壊しないことを確認する。

## 入力

- old Pack: `v0.1.3`
  - tag object: `a148fd304a455e21e631d4dab3c36d59725b1034`
  - checkout commit: `8550d1e320352499bc7d943b4b5b38a095dc4856`
- new Pack main: `abf623ff804ede9a73e216a5e124265e2afb7797`
- consumer seed:
  - `AGENTS.md` に `PRESERVE BEFORE VERSION UP`
  - `CLAUDE.md` に `PRESERVE CLAUDE BEFORE VERSION UP`
  - `package.json` に consumer project の `typecheck` / `test` script

## 実行

1. Pack `v0.1.3` を一時 clone し、`bun install --frozen-lockfile` を実行した。
2. Pack `main` を一時 clone し、`bun install --frozen-lockfile` を実行した。
3. consumer repo を一時作成し、既存 `AGENTS.md` / `CLAUDE.md` / `package.json` を commit した。
4. consumer repo で Pack `v0.1.3` の `src/cli.ts setup --solo` を実行し、生成物を commit した。
5. consumer repo で Pack `main` の `src/cli.ts setup --solo --dry-run` を実行した。
6. consumer repo で Pack `main` の `src/cli.ts setup --solo` を実行した。

## 結果

- `setup --dry-run` は書き込みなしで対象ファイル一覧を表示し、branch protection は `skipped (dry-run)`。
- Pack main の通常 `setup --solo` は既存 managed files へ上書き確認を出し、非対話の既定 No により上書きしなかった。
- 既存 `AGENTS.md` の `PRESERVE BEFORE VERSION UP` は保持された。
- 既存 `CLAUDE.md` の `PRESERVE CLAUDE BEFORE VERSION UP` は保持された。
- `git status --short` では `.ut-tdd/state/setup.json` の setup state 更新だけが残った。
- `bun .ut-tdd/bin/ut-tdd.mjs doctor --setup-smoke` は `setup-smoke - OK (checked=22, failed=0)`。
- `bun .ut-tdd/bin/ut-tdd.mjs status --json` は実行成功し、consumer 側では `nonTerminalPlansTotal=0` / `activeDraftTotal=0` / `openDefers=0`。

## 境界

これは local version-up smoke であり、PO-approved real consumer UAT、signed release artifact、post-release telemetry を代替しない。
