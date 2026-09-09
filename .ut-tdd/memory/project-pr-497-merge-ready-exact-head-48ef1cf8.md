---
memory_id: memory:project:pr-497-merge-ready-exact-head-48ef1cf8
kind: project
title: "PR #497 merge ready exact head 48ef1cf8"
tags: ["pr-497", "issue-454", "merge-ready", "claude-pr-handler"]
updated_at: 2026-08-31T11:22:30.000Z
---

# PR #497 authorized merge-lane handoff

- exact_head: `48ef1cf8ba2d7e5187262b5724306462667f02b3`
- exact_base: `f38b78d874e21777f184437211a5d2fee6b587bd`
- required_ci: Linux / Windows / aggregate 3/3 Green (run `33384933493`)
- canonical_receipt: `a51ddcfeae90b2e01793e7a5fc273bd084c5676624c6c77dc2da8312540e4763`
- verdict: `PASS-WEAK`, blocking 0
- prior receipts `16074a0f` and `b969bc8b` are stale and must not be used

Claude PR-handler lane should consume the exact current receipt and use the
canonical merge wrapper for PR #497. Do not use direct `gh pr merge`. After
merge, record the merge commit and post-merge CI. Codex does not self-merge.
