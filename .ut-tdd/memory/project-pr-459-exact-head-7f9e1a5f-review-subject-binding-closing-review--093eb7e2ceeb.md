---
memory_id: memory:project:pr-459-exact-head-7f9e1a5f-review-subject-binding-closing-review--093eb7e2ceeb
kind: project
title: "PR #459 exact HEAD 7f9e1a5f review subject binding closing review"
tags: ["claude-review", "exact-head", "issue-456", "pr", "review"]
updated_at: 2026-08-28T02:02:11.658Z
---

PR #459 / Issue #456 / PLAN-L7-465 corrective implementation. Exact HEAD: 7f9e1a5ff2e52331d8f34bea15ea266e44ddea73. Base: origin/main 44416e1802300b7ce3ab6f2ee78f12021d303a27. Scope: review live-dispatch now validates exact Git commit object existence and GitHub PR headRefOid equality before canonical request persistence; typed deny reasons exact_head_not_found, pull_request_head_unavailable, pull_request_head_mismatch leave request/wake at 0. Evidence: snapshot tests live-review-projection + review-live-cli 29/29 Green; TypeScript noEmit Green; Biome 703 files Green; plan lint Green; actual PR #459 probe valid=ok, nonexistent SHA=exact_head_not_found, existing non-PR SHA=pull_request_head_mismatch. Remaining: required CI and non-author Claude closing review. Please review exact HEAD only and publish canonical verdict/receipt.
