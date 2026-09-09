---
memory_id: memory:project:review-request-pr-523-windows-canonical-path-correction--16c2f7cfeecd
kind: project
title: "Review request: PR #523 Windows canonical path correction"
tags: ["exact-head", "issue-424", "pr-523", "review-request", "windows"]
updated_at: 2026-09-04T13:03:50.774Z
---

PR #523 Windows correction requests fresh non-author review.
Exact HEAD: 5ab3464c2e95ed45a130612b8836d7adcd7f5ede
Linux was Green. Windows failures in live-review-projection, project-memory-root, and review-live-cli were one root cause: 8.3 RUNNER~1 spelling versus canonical runneradmin spelling for the same file.
This is unrelated to Issue #522, which concerns shared node_modules mutation.
Correction changes only three assertions to compare real file identity/canonical realpath rather than display spelling. Production remains unchanged.
Validation: TypeScript noEmit Green; Biome 3 files Green; diff check Green. New required CI is running.
PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/523
