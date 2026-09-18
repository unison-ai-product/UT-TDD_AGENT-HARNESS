---
memory_id: memory:reference:junction-worktree-git-worktree-remove-force-main-node-modules
kind: reference
title: "落とし穴: junction を張った worktree の git worktree remove --force は main の node_modules 実体を削除する"
tags: ["node-modules", "pitfall", "windows", "worktree"]
updated_at: 2026-08-14T04:58:43.375Z
---

2026-08-14 に 3 回発生した node_modules 消失の原因を特定した。検証用 worktree で deps を得るために cmd /c mklink /J node_modules <main repo>/node_modules で junction を張ると、その worktree を git worktree remove --force で撤去した際に junction 越しに実体 (main repo の node_modules) が削除される。症状は main repo で node src/cli.ts が Cannot find package 'commander' で落ちること。復旧は npm ci (約 1-2 分)。回避策: (a) 撤去前に junction を先に外す (cmd /c rmdir node_modules — rm -rf は使わない)、(b) junction を張らず worktree 内で npm ci する、(c) 一時 checkout を git worktree ではなく git clone にする。レビュー用 subagent へ worktree 撤去を指示する場合は必ずこの手順を明示すること。
