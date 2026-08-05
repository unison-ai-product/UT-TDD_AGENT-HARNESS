---
memory_id: memory:feedback:official-vitest-snapshot-runner-hangs-after-test-child-start-on-windows
kind: feedback
title: "Official vitest snapshot runner hangs after test child start on Windows"
tags: ["ci", "runner", "snapshot", "vitest", "windows"]
updated_at: 2026-07-30T06:38:04.306Z
---

2026-07-30 HEAD 276f1a27: scripts/run-vitest-snapshot.ts hung with no output for 180s even when limited to github-closure-cli.test.ts and closure-e15-finalize.test.ts and with no duplicate runner. Timeout left bun/shell descendants, which must be identified by exact run-vitest-snapshot.ts command line and stopped; do not start a second runner. Direct isolated vitest config passed 57/57, but that is not official-runner evidence and must not be reported as such.
