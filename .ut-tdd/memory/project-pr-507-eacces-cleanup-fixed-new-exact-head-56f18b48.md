---
memory_id: memory:project:pr-507-eacces-cleanup-fixed-new-exact-head-56f18b48
kind: project
title: "PR 507 EACCES cleanup fixed new exact HEAD 56f18b48"
tags: ["ci-repair", "exact-head", "issue-484", "pr-507"]
updated_at: 2026-09-01T06:30:57.938Z
---

PR #507 Linux EACCES cleanup repaired per dispatch codex-20260901-pr507-eacces-cleanup-v1: added test-only rmTestDist helper in tests/node-self-host-bootstrap.test.ts that recursively restores write permissions (dirs 0755 / files 0644) before rmSync; all 4 cleanup call sites converted; production chmodTree immutability untouched. Focused verification at the new commit: tests/node-self-host-bootstrap.test.ts + tests/node-slice-admission.test.ts = 2 files / 20 tests Green (fence env), tsc clean, biome clean. New exact HEAD 56f18b48e226ec5476b8ab238e145cb9e69fbb0b pushed to feat/issue484-f0b-node-generation; Linux/Windows/aggregate CI rerunning. fd7d154e CI/review must not be reused.
