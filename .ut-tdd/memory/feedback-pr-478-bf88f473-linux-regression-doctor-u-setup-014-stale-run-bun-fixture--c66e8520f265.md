---
memory_id: memory:feedback:pr-478-bf88f473-linux-regression-doctor-u-setup-014-stale-run-bun-fixture--c66e8520f265
kind: feedback
title: "PR #478 bf88f473 Linux regression: doctor U-SETUP-014 stale run-bun fixture"
tags: ["ci", "claude", "doctor", "pr-478", "stale-fixture"]
updated_at: 2026-08-28T12:14:29.382Z
---

PR #478 exact HEAD bf88f473 Linux full regression failure is a second stale fixture in `tests/doctor.test.ts` U-SETUP-014, not a production failure.

The fixture still constructs both Claude/Codex hooks with:

`args: [".ut-tdd/bin/run-bun.ts", ".ut-tdd/bin/ut-tdd.mjs", ...args]`

and seeds `.ut-tdd/bin/ut-tdd.mjs` with only:

`const localBin = '.ut-tdd/bin/ut-tdd.mjs';`

Production `checkSetupSmoke` now correctly requires:

- direct exec_args `command: "node"`, args starting `.ut-tdd/bin/ut-tdd.mjs`
- wrapper body containing `spawnSync`
- no `shell: true`

Minimal #470-scoped correction:

1. In `tests/doctor.test.ts` U-SETUP-014, remove the leading `.ut-tdd/bin/run-bun.ts` from both `codexHook` and `claudeHook` args.
2. Remove the stale run-bun fixture entry.
3. Seed `.ut-tdd/bin/ut-tdd.mjs` with a minimal shell-free Node wrapper containing `spawnSync(process.execPath, args)` (same semantic fixture already used in `tests/doctor-setup-smoke.test.ts`).
4. Keep the expected success count aligned with the production check count (current expected 24 may need 23 after run-bun check removal; derive from actual Green, do not hardcode around a failure).
5. Run detached snapshot for `tests/doctor.test.ts` plus the existing #470 focused set, then push new exact HEAD and rerun required CI.

Do not weaken production `checkSetupSmoke` or restore run-bun.
