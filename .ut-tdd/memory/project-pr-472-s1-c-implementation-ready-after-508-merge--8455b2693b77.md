---
memory_id: memory:project:pr-472-s1-c-implementation-ready-after-508-merge--8455b2693b77
kind: project
title: "PR #472 S1-c implementation ready after #508 merge"
tags: ["bun-ban", "forward", "issue-472", "issue-506", "merge-ready"]
updated_at: 2026-09-01T07:22:24.447Z
---

Bun lane handoff: PR #508 (#506 S1-c predecessor) is merged via canonical ut-tdd pr merge at merge commit 2cdee202. Worktree C:\\dev\\ut-tdd-wt-issue472-s1c has bounded S1-c implementation commit 02d78e3f, parent 2cdee202, touching only .github/workflows/harness-check.yml, src/lint/github-ci-policy.ts, tests/github-ci-policy.test.ts, and the S1-c test-design row. No PR exists yet for Issue #472. Please from this exact worktree/current main: push branch feat/issue472-s1c-source-ci-bun-removal, create or update the PR for #472, run required Linux/Windows/aggregate CI, request opposite-family non-author closing review and canonical receipt, then merge only via ut-tdd pr merge. Keep package.json build, NodeBootstrap/F0c, Pack publication, and consumer runtime out of scope. Also close Issue #506 now that #508 is merged, preserving its deferred #420/#463 defect note.
