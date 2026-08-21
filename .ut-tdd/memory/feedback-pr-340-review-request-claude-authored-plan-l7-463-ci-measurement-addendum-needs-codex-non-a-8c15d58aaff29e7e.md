---
memory_id: memory:feedback:pr-340-review-request-claude-authored-plan-l7-463-ci-measurement-addendum-needs-codex-non-author-closing-review
kind: feedback
title: "PR 340 review request: Claude-authored PLAN-L7-463 CI measurement addendum needs Codex non-author closing review"
tags: ["cross-agent", "issue-98", "plan-l7-463", "pr-340", "review-request"]
updated_at: 2026-08-19T08:39:02.926Z
---

PR #340 (docs(plan): PLAN-L7-463 へ CI 面の固定費実測を追記、issue #98) exact HEAD 1fef9f074cd823bb2cbf46c4cf8d97405380cd9e。**author = Claude** なので closing review は Codex 側 frontier tier に依頼する (cross_agent 分離)。

内容: docs 1 ファイルのみ。PLAN-L7-463 (snapshot runner 固定費の HEAD キャッシュ化) の draft へ GitHub CI 面の実測を追記した。既存の背景節はローカル targeted 実行の実測 (2026-07-28) だけで CI 律速との関係が未記録だった。

追記した実測 (run 32224421060、PR #338 exact HEAD 8f0f41e6、3 job SUCCESS、job step API より): harness-check-linux 464s = vitest 317s (68%) / doctor 93s / db rebuild 18s。harness-check-windows 845s = vitest 776s (92%) で CI wall clock の律速。ファイル別 (Windows leg) は tests/global-setup-fence.test.ts 180.4s (テスト 1 個)、cli-surface.test.ts 161.2s (54 tests)、forward-escape-issue-contract.test.ts 153.9s (17 tests)、db-currency.test.ts 112.5s (31 tests) で上位 4 件が 608s = Windows vitest の 78%。

最大単一要因は入れ子 snapshot の固定費。global-setup-fence.test.ts は 21 行・テスト 1 個で本体は spawnSync(node, ["scripts/run-vitest-snapshot.ts", ...]) の exit status と 1 行照合のみであり、180.4s は全部 snapshot runner の固定費。PLAN 背景の「targeted 2 ファイルでも 17〜25s (本体 <1s)」と同じ構造が Windows CI では 1 テスト 180s に拡大している。

doc lane の判断も記録した: PLAN-L7-455 phase1 の lane 分岐は landed 済みだが DOC_LANE_PREFIXES (src/github/change-lane.ts:31) は docs/archive|migration|reference|research の 4 prefix のみで docs/plans/ を含まず、2026-08-19 merge の 4 PR は 0/4 が doc lane。docs のみの #336 (Linux 7m49s) とコード変更の #338 (7m44s) に差がない。ただし allowlist 拡大は採らない — #338 の CI 赤 duplicate-artifact-ownership は full doctor 側のゲートで、doc lane に落とすと素通りしていた。

AC-1b を追加し CI 面の before/after を run 単位実測で引用させる (prose 断定禁止)。status は draft のまま、generates は PLAN doc 1 件のみ (既存ファイル未宣言)。

依頼: claim-blind / spec-blind の closing review。特に (a) 実測値の出典と再現可能性、(b) doc lane 拡大を採らない判断の妥当性、(c) AC-1b が prose 主張でなく実測引用を強制する形になっているか、を攻撃してほしい。merge は Claude 側で行う。
