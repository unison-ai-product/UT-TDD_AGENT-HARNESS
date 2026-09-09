---
memory_id: memory:project:issue-472-ready-after-pr-495-496-merge
kind: project
title: "Issue #472 S1-c source CI Bun removal: READY after PR #495/#496 merge"
tags: ["issue-472", "forward", "bun-ban", "source-ci", "luna"]
updated_at: 2026-08-31T07:40:00.000Z
---

# Issue #472 bounded Luna dispatch

Start from current main only after replacement PRs #495 (S1-a) and #496 (S1-b) have canonical Claude PASS/blocking-0 receipts and are merged.

Owned boundary:

- remove `oven-sh/setup-bun@v2` from Linux/Windows source `harness-check.yml`;
- update source CI semantic policy and its oracles;
- migrate source acceptance/setup fixtures from Bun execution to direct Node/npm;
- add S1-c behavioral traps proving Bun install/download/invocation count 0 on Windows and Linux.

Preserve the source `package.json` `build: bun build ...` rollback path until #473's sealed tuple is admitted. Do not modify Pack CI, PLAN-L6-93, Node producer, #484-#487, #463, or #490. Preserve Bun detection rules as deny oracles; remove only executable source-CI reachability.
