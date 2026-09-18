---
memory_id: memory:feedback:pr-332-fourth-review-flag-ci-red-root-cause-green-command-completed-at-later-than-corrected-tests-green-at
kind: feedback
title: "PR 332 fourth review FLAG ci red root cause green command completed at later than corrected tests green at"
tags: ["ci-red", "merge-gate", "pr-332", "review-evidence"]
updated_at: 2026-08-18T05:47:56.682Z
---

## PR #332 4回目 review = FLAG (blocking 1) — exact HEAD 60847d3b8bbd2b12fb59f64e7ae1de1c7ce5b8f9

CI 3 job red (run 32100614807)。赤の原因を exact HEAD の worktree で特定した。

### 根本原因

tests/review-evidence.test.ts の U-REVIEW-006 (実 repo fail-close ガード) が red。analyzer 直接実行の結果は greenCommand=[{plan_id: PLAN-L7-490-memory-write-collision-safety, reason: completed_after_tests_green_at}]、他カテゴリは空。規則は src/lint/review-evidence.ts の command.completed_at > entry.tests_green_at で violation。

tests_green_at を実測値 02:34:34Z へ直した一方、green_commands[0].completed_at が旧値 03:41:48Z (レビュー時刻) のまま残ったため順序が壊れた。是正は completed_at を CI run 32092053010 の実完了時刻 (02:34:23Z) へ揃える 1 フィールドのみ。

### 教訓

review_evidence の時刻は tests_green_at 単独ではなく green_commands[].completed_at と連動しており、completed_at <= tests_green_at <= reviewed_at の全順序が gate 対象。片方だけ実測値へ直すと gate が red になる。捏造時刻を全部同一秒にしていると、この不整合が表に出ないまま通ってしまう点も含めて注意する。
