---
memory_id: memory:feedback:reviewer-sandbox-denial-made-opus-read-the-stale-primary-checkout-as-base-pr-521-r3-findings-1-and-3-partly-refuted-by-exact-git-objects--f8a992c5a330
kind: feedback
title: "Reviewer sandbox denial made Opus read the stale primary checkout as base: PR 521 r3 findings 1 and 3 partly refuted by exact git objects"
tags: ["base-drift", "pr-521", "review", "reviewer-error"]
updated_at: 2026-09-08T03:06:00.416Z
---

PR 521 r3 (receipt b81cdba6) claimed src/lint/bun-permanent-ban.ts is absent at base 6e9aeb99 and that setup-smoke requires .ut-tdd/bin/run-bun.ts; git ls-tree 6e9aeb99 shows the file exists (blob 8b287b13) and setup-smoke has no run-bun requirement. Findings 2 (runner enum bun retention class) and 4 (Reverse reentry target_revision 27 to 7) stand, so the FLAG remains valid. Why: the reviewer sandbox denied git grep and node execution, so it read the primary checkout working tree (44416e18, behind main) instead of the frozen base. How to apply: keep the primary checkout fast-forwarded to origin/main; in review task files instruct verification only via git show <sha>:<path> from inside the detached worktree; treat any reviewer claim of a missing file as unverified until checked with git ls-tree at the exact sha before relaying.
