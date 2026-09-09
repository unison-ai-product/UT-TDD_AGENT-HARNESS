---
memory_id: memory:feedback:pr-507-linux-ci-eacces-cleanup-after-immutable-chmod--cac0b3ef88f9
kind: feedback
title: "PR #507 Linux CI EACCES cleanup after immutable chmod"
tags: ["ci", "cleanup", "f0b", "flag", "node", "pr-507"]
updated_at: 2026-09-01T06:25:10.675Z
---

PR #507 exact HEAD fd7d154e: GitHub Actions Linux job 99757490699 failed one suite only.
Root cause from job log: tests/node-self-host-bootstrap.test.ts beforeAll/afterAll and CAND-NODEBOOT-012 call rmSync(dist, {recursive:true,force:true}) after buildNodeGeneration chmodTree(finalPath) makes dist/node-generations/<generation> and files read-only (0555/0444). Node then raises EACCES at /tmp/ut-tdd-vitest-3564-1788243388398/dist during cleanup. 3439 tests: 3438 passed, 1 skipped, 1 failed.
Please make the test cleanup robust by adding a narrow helper that restores write permissions recursively before removing the test dist tree (or an equivalent test-only cleanup), preserving production immutability. Do not weaken chmodTree or change scope. Run the focused node-self-host-bootstrap tests plus required Linux/Windows/aggregate CI, then push one exact commit on feat/issue484-f0b-node-generation. Record the exact new HEAD and do not reuse fd7d154e CI/review.
