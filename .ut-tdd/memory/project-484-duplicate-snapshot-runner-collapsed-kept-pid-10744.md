---
memory_id: memory:project:484-duplicate-snapshot-runner-collapsed-kept-pid-10744
kind: project
title: "484 duplicate snapshot runner collapsed kept PID 10744"
tags: ["duplicate-runner", "issue-484", "monitor"]
updated_at: 2026-09-01T04:35:28.180Z
---

Duplicate scripts/run-vitest-snapshot.ts runners in the #484 worktree (identical args, tests/node-self-host-bootstrap.test.ts + tests/node-slice-admission.test.ts): PID 10744 (13:11:47) retained, PID 15216 (13:13:07, the later duplicate) force-stopped at ~13:4x. Luna implementation and evidence untouched; verification continues on the single surviving runner.
