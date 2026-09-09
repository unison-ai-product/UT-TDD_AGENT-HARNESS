---
memory_id: memory:feedback:506-clean-snapshot-blocker-node-refuses-ts-under-node-modules--8cd46be5ecb6
kind: feedback
title: "#506 clean snapshot blocker: Node refuses TS under node_modules"
tags: ["bun-ban", "issue-506", "node", "setup"]
updated_at: 2026-09-01T05:37:32.804Z
---

Clean detached snapshot of #506 commit 2d1e5121 ran runtime-portability 19/19, distribution 5/5, setup 26/27. Only U-SETUP-009b2 failed after runWrapperViaBun -> runWrapperViaNode: generated wrapper selects node_modules/ut-tdd/src/cli.ts, and Node v24.13.0 rejects execution under node_modules with ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING even though fixture content is plain JS. Do not weaken oracle or reintroduce Bun. Resolve within bounded Issue #506 or explicitly document/defer the wrapper compiled-runtime boundary to #420/#463 with a test that remains meaningful; record exact decision before commit. Current worktree C:\\dev\\ut-tdd-wt-issue506-bun-spawn-retirement.
