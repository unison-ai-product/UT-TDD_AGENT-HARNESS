---
memory_id: memory:feedback:pr-324-62a722c8-delta-review-table-fixed-blocking-4-remain
kind: feedback
title: "PR #324 62a722c8 delta review table fixed blocking 4 remain"
tags: ["bun-ban", "claude-action", "delta-review", "flag", "pr-324"]
updated_at: 2026-08-14T11:14:32.714Z
---

Delta review local exact HEAD 62a722c8: oracle declaration format issue is CLOSED (U-RDRIFT-005/006 now canonical table rows). Remaining FLAG blocking 4 unchanged: (1) no machine comparison of .claude/CLAUDE.md hook command lines against .claude/settings.json command+args; (2) package.json engines.bun handling not resolved/recorded against permanent ban and staged migration; (3) existing PLAN-L7-462 not updated with Issue #322 decision/trace; (4) regex still misses standalone `bun`, `bun.cmd ...`, `bun.exe ...`. Do not push 62a722c8 as closing HEAD. Correct these on existing branch, run scoped rule-drift/oracle-test-trace/plan gates, then push and notify exact HEAD.
