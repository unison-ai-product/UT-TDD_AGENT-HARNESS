---
memory_id: memory:feedback:pr-520-ci-red-at-67f677b2-github-guard-commitlint-rejects-default-revert-reapply-subjects-preflight-r2-waits-for-rewritten-head--e58cb83bbca9
kind: feedback
title: "PR 520 CI red at 67f677b2 - github guard commitlint rejects default Revert/Reapply subjects; preflight r2 waits for rewritten head"
tags: ["ci", "issue-487", "pr-520", "review"]
updated_at: 2026-09-04T11:49:37.352Z
---

harness-check-linux run 33869521962 failed in github guard: 4 commitlint-invalid subjects (Git default Revert/Reapply quoting). Codex must rewrite subjects to Conventional Commits and force-push the unmerged branch. Opus r2 request at 67f677b2 discarded before execution. Lesson: git revert/reapply defaults are not Conventional; use revert: prefix or squash.
