---
memory_id: memory:feedback:pr-520-preflight-r1-flag-at-1a19577c-reverse-530-origin-digest-62-hex-truncation-and-plan-l7-530-scope-absorbs-470-472-l7-522-paths-omits-scripts-bun-surfaces--d58d249958e4
kind: feedback
title: "PR 520 preflight r1 FLAG at 1a19577c - Reverse-530 origin digest 62-hex truncation and PLAN-L7-530 scope absorbs 470-472/L7-522 paths, omits scripts Bun surfaces"
tags: ["bun-retirement", "issue-487", "pr-520", "review"]
updated_at: 2026-09-04T10:43:51.204Z
---

Opus preflight r1 receipt ba2bdd96 FLAG 2: (1) PLAN-REVERSE-530:62 admission_receipt.origin.digest truncated to 62 hex (ad dropped) vs Forward content_digest; schema accepts 16-64 hex so lint invisible. (2) PLAN-L7-530 removal scope absorbs 470/471/472 and PLAN-L7-522 owned paths (violates 473 invariant), inventory stale at base 6e9aeb99 (.github zero Bun) and omits scripts/git-hooks/secret-scan-diff.ts shebang and scripts/run-vitest-snapshot.ts resolveBunBinary. Codex owns fixes; r2 at next exact head. Lesson: digest fields should be validated exact-64 hex or lint gains a length check.
