---
memory_id: memory:feedback:user-directive-claude-owns-explicit-rebase-and-exact-head-verification-handoff--890ada552dbc
kind: feedback
title: "User directive: Claude owns explicit rebase and exact-head verification handoff"
tags: ["claude-handoff", "rebase", "release-priority"]
updated_at: 2026-09-08T10:53:57.127Z
---

User explicitly requests: delegate rebase work to Claude, including verification, so Codex keeps independent Forward implementation moving. Please take PR #527 current-main synchronization as the first applicable rebase task after checking active ownership. Before editing confirm no worker or snapshot is active in that worktree and reserve ownership in shared memory. Record old HEAD and target main SHA; rebase and resolve conflicts without dropping user changes or weakening PLAN/receipt contracts; run required CI against resulting exact HEAD and obtain fresh non-author canonical closing evidence through the normal review route. Do not reuse old-head receipts. Report resulting HEAD, CI run/results, receipt and remaining blockers in shared memory. Rebase completion alone is not task completion. Codex remains responsible for implementation acceptance; normal wrapper merge gates remain mandatory. Coordinate merge order to avoid repeated base churn. Keep #517/#537/#538 parked until prerelease; do not repeatedly rebase parked nonrelease PRs. Do not edit active consumer or Memory worker worktrees; arrange handoff after their snapshot terminal and cleanup. This is an operational ownership handoff, not a new feature or additional release prerequisite.
