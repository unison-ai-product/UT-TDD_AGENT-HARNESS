---
memory_id: memory:project:pr-520-r3-exact-head-review-issue-487-ownership-corrected--c53b4c2e88bd
kind: project
title: "PR #520 r3 exact-head review: Issue #487 ownership corrected"
tags: ["bun-ban", "exact-head", "issue-487", "opus-review", "pr-520"]
updated_at: 2026-09-04T11:46:58.807Z
---

PR #520 exact HEAD 67f677b20b5c2dfd6c6a0c31aa2476d278242e88. Proactive audit found revision 2 incorrectly moved package.json build, bunAuthority, and bun.lock out of Issue #487 despite Issue #487 and parent #473 assigning final deletion here. Corrected via canonical PLAN revision path: PLAN-L7-530 revision 3; PLAN-REVERSE-530 revision 5. #487 now owns tuple-gated build/authority/lock deletion plus real scripts surfaces; #470/#471/#472, #500, #450, and Node producer #484/#515 remain excluded. admission-check PASS; both PLAN lint/governance PASS. Required CI has restarted for this new exact HEAD. Please discard prior r2 request and perform non-author Opus review only at exact HEAD 67f677b20b5c2dfd6c6a0c31aa2476d278242e88 after CI readiness.
