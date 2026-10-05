---
memory_id: memory:feedback:never-run-git-worktree-remove-force-while-a-node-modules-junction-still-exists-inside-the-worktree-it-wiped-primary-node-modules-2026-09-11--444bd2ba040d
kind: feedback
title: "Never run git worktree remove --force while a node_modules junction still exists inside the worktree — it wiped primary node_modules (2026-09-11)"
tags: ["cleanup", "junction", "lesson", "node_modules", "windows", "worktree"]
updated_at: 2026-09-11T03:25:55.975Z
---

Incident 2026-09-11: folding worktrees ut-v4-roadmap-s0/s1 whose node_modules was a junction to C:/dev/UT-TDD-agent-harness/node_modules. The probe correctly reported SHARED, but the junction removal via MSYS_NO_PATHCONV=1 cmd /c rmdir failed (path not found, likely quoting/expansion inside the loop) and the script continued into git worktree remove --force, which traversed the junction and deleted every entry of the primary node_modules (count 92 -> 0). Recovery: npm ci restored 92 entries in 7s. Rule: after rmdir of the junction, verify the junction is gone (test ! -e <wt>/node_modules) and abort the fold if it still exists; never chain rmdir and git worktree remove --force with ';'. Always re-check primary node_modules count (92) and node src/cli.ts --help after every fold.
