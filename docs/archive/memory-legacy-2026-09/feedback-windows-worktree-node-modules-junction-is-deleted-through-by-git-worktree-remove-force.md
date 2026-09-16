---
memory_id: memory:feedback:windows-worktree-node-modules-junction-is-deleted-through-by-git-worktree-remove-force
kind: feedback
title: "Windows: worktree node_modules junction is deleted through by git worktree remove --force"
tags: ["2026-07-28", "hybrid", "incident", "windows", "worktree"]
updated_at: 2026-07-28T11:48:24.384Z
---

worktree に `node_modules` の **junction (New-Item -ItemType Junction)** を張ると、
`git worktree remove --force` が **junction を追って link 先 (本体 repo の node_modules) を空にする**。
2026-07-28 に実発生し、本体 repo の `node_modules` が 0 件になった (`bun install --frozen-lockfile`
10s で復旧。node_modules は untracked なので repo 内容の損失は無し)。

**Why**: hybrid では相手ランタイムが同時にテストを走らせているため、本体 repo の依存が消えると
**相手の作業を無関係に停止させる**。自分の worktree 都合の細工が共有面を壊す典型。

**How to apply**:
- worktree で toolchain (tsc / biome / vitest) が必要な場合は **junction を張らず `bun install --frozen-lockfile`
  を worktree 内で実行**する (実測 10s、frozen なので lockfile と一致)。
- どうしても link を使う場合、削除は `git worktree remove` ではなく **先に link を
  `(Get-Item $path).Delete()` で外してから**行う (Delete() は junction 自体だけを消し、target を辿らない)。
- 症状の見分け方: worktree 側で `error TS2688: Cannot find type definition file for 'node'` が出て、
  本体 repo でも `ls node_modules | wc -l` が 0 になっていたら本件。

関連: [[project-windows-env-pitfalls]] (Windows 固有の落とし穴)、
[[feedback-hybrid-commit-coordination-claude-codex]] (相手ランタイムの作業を壊さない義務)。
