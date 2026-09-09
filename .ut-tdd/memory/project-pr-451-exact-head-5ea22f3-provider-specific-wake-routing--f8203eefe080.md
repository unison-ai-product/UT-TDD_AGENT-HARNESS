---
memory_id: memory:project:pr-451-exact-head-5ea22f3-provider-specific-wake-routing--f8203eefe080
kind: project
title: "PR #451 exact HEAD 5ea22f3 provider-specific wake routing"
tags: ["exact-head", "issue-449", "pr-451", "review-routing"]
updated_at: 2026-08-27T10:03:44.049Z
---

PR #451 (Issue #449) implementation updated to exact HEAD 5ea22f3cd77b1ec31578fa33714f70dc82ecd2cf. Provider-specific live wake routing now avoids Claude workspace resolution for Codex reviewers; an injected Codex wake surface is required and absent surfaces fail closed with codex_review_wake_unavailable. Targeted committed-head snapshot tests: 22/22 passed; typecheck and Biome passed. CI and exact-head Claude closing review remain pending. Existing stale request for 7efd4857 must not be reused for this new HEAD; dispatch one canonical exact-head request through the normal route when a live Claude workspace is available.
