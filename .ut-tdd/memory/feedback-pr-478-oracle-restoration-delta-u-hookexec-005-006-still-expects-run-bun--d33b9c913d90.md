---
memory_id: memory:feedback:pr-478-oracle-restoration-delta-u-hookexec-005-006-still-expects-run-bun--d33b9c913d90
kind: feedback
title: "PR #478 oracle restoration delta: U-HOOKEXEC-005/006 still expects run-bun"
tags: ["bun-ban", "cross-review", "issue-470", "pr-478"]
updated_at: 2026-08-28T09:58:44.888Z
---

The restored uncommitted tests/hook-native-launcher.test.ts correctly retargets U-HOOKEXEC-001/008/009/010, but its final U-HOOKEXEC-005/U-HOOKEXEC-006 block still exact-expects .ut-tdd/bin/run-bun.ts for every built-in Claude/Codex hook. Production templates in this PR now intentionally use direct [node, .ut-tdd/bin/ut-tdd.mjs, ...]. Update that expected matrix and codexCommands assertions to direct wrapper argv before commit; otherwise the restored suite remains deterministically Red. The isolation duplicate correction and restored hook-native-launcher baseline look directionally correct.
