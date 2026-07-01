# A-163 Pack main brownfield setup smoke

## 目的

Pack `main` の clean artifact が、既存 `AGENTS.md` / `CLAUDE.md` を持つ実装中 project に対して、既存文面を破壊せずに UT-TDD adapter / hook / subagent / command / CI を導入できることをローカル実 smoke で確認する。

## 入力

- Pack repo: `unison-ai-product/UT-TDD_AGENT-HARNESS-Pack`
- Pack main: `abf623ff804ede9a73e216a5e124265e2afb7797`
- Pack CI: `28514887066` passed
- consumer seed:
  - `AGENTS.md` に `DO NOT REMOVE CONSUMER LINE`
  - `CLAUDE.md` に `KEEP EXISTING CLAUDE LINE`
  - `package.json` に consumer project の `typecheck` / `test` script

## 実行

1. Pack main を一時 clone した。
2. Pack clone で `bun install --frozen-lockfile` を実行した。
3. consumer repo を一時作成し、既存 `AGENTS.md` / `CLAUDE.md` / `package.json` を commit した。
4. consumer repo を cwd にして Pack clone の `src/cli.ts setup --solo` を実行した。
5. consumer repo の `.ut-tdd/bin/ut-tdd.mjs doctor --setup-smoke` を実行した。
6. 同じ `setup --solo` を再実行し、既存 managed files に対する上書き確認が出ること、既定 No で破壊的上書きをしないことを確認した。

## 結果

- 既存 `AGENTS.md` の `DO NOT REMOVE CONSUMER LINE` は保持された。
- 既存 `CLAUDE.md` の `KEEP EXISTING CLAUDE LINE` は保持された。
- `AGENTS.md` / `CLAUDE.md` には `<!-- UT-TDD:managed:start -->` から `<!-- UT-TDD:managed:end -->` までの managed block が追加された。
- `.claude/settings.json`、`.codex/hooks.json`、Claude subagent、Claude command、`.ut-tdd/bin/ut-tdd.mjs`、`.github/workflows/harness-check.yml` が生成された。
- consumer `harness-check.yml` には `github guard`、`bun run typecheck`、`bun run test`、`audit quality --include-tests`、`ut-tdd.mjs doctor` が含まれた。
- `bun .ut-tdd/bin/ut-tdd.mjs doctor --setup-smoke` は `setup-smoke - OK (checked=22, failed=0)`。
- `bun .ut-tdd/bin/ut-tdd.mjs status --json` は wrapper 経由で実行でき、consumer 側では `nonTerminalPlansTotal=0` / `activeDraftTotal=0` / `openDefers=0`。

## 境界

これは local brownfield smoke であり、PO UAT、実 consumer project での受入、post-release telemetry を代替しない。
