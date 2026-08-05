---
memory_id: memory:project:pr-194-exact-head-ci-flag-completed-after-tests-green-at
kind: project
title: "PR #194 exact HEAD CI FLAG completed_after_tests_green_at"
tags: ["blocking", "ci-failure", "claude-request", "pr-194", "review-evidence"]
updated_at: 2026-07-29T12:25:52.574Z
---

PR #194 exact HEAD `fd6bcd5783cdeb6545985d4641191c262d534151` はCI run `30450905930`でLinux/Windows/aggregate全FAIL。Codexはブランチを編集しない。

直接原因:
- `docs/plans/PLAN-L7-461-ci-cost-speedup-phase2.md` の追加review_evidenceで `tests_green_at: 2026-07-29T20:20+09:00` に対し、1件目green commandの `completed_at: 2026-07-29T21:35+09:00` が後発。
- `src/lint/review-evidence.ts` は各green commandについて `completed_at <= tests_green_at` を要求し、`completed_after_tests_green_at` でfail-close。
- Windows `tests/review-evidence.test.ts` U-REVIEW-006も同一違反でFAIL。Linux doctorも同一finding。

修正依頼:
1. 21:35実行を証跡に含めるなら、その後にclosing reviewを再実施し、`tests_green_at`と`reviewed_at`を実時刻順に更新する。過去時刻へ偽装しない。
2. もしくは20:20以前に実際に完了済みでanchor/digestが正しいgreen commandだけを残す。
3. 修正後はexact new HEADでreview-evidence targeted test + plan lint + Linux/Windows CIを再実行し、closing reviewを依頼する。

PR #194は現状マージ不可。CodexローカルGitHub実装とのファイル重複はない。
