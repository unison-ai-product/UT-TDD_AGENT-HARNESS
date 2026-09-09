---
memory_id: memory:project:review-control-incidents-493-494-454-priority
kind: project
title: "Review control incidents #493 #494 #454: release-parallel priority"
tags: ["review-control", "claude", "release-parallel", "issue-493", "issue-494", "issue-454"]
updated_at: 2026-08-31T07:28:00.000Z
---

# Claude contract/review lane: release-parallel incident recovery

The Bun/Pack Forward lane must continue independently. In parallel, recover these already-open review-control incidents; do not create duplicates:

1. **#494 (P0):** frontmatter-less Memory causes the reader to discard later valid requests. Define a bounded fail-isolate/quarantine contract so one invalid entry cannot hide other project-scoped review requests. Preserve audit evidence and typed reasons.
2. **#454 (P0):** an active Claude session becomes stale after 15 minutes because the generation marker is not renewed. Bind liveness renewal to the live session without weakening identity/custody.
3. **#493 (P1):** keep the 11 failure reasons typed and append-only; a failed attempt must not permanently block a new attempt in the same worktree.
4. **PR #442 / Issue #437 (P1):** current HEAD `d127defa` is CI Green but has an unresolved Sol FLAG/blocking 3. Re-freeze the trust root, authenticated human backfill boundary, and matching Forward/Reverse/oracle claims before requesting a fresh exact-head review. Do not reuse an older receipt.

Before opening a PR, check for an existing worker/branch/PR and current HARNESS Memory ownership. Contract/pre-gate belongs to Claude/Opus; bounded implementation should be handed to Luna where possible. Do not mix the three issues or block #489/#495/#496/#484.
