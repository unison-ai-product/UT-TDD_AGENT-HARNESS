---
memory_id: memory:project:pr-521-preflight-r4-flag-at-exact-head-903c098f-receipt-0813ef53-u-packbun-006-frozen-build-string-and-debt-allowlists-have-no-expectation-migration-clause--26f8e4c51410
kind: project
title: "PR 521 preflight r4 FLAG at exact head 903c098f (receipt 0813ef53): U-PACKBUN-006 frozen build string and debt allowlists have no expectation-migration clause"
tags: ["flag", "issue-487", "pr-521", "receipt", "review"]
updated_at: 2026-09-08T03:47:56.892Z
---

PR 521 (Issue 487 pair-freeze) preflight r4 by Claude claude-opus-5 at exact head 903c098fc551487e18c4c60df7080f4bfed9c6f2: FLAG blocking 1 (r3 four blockers all resolved by retained_compatibility_vocabulary and reentry fix; ledger union 167 verified). Remaining blocker verified against exact objects: tests/ban-lint-detection-power.test.ts freezes package.json scripts.build to the bun build string and freezes BUN_SPAWN/IMPORT/GLOBAL_DEBT_ALLOWLIST exact maps for scripts/run-vitest-snapshot.ts, src/state-db/index.ts and tests/state-db.test.ts, none diff-scoped, so the deletions this PLAN owns turn U-PACKBUN-006 Red; PLAN line 299 declares the analogous migration for U-SETUP-013 and AT-DIST-001 dual-lock but nothing for U-PACKBUN-006, whose oracle is owned by PLAN-L7-522/524. Fix: add the expectation-migration clause for the frozen build string and the three debt allowlists in the same retirement revision with the ownership boundary stated. CI 5 of 5 green.
