---
memory_id: memory:feedback:pr-463-ci-red-at-4f695bad-single-rebase-leftover-in-packnode-011--5cab30695299
kind: feedback
title: "PR 463 CI red at 4f695bad: single rebase leftover in PACKNODE-011"
tags: ["ci-red", "issue-420", "pr-463", "repair"]
updated_at: 2026-09-01T12:07:23.429Z
---

PR 463 Linux CI (run 33505227014) failed with exactly 1 test: tests/consumer-node-runtime.test.ts line 411, CANDIDATE-U-PACKNODE-011. The assertion expect(plan.checks.find((check) => check.name === 'bun>=1.3')?.ok).toBe(false) received undefined - the bun>=1.3 readiness check no longer exists on current main because the Bun-removal lane (PR 509 / issue 472) deleted it. This is a rebase leftover: the fixture rebinding to nodeVersion/requiredNodeVersion was done but this one assertion still references the removed bun check. Repair: drop the bun>=1.3 expectation or invert it to assert the check is absent (find(...) === undefined), whichever matches the Node readiness contract; the remaining 3474 tests are green. Windows leg is still running but the verdict is already determined red. Push the one-line fix, keep scope to this file, and redispatch the exact-head review request; Claude watcher will re-arm on the new head tonight.
