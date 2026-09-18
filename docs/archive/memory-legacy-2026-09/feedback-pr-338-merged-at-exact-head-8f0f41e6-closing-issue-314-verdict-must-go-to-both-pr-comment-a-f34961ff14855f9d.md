---
memory_id: memory:feedback:pr-338-merged-at-exact-head-8f0f41e6-closing-issue-314-verdict-must-go-to-both-pr-comment-and-shared-memory-or-codex-stalls
kind: feedback
title: "PR 338 merged at exact head 8f0f41e6 closing issue 314; verdict must go to both PR comment and shared memory or Codex stalls"
tags: ["handoff", "issue-314", "merge", "plan-l7-455", "pr-338", "verdict-delivery"]
updated_at: 2026-08-19T07:02:23.490Z
---

PR #338 (issue #314 / PLAN-L7-455 doctor profile outputIds) を exact HEAD 8f0f41e6c452e3271e0db313659f10e3854bd27c で squash merge した。merge commit 015485a8a4eeb0e4b61b119d383832816463cca5、2026-08-19T07:01:32Z。issue #314 は Closes キーワードで自動 close された (CLOSED を確認)。

満たしたゲート: Claude non-author closing verdict PASS (blocking 0)、CI run 32224421060 で harness-check / linux / windows 3/3 SUCCESS、mergeable CLEAN、draft 解除済み、--match-head-commit で exact HEAD に pin。

収束の経緯 (4 HEAD): 7850143b は duplicate-artifact-ownership + callsite-drift の 2 違反で赤。2028ab73 は前者だけ是正して赤継続。84a81563 は blocking 3 件を解消したが、順序是正の際に collectDoctorCheckRun から選択集合の引数を落としたため doc lane が 102 検査を実走する回帰を新たに入れた (envelope は 4 件のまま = コスト満額・見た目だけ削減)。8f0f41e6 で .filter(d => outputIdSet.has(d.id)) を足して実行集合を宣言 4 件へ戻し収束。

運用上の実測された停止点 (重要): 84a81563 の FLAG を PR コメントにしか書かず共有 Memory へ書かなかったため、Codex は verdict 待ちで同一 exact HEAD のまま 24 分停止した。Memory へ書いた直後に Codex が拾い 1 分で是正 push した。**Claude の verdict は PR コメントと共有 Memory の両方へ必ず出す**。配送面の欠落は指摘内容の質と無関係にループを止める。

もう 1 つの停止要因: FLAG を返すだけで最小是正を示さない期間はサイクルが往復した。両立解が非自明な場合 (今回は doc lane の宣言順と registry 定義順が実際に食い違い、どちらに倒しても片方のテストが赤になる構造だった) は、レビュー側が実測付きで最小是正コードを出すと 1 サイクルで収束する。

残 advisory (別 PR 候補、merge 阻害ではない): package.json の test:fast が --exclude tests/doctor.test.ts を含み、harness-check.yml の Windows leg (L219) がその test:fast を走らせるため、tests/doctor.test.ts の回帰は Windows 面では検出されない。今回の一連の回帰はこの死角に潜んだ。

auto-merge はこのリポジトリでは無効 (enablePullRequestAutoMerge 不許可)。CI green を確認してから手動 merge する運用になる。
