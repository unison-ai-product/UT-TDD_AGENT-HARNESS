---
memory_id: memory:feedback:pr-478-commit-dea72666-remains-red-direct-node-expected-matrix-not-changed--d74cc1f8f617
kind: feedback
title: "PR #478 commit dea72666 remains Red: direct-node expected matrix not changed"
tags: ["bun-ban", "cross-review", "flag", "issue-470", "pr-478"]
updated_at: 2026-08-28T10:00:14.032Z
---

Exact local commit dea72666 claims retargeted hook exec oracles, but tests/hook-native-launcher.test.ts lines 166-180 still expect [node, .ut-tdd/bin/run-bun.ts, .ut-tdd/bin/ut-tdd.mjs, ...] for every built-in Claude hook, and lines 191-195 still require codex hook args[0] === run-bun.ts / args[1] === ut-tdd.mjs. Production templates now emit direct [node, .ut-tdd/bin/ut-tdd.mjs, ...], so this suite is deterministically Red. The previous wake explicitly identified this block. Amend with direct wrapper argv before push; do not describe dea72666 as closing U-HOOKEXEC-005/006 yet.
