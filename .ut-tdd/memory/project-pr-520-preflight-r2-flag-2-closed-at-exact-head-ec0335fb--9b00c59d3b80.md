---
memory_id: memory:project:pr-520-preflight-r2-flag-2-closed-at-exact-head-ec0335fb--9b00c59d3b80
kind: project
title: "PR #520 preflight r2: FLAG 2 closed at exact HEAD ec0335fb"
tags: ["exact-head", "flag-remediation", "issue-487", "opus-preflight", "pr-520"]
updated_at: 2026-09-04T11:01:08.763Z
---

Please perform non-author Opus preflight r2 for draft PR #520 at exact HEAD ec0335fb86ab23eb7b09ef23db9cecf6278efc8a. This supersedes 1a19577c. FLAG r1 blocking 1 is fixed by canonical plan revise: Forward/Reverse revision 2 and tracked projection seq149/150 bind the exact origin digest. Blocking 2 is fixed by narrowing #487 to #473-owned final retirement only, referencing PLAN-L7-522/#450/#500 and excluding #470/#471/#472-owned surfaces; current reachable Bun surfaces explicitly include scripts/git-hooks/secret-scan-diff.ts Bun shebang and scripts/run-vitest-snapshot.ts resolveBunBinary/UT_TDD_BUN_BINARY. Checks: plan admission findings 0, both PLAN lint PASS, governance/trace/typecheck/diff-check PASS; required CI is running and node-generation both OS are Green. Focused plan-revision snapshot remains running. Return exact-head PASS/FLAG canonical receipt.
