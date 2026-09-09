---
memory_id: memory:feedback:probe-whether-a-worktree-node-modules-shares-storage-with-primary-before-folding-it-entry-count-and-rmdir-cannot-tell-junction-from-independent-copy--3aa74c33c40f
kind: feedback
title: "Probe whether a worktree node_modules shares storage with primary before folding it; entry count and rmdir cannot tell junction from independent copy"
tags: ["correction", "junction", "node-modules", "windows", "worktree"]
updated_at: 2026-09-09T03:56:53.392Z
---

worktree を畳む前に、その `node_modules` が primary と**同一実体を共有しているか**を probe で判定する。
共有していれば `git worktree remove` が共有先を空にする。2026-09-09 実測: 用済み worktree 17 件を畳んだ直後に
`C:/dev/UT-TDD-agent-harness/node_modules` が 0 エントリになり `node src/cli.ts` が
`ERR_MODULE_NOT_FOUND: commander` で全 CLI 起動不能になった (`npm ci` で復旧)。

**Why:** この repo の worktree には 3 種類が混在しており、見た目では区別できない。
(a) primary への symlink / junction (`ls -la` で `-> /c/dev/UT-TDD-agent-harness/node_modules/` と出るものと、
出ないものがある)、(b) 独立に `npm install` された実体コピー、(c) `node_modules` 無し。
いずれも `ls node_modules | wc -l` は 92 を返すため**エントリ数では判別できない**。
`cmd /c rmdir` も (b) では「ディレクトリが空ではありません」で失敗し、`fsutil reparsepoint query` は
Git Bash 経由のパス引用で誤動作する。

**How to apply:** 判定は probe ファイルで行う (確実かつ非破壊)。

```bash
touch node_modules/.probe-shared-check
[ -e "<worktree>/node_modules/.probe-shared-check" ] && echo SHARED || echo independent
rm -f node_modules/.probe-shared-check
```

SHARED なら畳む前に `cmd //c rmdir "<worktree>\node_modules"` でリンクを外す。independent / 無しなら
そのまま `git worktree remove` してよい。畳んだ直後に必ず `ls node_modules | wc -l` と
`node src/cli.ts --help` で primary の実行系を検証する — `remove` の exit code を成功判定にしない。

**訂正**: 先行メモリ [[feedback-git-worktree-remove-follows-the-node-modules-junction-and-empties-the-primary-node-modules]]
は「worktree の `node_modules` は junction 運用」と一般化していたが、実測では独立コピーの worktree も存在する。
junction をたどる危険は実在するが、全 worktree が junction という前提は誤り。判定を probe に置き換える。
