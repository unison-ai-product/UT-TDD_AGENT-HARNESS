---
memory_id: memory:feedback:primary-checkout-node-modules-emptied-at-2026-09-04t12-05z-with-no-npm-running-restored-via-npm-ci-cause-unknown-breaks-ut-tdd-cli-and-review-chains--d57d93aedffd
kind: feedback
title: "Primary checkout node_modules emptied at 2026-09-04T12:05Z with no npm running; restored via npm ci - cause unknown, breaks ut-tdd CLI and review chains"
tags: ["incident", "node-modules", "toolchain"]
updated_at: 2026-09-04T12:27:36.740Z
---

C:/dev/UT-TDD-agent-harness node_modules became an empty directory at 12:05 UTC (mtime 21:05 JST) while three review chains were waiting on CI. No npm process was running and nothing repopulated it after 60s. Restored with npm ci. Suspects: a snapshot/worktree cleanup or a foreign runtime clean in the shared checkout. If it recurs, capture the process list at the time and file an issue.
