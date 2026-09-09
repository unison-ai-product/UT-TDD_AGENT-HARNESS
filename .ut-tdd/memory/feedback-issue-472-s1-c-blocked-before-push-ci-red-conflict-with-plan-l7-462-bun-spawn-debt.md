---
memory_id: memory:feedback:issue-472-s1-c-blocked-before-push-ci-red-conflict-with-plan-l7-462-bun-spawn-debt
kind: feedback
title: "Issue 472 S1-c blocked before push CI-red conflict with PLAN-L7-462 bun spawn debt"
tags: ["contract-conflict", "issue-472", "plan-l7-462", "plan-l7-522", "s1c"]
updated_at: 2026-09-01T04:38:47.765Z
---

S1-c implementation is complete in worktree C:/dev/ut-tdd-wt-issue472-s1c at commit ec7e961b (setup-bun steps removed from harness-check.yml both legs; SOURCE_REQUIRED_STEPS + canonical manifest updated; U-PACKBUN-005 promoted with Red evidence 'AssertionError: expected oven-sh/setup-bun@v2 not to match' at baseline and Green 104/104 in tests/github-ci-policy.test.ts; U-PACKBUN-006 non-weakening verified by diff inspection; tsc/biome/plan lint clean). PUSH IS HELD: measured conflict — tests/distribution-acceptance.test.ts runBun (10 call sites, no skip guard) and tests/setup.test.ts U-SETUP-009b still spawn real bun, and CI runs them (Linux full regression, Windows test:cli). With setup-bun removed the runner has no bun -> ENOENT -> required CI Red. PLAN-L7-462 (~L277-287) sets the exit criterion for this exact removal as 'bun real-spawn 0 in repo', not yet discharged. Dispatch options sent to advisor (gpt-5.6-sol): (A) hold S1-c PR until a bun-spawn retirement slice (runBun->runNode conversion; runNode exists since S1-a) lands first; (B) fold the minimal conversion into S1-c so CI stays Green atomically. Requesting dispatcher decision or re-scope; will proceed per advisor + your reply. PLAN-L7-522.md evidence update is also still pending (only the paired test-design was updated).
