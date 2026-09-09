---
memory_id: memory:feedback:hand-off-3-merged-worktrees-are-foldable-but-git-worktree-remove-follows-the-node-modules-junction-and-empties-the-primary-node-modules-unlink-first-keep-the-issue540-lane--e38673da17be
kind: feedback
title: "Hand-off: 3 merged worktrees are foldable, but git worktree remove follows the node_modules junction and empties the primary node_modules (unlink first); keep the issue540 lane"
tags: ["cleanup", "handoff", "junction", "windows", "worktree"]
updated_at: 2026-09-09T03:47:07.616Z
---

## 畳める worktree 3 件の引き渡し + `git worktree remove` の重大な注意 (2026-09-09 実測)

**先に注意事項**: `git worktree remove` は worktree 内の `node_modules` **junction をたどって共有先
(primary の `node_modules`) の中身を削除する**。本日 root 側で実測し、用済み worktree を畳んだ直後に
`C:/dev/UT-TDD-agent-harness/node_modules` が 0 エントリになり、`node src/cli.ts` が
`ERR_MODULE_NOT_FOUND: Cannot find package 'commander'` で全 CLI 起動不能になった (`npm ci` で復旧済み)。

安全手順:

```bash
cmd //c rmdir "C:\dev\<worktree>\node_modules"   # junction のリンクのみ削除
git worktree remove "C:/dev/<worktree>"
git branch -D <branch>                            # main 取り込み済みを確認してから
ls node_modules | wc -l && node src/cli.ts --help # primary の実行系を必ず検証
```

`remove` の exit code を成功判定にしないこと (削除は成功して見えても実行系が死ぬ)。

### 畳める 3 件 (いずれも HEAD が origin/main に取り込み済み、tracked 変更 0、worktree 固有メモリ 0)

| worktree | branch | 経緯 | node_modules |
|---|---|---|---|
| `C:/dev/ut-issue439-request-terminal-repair` | `design/issue439-request-terminal-repair` | PR #527 merge 済み | junction (92 entries) |
| `C:/dev/ut-issue528-project-memory-envelope` | `work/issue544-memory-inventory-evidence` | PR #546 merge 済み | junction (92 entries) |
| `C:/dev/ut-issue544-memory-inventory` | `work/add-feature-issue544-memory-inventory` | PR #546 merge 済み | absent (junction 不要) |

前 2 件は junction を持つので上記手順が必須です。作った側が畳む規約なのでそちらへお返しします。

### 保持が必要 (削除しないこと)

- `C:/dev/ut-issue487-bun-final-retirement-impl` — branch `work/add-feature-issue540-cutover-prefix-contract`。
  #540 の稼働レーンと判断したため root 側では触っていません。junction あり。

### root 側で本日畳んだもの (参考)

用済み 17 件を削除し 72 → 55 件へ。判定基準は「HEAD が origin/main に含まれる」かつ「tracked 変更 0」かつ
「worktree 固有の untracked メモリ 0」。マージ済みローカルブランチ 3 本も削除。

### 残る 52 件のうち畳めない理由 (棚卸し用)

- origin/main 未取り込みの commit を持つ: 約 30 件 (削除すると成果が消える)
- tracked 変更あり: 6 件 (`<user-home>/ut-hook-exec` は 187 ファイル変更)
- **worktree 固有の HARNESS メモリが残存: 16 件** (`C:/dev/ut-gate-main` は 42 件)。これは
  PR #546 で merge された `ProjectMemoryMigration` の read-only inventory で列挙できるようになったが、
  apply が未実装のため集約はできない。手作業のファイルコピーは memory 手書き禁止の規律に触れるので
  root 側では行わない。#544 の後続 slice (apply) が入るまで保留。
