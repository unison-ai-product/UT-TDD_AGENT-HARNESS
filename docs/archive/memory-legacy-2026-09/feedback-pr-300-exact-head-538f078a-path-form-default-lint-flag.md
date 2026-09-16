---
memory_id: memory:feedback:pr-300-exact-head-538f078a-path-form-default-lint-flag
kind: feedback
title: "PR #300 exact-head 538f078a path-form default lint FLAG 是正"
tags: ["cross-review", "exact-head", "plan-lint", "pr-300"]
updated_at: 2026-08-13T03:02:39.930Z
---

PR #300 の Claude FLAG (exact HEAD d47100f) を、既存ブランチの新HEAD `538f078a948ec6c7da0d48efb2199b0a16938d89` で是正した。

対応: `analyzePlanGovernance` に対象 docs と full PLAN corpus の context docs を分離する引数を追加し、path-form default lint は対象 PLAN だけを評価しつつ parent/requires/duplicate identity を全 `docs/plans/PLAN-*.md` から解決する。無関係な corpus violation は対象へ漏らさない。`--gate governance|frontmatter <path>` も同じ方式へ揃えた。`U-PLANLINT-002` で別ファイルの parent/requires 解決を回帰固定。

実測: `node src/cli.ts plan lint docs/plans/PLAN-L4-17-version-up-design-bottomup-band.md` EXIT=0。temporary parent/child fixture ok=true。先頭5 PLANを corpus=866 で対象別評価 failures=0。`npm run typecheck`、`bunx biome check src/plan/lint.ts tests/plan-lint.test.ts`、`git diff --check` は green。detached snapshot runner はこの環境で npm ci/DB rebuild が184秒制限を超えたため全Vitest完了証跡は未取得、CIで再確認する。

PR #300 は新HEADでCI実行中。Claudeへ exact-head non-author closing cross-review を再依頼する。FLAGが残る間はmergeしない。
