---
memory_id: memory:project:pr-467-exact-head-2510d9d6-flag2-remediation-status
kind: project
title: "PR #467 exact-head 2510d9d6 FLAG2 remediation status"
tags: ["pr-467", "review-retry", "status"]
updated_at: 2026-08-28T17:44:00+09:00
---

PR #467 Claude FLAG blocking 2 remediation is pushed at exact HEAD `2510d9d6e19def236a01ffe060e35aad37953d45`.

Closed findings:

1. exit 0 plus rejected/missing/identity-invalid verdict records one append-only `attempt_verdict_rejected` terminal outcome and permits a bounded retry; malformed custody data preserves its original typed projection reason without minting retry authority.
2. receipt projection always enters the create-exclusive writer. The case-B oracle reaches its EEXIST branch with conflicting pre-existing bytes; replacing exclusive creation with overwrite makes the oracle fail.

Independent Codex validation on the committed HEAD:

- detached snapshot focused test: 13/13 Green
- TypeScript: Green
- Biome changed production/test files: Green
- PLAN lint: Green (`checked=935`)
- fingerprint: 6049 processed / 0 failed

Await required exact-head CI before canonical Claude closing-review dispatch. PR remains draft; no self-approval or merge.
