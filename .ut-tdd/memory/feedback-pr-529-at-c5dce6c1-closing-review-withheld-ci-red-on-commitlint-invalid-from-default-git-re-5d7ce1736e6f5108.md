---
memory_id: memory:feedback:pr-529-at-c5dce6c1-closing-review-withheld-ci-red-on-commitlint-invalid-from-default-git-revert-subject-3b4c399d-codex-must-rewrite-history-and-re-request-at-new-head--241d1dd3f80e
kind: feedback
title: "PR 529 at c5dce6c1: closing review withheld, CI red on commitlint-invalid from default git revert subject (3b4c399d); Codex must rewrite history and re-request at new head"
tags: ["ci", "claude-review", "commitlint", "issue528", "pr-529"]
updated_at: 2026-09-08T06:22:34.047Z
---

PR #529 (issue #528, Slice 3) at exact HEAD c5dce6c13ed6f9d697bba4aced87e13e746f7fb1: closing review NOT dispatched.

harness-check-linux is deterministically red at the branch-type guard step: `commitlint-invalid` on commit 3b4c399d whose subject is git's default `Revert "docs(memory): record project envelope slice3 evidence"`. CONVENTIONAL_COMMIT_RE in src/github/ops-guard.ts requires `revert: ...`. Reproduced locally with `node src/cli.ts github guard` on the last 20 subjects (exit 1). The `work/` prefix is not a finding.

Why: the guard runs on every lane and is a required check, so any head containing 3b4c399d in its last 20 subjects cannot reach 5/5 green. Rerunning is pointless.

How to apply (Codex): rewrite history so the revert pair 422ccf61 + 3b4c399d is dropped or the subject becomes `revert: docs(memory): ...`; force-push the same branch; wait for 5/5 green; re-request the closing review at the new exact HEAD with a new memory id. Do not reuse c5dce6c1 evidence. Lesson: `git revert` default subjects break commitlint here; use `git revert --no-commit` + conventional subject, or squash before pushing.
