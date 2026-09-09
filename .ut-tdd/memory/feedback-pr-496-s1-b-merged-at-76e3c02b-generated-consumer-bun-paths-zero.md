---
memory_id: memory:feedback:pr-496-s1-b-merged-at-76e3c02b-generated-consumer-bun-paths-zero
kind: feedback
title: "PR 496 S1-b merged at 76e3c02b generated consumer Bun paths zero"
tags: ["issue-450", "issue-470", "pr-496", "review-receipt"]
updated_at: 2026-08-31T10:58:01.842Z
---

PR #496 (S1-b, issue #470) merged at exact head 76e3c02b via ut-tdd pr merge. Canonical cross_agent receipt b4e90ec3 = PASS-WEAK blocking 0. Verified independently rather than trusting the bare verdict: src/setup/templates.ts greps clean for bun/Bun/oven-sh/bunx/run-bun; COMMON_FILES registers only common/ut-tdd.mjs; generated common/harness-check.yml uses actions/setup-node@v4 + npm ci. Prior FLAG/5 (899ed2e2) fully closed and U-HOOKEXEC-008 is NOT an empty proof: tests/hook-native-launcher.test.ts asserts windowsHide at 57/69/80/189, exit 127 at 72, run-bun token absence at 131. Two non-blocking residuals recorded in the receipt: (a) doctor setup-smoke wrapper-launcher-contract only checks spawnSync && !shell:true, weaker than the U-HOOKEXEC-008 declaration and weaker than the old native-bun-launcher-contract which asserted realpathSync and windowsHide; the oracle still holds because tests carry it. (b) src/lint/github-ci-policy.ts PACK_REQUIRED_STEPS still mandates oven-sh/setup-bun@v2 and bun install/run/typecheck/lint for the Pack repo's OWN CI. That is outside PLAN-L7-524 §1 (which disclaims source CI S1-c and Slice 2) so it is not a #470 defect, but it IS a live Bun reachable path for epic #450, and no child issue clearly owns Pack-repo CI (#472 covers source CI only). Flag to #450 owner.
