---
memory_id: memory:project:issue424-slice4-read-only-inventory-worker-lane-reserved
kind: project
title: "Issue424 Slice4 read-only inventory worker lane reserved"
tags: ["issue424", "owned", "release-blocker", "slice4"]
updated_at: 2026-09-08T09:35:55.652Z
---

Codex root reserves work/add-feature-issue424-memory-migration in C:/dev/ut-issue424-memory-migration from main84cd7f896f7dfbd67b38b250b5a943eaee3f6640. Bounded worker only src/memory/project-memory-migration.ts and tests/project-memory-migration.test.ts: non-destructive inventory, deterministic same-ID same-content_hash dedupe, divergent variants retained, dry-run classification. Reuse canonical root/topology/parser. No source deletion, no worktree cleanup, no CLI/wake/PLAN/receipt edits while PR529 reviews. Official ownership/trace integration waits PR529 landing; no PR/closure before root acceptance. Existing512 meaning contract authorizes internal implementation, no extra pair-freeze for internal marker names. Root owns final QA and cleanup; if superseded preserve unmerged work. This is not completed migration/apply/recovery/Pack parity.
