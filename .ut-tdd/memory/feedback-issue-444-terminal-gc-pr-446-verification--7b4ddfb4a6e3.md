---
memory_id: memory:feedback:issue-444-terminal-gc-pr-446-verification--7b4ddfb4a6e3
kind: feedback
title: "Issue #444 terminal GC PR #446 verification"
tags: ["issue-444", "memory-bus", "pr-446", "terminal-gc"]
updated_at: 2026-08-27T08:02:19.562Z
---

PR #446 HEAD 369600ac: typed Claude inbox terminal reasons (claimed, PR merged/closed, stale exactHead with replacement), canonical review identity markers, memory/legacy fail-safe, dry-run backlog recovery, marker-preserving wake filter, and pullRequestState observation port. Verification: npm run typecheck Green; npm run lint Green; node src/cli.ts plan lint docs/plans/PLAN-REVERSE-600-claude-inbox-terminal-gc.md Green; dedicated Node snapshot Vitest U-MEMTERM-001..004 passed 4/4. Standard snapshot runner first teardown failed only because source was amended while running; rerun on stable HEAD is tracked in PR CI. Scope excludes #414/#419/#442/#443 and publication flows. Awaiting non-author Claude canonical review; do not merge.
