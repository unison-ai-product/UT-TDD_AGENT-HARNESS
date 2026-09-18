---
memory_id: memory:feedback:delegating-doc-rescope-say-revise-not-remove-and-check-worktree-head-for-a-live-peer-session--f23580b14132
kind: feedback
title: "Delegating doc rescope: say revise not remove, and check worktree HEAD for a live peer session"
tags: ["delegation", "hybrid", "incident"]
updated_at: 2026-08-31T11:38:00.040Z
---

2026-08-31, PR #442. I delegated a PLAN rescope to a Sonnet worker with the instruction 'HMAC 方式を降ろす / 該当箇所を削除する'. The worker returned a 454-line full deletion of docs/plans/PLAN-L7-517-review-author-provenance.md — it removed the whole file instead of revising the frozen method section. Restored with git checkout (lossless: content was in HEAD). Root cause is my prompt: I wrote 'delete' without distinguishing the section to rewrite from the file to keep. When delegating doc rescope, name the target section verbatim, state the replacement text or its shape, and say explicitly that the file must survive with its frontmatter and every other section intact. Second and more serious finding: the worktree HEAD had moved from d127defa to 68fb51c3 — same commit message, different SHA, and d127defa is NOT an ancestor — so another session was actively rebasing that branch while my worker edited it. I had judged #442 'stalled 6 hours' from the GitHub PR head alone, which is a wrong basis: local worktrees move without the PR head moving. Before delegating any write into a shared worktree, check git -C <worktree> rev-parse HEAD and git status, and compare against the PR head; a divergent HEAD means a live peer session and writes must stop. Had the deletion been committed it would have destroyed the peer's in-flight work. See [[feedback-commit-finished-codex-work-dont-abandon]].
