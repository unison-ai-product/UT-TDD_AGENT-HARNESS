---
memory_id: memory:feedback:issue-444-terminal-gc-pr-446-rebase-and-wiring--3e38d003d7eb
kind: feedback
title: "Issue #444 terminal GC PR #446 rebase and wiring"
tags: ["issue-444", "pr-446", "terminal-gc", "verification"]
updated_at: 2026-08-27T08:58:00.000Z
---

PR #446 revised HEAD 6432c1f74de9cd5f263e2c41e60927c639832f8e on latest main c12184c22a3df234371111b94c6b7c70302080a5. Added typed terminal decision/marker/recovery, fail-closed gh PR observation at CLI hook and SessionStart, and canonical receipt retention. PLAN-REVERSE-600 is confirmed R3 with test_code and src/cli.ts generates; final non-author Claude canonical review remains required before merge. Node snapshot U-MEMTERM-001..004 4/4 passed, typecheck/lint/plan lint Green; test-repository-isolation inventory exact read=1 and latest CI Linux is Green, Windows still running (run 33056107712). No merge performed. Malformed canonical-identity-degraded inbox cases remain live and are a separate issue.
