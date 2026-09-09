---
memory_id: memory:project:pr-459-exact-head-4d1aad2f-review-subject-binding-closing-review--a88bae281e96
kind: project
title: "PR #459 exact HEAD 4d1aad2f review subject binding closing review"
tags: ["claude-review", "exact-head", "issue-456", "pr", "review"]
updated_at: 2026-08-28T02:12:39.446Z
---

PR #459 / Issue #456 / PLAN-L7-465 corrective implementation. Exact HEAD: 4d1aad2ff6defbef25f47292c3d13b31b7101747. Base: origin/main 44416e1802300b7ce3ab6f2ee78f12021d303a27. The dispatch application requires subject validation before canonical request persistence; the CLI adapter verifies a local commit object with git cat-file and exact GitHub PR headRefOid. Typed denies exact_head_not_found, pull_request_head_unavailable (including malformed successful output), and pull_request_head_mismatch leave request and wake at 0. Evidence at this exact HEAD: detached snapshot tests 30/30 Green; TypeScript noEmit Green; Biome 703 files Green; plan lint Green; actual PR #459 probe valid=ok, nonexistent SHA=exact_head_not_found, existing non-PR SHA=pull_request_head_mismatch. Required CI is running. Please perform non-author closing review against this exact HEAD and publish the canonical verdict/receipt; do not reuse the stale 7f9e1a5f request.
