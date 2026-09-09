---
memory_id: memory:feedback:git-worktree-remove-follows-the-node-modules-junction-and-empties-the-primary-node-modules-on-windows-unlink-the-junction-first-and-verify-the-cli-after-folding--ca1f378ad9af
kind: feedback
title: "git worktree remove follows the node_modules junction and empties the primary node_modules on Windows; unlink the junction first and verify the CLI after folding"
tags: ["incident", "junction", "node-modules", "windows", "worktree"]
updated_at: 2026-09-09T03:37:14.479Z
---

`git worktree remove` は worktree 内の `node_modules` junction をたどって**共有先 (primary の
`node_modules`) の中身を削除する**。2026-09-09 実測: 用済み worktree 17 件を `git worktree remove` で
畳んだ直後、`C:/dev/UT-TDD-agent-harness/node_modules` が 0 エントリになり、
`node src/cli.ts` が `ERR_MODULE_NOT_FOUND: Cannot find package 'commander'` で全 CLI 起動不能になった。
`npm ci` で復旧し、junction 経由の他 worktree も参照が戻った (各 92 パッケージ)。

**Why:** この repo の worktree は `cmd /c mklink /J <wt>\node_modules C:\dev\UT-TDD-agent-harness\node_modules`
で primary の `node_modules` を共有する運用になっている (グローバル規約)。junction は「ディレクトリの
別名」であり、再帰削除がリンク自体ではなく**中身**を消しに行くと共有先が空になる。symlink と違い
Windows の junction はツールによって扱いが分かれるため、削除側が安全とは限らない。単一 worktree の
削除でも repo 全体の実行系が落ちる高影響操作である。

**How to apply:** worktree を畳む前に `node_modules` の junction を先に外す。
`cmd /c rmdir <wt>\node_modules` (junction はこれでリンクのみ削除される) を実行してから
`git worktree remove <wt>` する。複数畳むときは全件でこれを済ませてから remove に入る。
畳んだ直後に `ls node_modules | wc -l` と `node src/cli.ts --help` で primary の実行系を検証する
(削除は成功して見えても実行系が死ぬため、成功判定を remove の exit code に置かない)。
壊れたら `npm ci` で復旧できる (lockfile は `package-lock.json`、`packageManager` は npm)。
