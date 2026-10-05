---
memory_id: memory:feedback:incident-2026-09-16-git-worktree-remove-without-force-followed-a-node-modules-junction-and-emptied-the-primary-node-modules-rmdir-the-junction-before-any-worktree-remove--d4713b83eeba
kind: feedback
title: "incident 2026-09-16: git worktree remove (without --force) followed a node_modules junction and emptied the primary node_modules — rmdir the junction before any worktree remove"
tags: ["incident", "junction", "node-modules", "windows", "worktree"]
updated_at: 2026-09-16T07:56:20.797Z
---

2026-09-16 07:55Z、Claude control lane が review 用 worktree .claude/worktrees/pr633-6d73-review を git worktree remove (--force 無し) で畳んだところ、worktree 内の node_modules junction (→ C:/dev/UT-TDD-agent-harness/node_modules) を辿って primary の node_modules が空になり、以後 node src/cli.ts が Cannot find package 'commander' で全滅した。npm ci (121 packages、9 秒) で復旧。既存教訓 (--force 禁止) は plain form でも同じ。

How to apply: worktree を畳む前に必ず MSYS_NO_PATHCONV=1 cmd /c "rmdir <wt>\node_modules" で junction を unlink してから git worktree remove する。review 専用 worktree にはテスト実行が必要な場合以外 junction を作らない。primary の node_modules が消えたら npm ci で戻す (lockfile 正)。
