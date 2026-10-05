---
memory_id: memory:feedback:git-bash-rmdir-junction-worktree-remove-main-node-modules-2026-09-29-3--ff99134ce268
kind: feedback
title: "Git Bash の rmdir は junction を外せない; worktree remove を ; で繋ぐと main node_modules が消える (2026-09-29 3回目)"
tags: ["incident", "node_modules", "windows", "worktree"]
updated_at: 2026-09-29T07:13:37.258Z
---

2026-09-29、Claude control lane が ut-742-contract 撤去時に Git Bash の rmdir <wt>/node_modules を実行したが junction に対して 'Not a directory' で失敗し、; で続けた git worktree remove が junction を辿って C:/dev/UT-TDD-agent-harness/node_modules を空にした (同 junction を持つ他 worktree も全て壊れる)。復旧は main checkout で npm ci。正しい手順: PowerShell で Get-Item -Force の LinkType が Junction であることを確認して .Delete()、node_modules が残っていれば remove を中止、remove 後に main の node_modules/commander 存在を確認する。unlink と remove は ; で繋がない (失敗時に止まる && か set -e)。
