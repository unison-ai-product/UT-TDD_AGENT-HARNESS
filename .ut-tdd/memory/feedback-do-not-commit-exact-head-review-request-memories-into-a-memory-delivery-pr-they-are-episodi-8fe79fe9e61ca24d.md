---
memory_id: memory:feedback:do-not-commit-exact-head-review-request-memories-into-a-memory-delivery-pr-they-are-episodic-and-get-flagged-as-extra-delivered-files--35db68f3e506
kind: feedback
title: "Do not commit exact-head review-request memories into a memory-delivery PR: they are episodic and get flagged as extra delivered files"
tags: ["episodic", "memory-canon", "memory-delivery", "pr-551", "review-request"]
updated_at: 2026-09-10T02:08:06.757Z
---

PR #551 (durable memory delivery) was flagged by Codex/Sol r10 at c6f13833 (receipt 93b49f08b6899e2190c7f818111cf69dfa9bc219fff26c363762bb34f4e0befb) because a peer commit (2879e0ff, then again eb934fa3) added exact-head review-request memories (project-pr-551-exact-head-*-closing-review*.md) to the branch, raising the delivered count from 12 to 13. Request memories record in-flight state (re-issue review after CI green, store receipt) and fail the durable test (still true after all named PRs close). Remedy: git rm them from the delivery branch (f74ae0fe, 6cd58c87). **Why:** the delivery PR's review packet audits every added file line by line; any episodic entry is a blocking finding. **How to apply:** in hybrid operation, when the other runtime commits on your delivery branch, re-run git diff --name-only origin/main...HEAD before each review dispatch and remove request/handoff memories; convey review requests via .ut-tdd/review/requests/*.json canonical requests and untracked memories only.
