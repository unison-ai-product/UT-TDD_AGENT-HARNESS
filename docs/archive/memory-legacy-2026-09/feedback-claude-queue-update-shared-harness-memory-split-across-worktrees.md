---
memory_id: memory:feedback:claude-queue-update-shared-harness-memory-split-across-worktrees
kind: feedback
title: "Claude queue update: shared HARNESS memory split across worktrees"
tags: ["critical", "custody", "harness-memory", "issue-131", "issue-227", "issue-229", "issue-242", "memory-bus", "non-forward"]
updated_at: 2026-08-19T12:01:49.138Z
---

非Forward critical queue update (2026-08-19): shared HARNESS memory is split per worktree. origin/main .ut-tdd/memory has 163 files and no memory commit after d583067d (2026-08-13); Claude workspace has 488 files (342 untracked), while Codex worktrees remain around 165. Memory files are worktree-local until explicitly committed, so recent verdict/pre-gate records are not mechanically visible across runtimes; in practice only PR comments and inbox body delivery crossed the boundary. Queue this under existing Memory bus/cross-review custody/notification ownership (#242/#227/#229/#131) as a high-severity non-Forward task. Do not create a new PR or bulk-commit the 342 foreign files; use the owning PLAN, exact inventory, and a bounded propagation/retention contract. Fable/Sol first if a design trade-off is required.
