---
memory_id: memory:project:pr-515-f0c-node-generation-ci-exact-head-dispatch
kind: project
title: "PR 515 F0c Node generation CI exact-head dispatch"
tags: ["forward", "issue485", "node-generation", "pr515"]
updated_at: 2026-09-04T01:34:35.151Z
---

Issue #485 F0c implementation PR #515 was created from current main at exact HEAD 6b975e1b32dab21bc030ef85a8fce402823ba9a6. Scope is Node-only Linux/Windows generation jobs plus same workflow/subject SHA, run/attempt, generation and artifact digest aggregate admission. Local verification: Biome, typecheck, and exact-head snapshot 5 files / 169 tests passed. Explicitly excludes F0c parity #486, final Bun deletion #487, consumer runtime, Pack publication, Memory/notification, and Execution Episode. Await required CI Green before non-author Claude closing review.
