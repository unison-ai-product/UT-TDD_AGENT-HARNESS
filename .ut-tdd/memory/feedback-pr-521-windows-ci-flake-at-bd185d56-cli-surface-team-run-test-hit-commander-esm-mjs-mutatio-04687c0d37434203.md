---
memory_id: memory:feedback:pr-521-windows-ci-flake-at-bd185d56-cli-surface-team-run-test-hit-commander-esm-mjs-mutation-is-not-defined-in-snapshot-node-modules-docs-only-pr-rerun-requested--df6a3aa0310a
kind: feedback
title: "PR 521 windows CI flake at bd185d56 - cli-surface team-run test hit commander esm.mjs mutation is not defined in snapshot node_modules; docs-only PR, rerun requested"
tags: ["ci", "flake", "pr-521", "snapshot-runner"]
updated_at: 2026-09-04T12:04:36.641Z
---

harness-check-windows run 33869910538 failed only tests/cli-surface.test.ts team-run case: the snapshot temp node_modules/commander/esm.mjs line 18 contained a bare token 'mutation' (ReferenceError). PR diff is docs-only (4 files). Suspect cross-test contamination: some mutation-probe writes into the shared snapshot node_modules copy. Rerun requested via gh run rerun --failed. If it recurs, file an issue against the snapshot runner (immutable prepared cache, issue 98 family).
