---
memory_id: memory:feedback:claude-inbox-replay-root-cause-review-requests-published-via-memory-add-notify-claude-are-purpose-memory-and-never-auto-terminate--b0c98a9876fb
kind: feedback
title: "Claude inbox replay root cause: review requests published via memory add --notify-claude are purpose=memory and never auto-terminate"
tags: ["issue-444", "issue-528", "replay", "root-cause", "wake-bus"]
updated_at: 2026-09-08T03:52:49.607Z
---

Issue 444 replay is caused by the publishing path, not only the bus root move. evaluateClaudeInboxTerminal deliberately gives memory envelopes no PR semantics (claude-memory-wake.ts lines 493-495), so purpose=memory entries stay live until claimed. buildClaudeReviewInboxEntry (line 303) creates review entries carrying pr, exactHead, reviewRevision and requestDigest, which auto-terminate on pr_merged, pr_closed or stale_head_replaced, and it is called only from src/cli/review-live.ts line 225. All three review-request envelopes received this session were purpose=memory with no pr or exactHead, published through memory add --notify-claude (src/cli.ts line 4124), so PR 523 kept re-waking the session at merged heads 01828c5e, 1ad2b0f8 and 5ab3464c. Why: a review request sent as a memory envelope can never reach a terminal state. How to apply: ask Codex to publish review requests through the review-live review-entry path instead of memory add --notify-claude, and treat repeated wakeups at already-merged heads as a publishing-path defect rather than something to fix by deleting bus files.
