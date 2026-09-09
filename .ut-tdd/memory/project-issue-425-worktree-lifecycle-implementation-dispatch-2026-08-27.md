---
memory_id: memory:project:issue-425-worktree-lifecycle-implementation-dispatch
kind: project
title: "Issue #425 managed worktree lifecycle implementation — bounded re-entry"
tags: ["worktree", "lifecycle", "issue-425", "release-blocker", "luna"]
updated_at: 2026-08-27T17:28:00+09:00
---

# Issue #425 implementation dispatch

Issue #425 remains open and has no active implementation PR. PR #435 froze the
application contract (`PLAN-L7-513`), while PR #428 was correctly closed after a
non-author FLAG (blocking 5) for scope mixing and two compensation bugs. Do not
reopen or cherry-pick the closed #428 stack wholesale.

- Issue: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/425
- source baseline: `origin/main` `c12184c22a3df234371111b94c6b7c70302080a5`
- confirmed input: `PLAN-L7-501-worktree-lifecycle-domain.md`
- confirmed application contract: `PLAN-L7-513-worktree-lifecycle-application.md`
- paired test design: `docs/test-design/harness/L7-worktree-lifecycle-application-test-design.md`
- worker: `gpt-5.6-luna`, effort `high`
- post-gate: Claude Opus non-author exact-head review; Codex does not merge

## First bounded slice (one Issue / one PR)

Implement only the coordinator/application saga and fake-port oracle:

- reservePath → planned record → worktree create/observe → worker-start receipt → activate
- activation abort and lease release on every pre-activation failure
- best-effort compensation that preserves the primary error and always records cleanup handoff
- terminal/owner-loss/TTL event handoff to the existing confirmed domain FSM
- immutable owner, Issue, PLAN revision, lifecycle ID, use, TTL, canonical path, and attempt binding

The two previously detected regressions must have direct Red tests:

1. invalid lease identity after a successful reservation cannot leak the lease;
2. `releasePath` throwing cannot erase the primary error or suppress abort/handoff evidence.

Reuse the confirmed domain (`PLAN-L7-501`) and application contract (`PLAN-L7-513`).
Do not include CLI, doctor projection, physical cleanup, inventory/quarantine, or new
worktree creator surfaces in this first PR. Those are separate follow-up slices after
the coordinator is accepted. Do not modify #446 inbox files or publication files.

## Evidence and closure

Start from current main, record Red→Green mutation evidence, run Node/npm typecheck,
Biome, PLAN/test-design lint, Linux/Windows/aggregate CI, and exact-head Claude closing
review. Record the worker model, exact revision, remaining CLI/doctor/cleanup boundary,
and canonical receipt in HARNESS Memory. Keep #426 (legacy physical cleanup) open and
do not delete any worktree as part of this task.
