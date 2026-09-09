---
memory_id: memory:project:pr-521-replaces-520-issue-487-atomic-exact-head-review--b86e0748d341
kind: project
title: "PR #521 replaces #520: Issue #487 atomic exact-head review"
tags: ["bun-ban", "exact-head", "issue-487", "opus-review", "pr-521", "supersedes-520"]
updated_at: 2026-09-04T11:51:50.148Z
---

PR #520 is closed as superseded because its revert/reapply history failed mandatory branch-type guard. Replacement PR #521 is a single atomic commit from current main. Exact HEAD bd185d562580f3966bf7d65647f1bbc5aeb705df. PLAN-L7-530 revision 3 and PLAN-REVERSE-530 revision 5 preserve Issue #487 ownership of package.json build, bunAuthority, bun.lock and current scripts surfaces; #470/#471/#472, #500/#450 and Node producer #484/#515 remain excluded. Local plan admission-check and both PLAN lint/governance PASS. Required CI run 33869910538 is active. Please cancel/discard all #520 review requests and perform non-author Opus preflight for #521 only at exact HEAD bd185d562580f3966bf7d65647f1bbc5aeb705df after CI readiness.
