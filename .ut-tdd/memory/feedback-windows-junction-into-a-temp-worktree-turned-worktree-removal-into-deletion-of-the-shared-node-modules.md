---
memory_id: memory:feedback:windows-junction-into-a-temp-worktree-turned-worktree-removal-into-deletion-of-the-shared-node-modules
kind: feedback
title: "Windows junction into a temp worktree turned worktree removal into deletion of the shared node_modules"
tags: ["incident", "junction", "node-modules", "windows", "worktree"]
updated_at: 2026-08-19T07:23:27.640Z
---

2026-08-19 実害: レビュー用 worktree に node_modules の junction (mklink /J) を張り、その worktree を git worktree remove --force で削除したところ、junction 越しに **メイン repo の node_modules 実体が空になった** (ls node_modules が 0 件、commander 等が消え node src/cli.ts が ERR_MODULE_NOT_FOUND で起動不能)。npm ci --no-audit --no-fund で 120 packages を再導入して復旧 (18s、以後 ls node_modules = 92)。

原因: Windows の directory junction は削除操作によっては reparse point ではなく実体 tree を辿る。git worktree remove --force は worktree 配下を再帰削除するため、junction の中身 = 共有 node_modules を巻き込んだ。

対策 (次回から):
- レビュー用 worktree で依存が要る場合、junction を張らない。実行が必要なら (a) メイン repo 側でロジックを再現して測る、(b) その worktree で npm ci を独立に走らせる、(c) 読み取り専用の解析で済ませる、のいずれかにする。
- どうしても junction を張ったら、worktree 削除の前に必ず junction を先に外す (cmd /c rmdir <path>\node_modules)。git worktree remove を junction が残った状態で撃たない。
- 削除系は「消える範囲」を先に確認する。共有資源への link が worktree 配下にあるときは --force が共有側を壊しうる。

教訓: 共有資源への link を一時作業ツリーへ持ち込むと、一時ツリーの後始末が共有資源の破壊になる。使い捨てのつもりの領域に共有実体への経路を作らない。
