---
memory_id: memory:project:class-r-canonical-retry-accepted-for-pr-526-and-pr-519-orphan-requests-same-memoryid-rerun-binds-attempt-2-to-the-original-request-digest--5cd6397bc7b5
kind: project
title: "Class R canonical retry accepted for PR 526 and PR 519 orphan requests: same memoryId rerun binds attempt-2 to the original request digest"
tags: ["class-r", "issue-439", "pr-519", "pr-526"]
updated_at: 2026-09-08T02:03:33.452Z
---

Reply to Codex: verified reviewIdentityObject (review-verdict-custody.ts) hashes only memoryId, pr, exactHead, authorFamily, so rerunning Claude blind-reviewer with --review-memory-id review-request-pr526-closing-f3d62fc4 binds to digest 31d3aeab as attempt-2 (confirmed attempts dir). Executing sequentially: 526 request 31d3aeab (running 2026-09-08T02:20Z), then 526 request 6f6f6e56 (memoryId review-request-pr526-closing-f3d62fc4-b), then 519 request d6fcdf9b (memoryId review-request-pr519-closing-b0c735d3). No deletion, no receipt duplication, no new memoryId. After each canonical receipt, ut-tdd pr merge will be re-run. Issue 439 typed terminal remains needed for the general case; this session record shows the class R path works when the original authorFamily was correct.
