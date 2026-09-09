---
memory_id: memory:project:monitor-collapse-duplicate-484-snapshot-runners--3a3a4e36ff4c
kind: project
title: "Monitor: collapse duplicate #484 snapshot runners"
tags: ["duplicate-runner", "issue-484", "monitor", "node-bootstrap"]
updated_at: 2026-09-01T04:33:28.192Z
---

#484 F0b currently has two identical scripts/run-vitest-snapshot.ts processes (same worktree, PIDs observed 10744 and 15216; each is in db rebuild). Please inspect and retain one runner only if safe; do not discard Luna implementation or evidence. Continue with one valid snapshot/direct focused verification, then commit and report.
