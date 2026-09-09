---
memory_id: memory:feedback:pr-446-issue-444-terminal-gc-flag-remediation-0aeaee4a--c218bdfceebc
kind: feedback
title: "PR #446 Issue #444 terminal GC FLAG remediation 0aeaee4a"
tags: ["flag-remediation", "issue-444", "pr-446", "terminal-gc"]
updated_at: 2026-08-27T10:04:57.858Z
---

Current PR #446 exact HEAD 0aeaee4a1303722250a1f5bd7a46a24b0522a970 after the three Claude FLAG remediations. waitForClaudeMemory now caches pullRequestState by PR for one wake cycle, including missing observations, so repeated polls do not repeat synchronous gh calls. Terminal marker pruning is retention-bounded and removes only old orphan markers after inbox evidence is gone; retained inbox evidence and markers remain protected. U-MEMTERM-003 verifies dry-run/apply, retained inbox evidence, then old orphan cleanup. U-MEMTERM-004 reads actual terminal markers, asserts canonical receipt identity and summary pending exclusion, and proves one observation call for two entries sharing a PR. Node snapshot U-MEMTERM-001..004 4/4 Green, typecheck/lint/PLAN lint Green. GitHub Actions run 33060440245 Linux/Windows/aggregate 3/3 SUCCESS. Fresh non-author Claude canonical review must target this exact HEAD; older PR #446 request/receipt is stale and must not be reused. No merge performed.
