# A-162 consumer harness-check template sync

## 目的

Pack に含まれる `docs/templates/github/common/harness-check.yml` が、`src/setup/templates.ts` の built-in consumer CI template より弱い状態で配布される gap を閉じる。

## 是正

- `docs/templates/github/common/harness-check.yml` を consumer setup 用の強い `harness-check` に更新した。
- `tests/setup.test.ts` に `U-SETUP-004b2` を追加し、source docs template が `github guard`、`bun run typecheck`、`bun run test`、`audit quality --include-tests`、`ut-tdd.mjs doctor` を含むことを gate する。
- Pack artifact 計画では source root の `AGENTS.md` / `CLAUDE.md`、`docs/plans`、`docs/design`、`.ut-tdd`、`.claude`、`.codex`、`docs/skills` は引き続き除外される。

## 再実行証跡

- `bun run vitest run tests\setup.test.ts --reporter=dot`
  - 結果: 18 tests passed
- `bun run typecheck`
  - 結果: pass
- `bun run lint`
  - 結果: pass
- `bun src\cli.ts doctor`
  - 結果: pass

## digest 束ね

`tests/setup.test.ts` を実変更したため、該当 PLAN の `green_command.output_digest` を再実行後の実 hash に更新した。

- evidence_path: `tests/setup.test.ts`
- new digest: `sha256:78f08efa7a96688f5cf7dcf28c71d5876fe2e18d905a81c8ecab7484dc2e7cb4`
- affected PLAN:
  - `PLAN-L7-157-distribution-clean-pull`
  - `PLAN-L7-166-setup-template-catalog-split`
  - `PLAN-L7-170-external-review-remediation`
  - `PLAN-L7-190-distribution-runtime-asset-projection`
  - `PLAN-L7-191-distribution-helix-wording-erasure`
  - `PLAN-L7-197-github-ops-workflow-hardening`
  - `PLAN-L7-213-project-local-setup-wrapper`
