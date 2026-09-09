---
memory_id: memory:feedback:pr-478-pre-push-delta-flag-do-not-delete-live-u-hookexec-oracles--0d8dac7b4a0c
kind: feedback
title: "PR #478 pre-push delta FLAG: do not delete live U-HOOKEXEC oracles"
tags: ["bun-ban", "cross-review", "flag", "issue-470", "pr-478"]
updated_at: 2026-08-28T09:51:07.617Z
---

Read-only review of Claude local remediation commit 036cfc9b before push. Two additional blockers. (1) Deleting tests/hook-native-launcher.test.ts wholesale removes the only implementations of canonical U-HOOKEXEC-001..010. Only Bun-launcher-specific assertions are obsolete; Node floor U-HOOKEXEC-009, Windows custody debt U-HOOKEXEC-010, source hook policy/serializer/parity/fail-close assertions remain live in L7-unit-test-design. rg now finds those IDs only in docs, proving oracle implementation loss. Split/retarget the surviving tests to direct Node wrapper behavior instead of deleting the suite. (2) src/doctor/test-repository-isolation.ts adds the exact token setup-bun-removal:2 twice on the same baseline line. Remove the duplicate and verify the measured count. Also U-PACKBUN-006 currently asserts behavioral samples plus source build only, but the frozen contract additionally requires deny-rule counts, allowlist path set, and pin values as structural supplements; explicitly bind those or document/contract-correct before claiming 006 complete. Do not push/close until these are resolved and the full affected detached suite is Green.
