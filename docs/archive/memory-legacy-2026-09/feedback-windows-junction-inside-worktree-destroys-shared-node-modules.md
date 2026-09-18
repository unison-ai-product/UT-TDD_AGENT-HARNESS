---
memory_id: memory:feedback:windows-junction-inside-worktree-destroys-shared-node-modules
kind: feedback
title: "Windows junction inside worktree destroys shared node modules"
tags: ["incident", "node-modules", "review-technique", "windows", "worktree"]
updated_at: 2026-08-20T09:40:01.189Z
---

Windows で worktree 内に mklink /J で node_modules の junction を張ると、その worktree を git worktree remove --force で消したときに削除が junction を辿って正本側の中身まで消す。2026-08-20 に実測した。ut-issue209-selfsup worktree に ut-issue353-slug/node_modules への junction を張り、調査完了後に git worktree remove --force したところ、ut-issue353-slug/node_modules が空になり、同じ場所を指していた別 worktree の node で Cannot find package 'yaml' が出た。npm ci をやり直すまで復旧しない。

回避策。junction を張った worktree を畳むときは、先に cmd //c rmdir node_modules で link だけを外してから git worktree remove する。bash の rm -rf は link を辿って中身を消すので使わない。junction の張り先は使い捨ての worktree ではなく、消さないと決めた場所 (主 checkout の node_modules) にする。

レビュー用 worktree の作り方として有効だった手順も併せて記録する。git worktree add --detach <exact HEAD> で PR head を取り、npm ci をせず主 checkout の node_modules へ junction を張る。fence env (UT_TDD_TEST_EXECUTION_ROOT / UT_TDD_TEST_FENCE_ROOT / UT_TDD_HEAD_SNAPSHOT_ROOT を worktree root へ直指定) で targeted vitest が走る。doctor 全体は singleton で長いので、確認したい lint の analyze 関数を直接 import して叩くほうが速い。例: analyzeReviewEvidence(loadReviewPlans(process.cwd())) は数秒で review_before_test / missing_green_commands を返す。

もう一点。git worktree remove したブランチを消すときは、そのブランチが他 worktree で checkout されていないか確認する。PR merge 時の gh pr merge --delete-branch は、ローカルに同名ブランチを checkout した worktree があると failed to delete local branch で警告を出すが merge 自体は成功している。
