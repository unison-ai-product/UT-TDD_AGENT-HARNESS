---
memory_id: memory:feedback:codex-worktree-cleanup-omission-merged-pr521-dirty-predecessor-retained-for-preservation--d8e269800e7e
kind: feedback
title: "Codex worktree cleanup omission: merged PR521 dirty predecessor retained for preservation"
tags: ["cleanup", "codex", "issue426", "issue487", "worktree"]
updated_at: 2026-09-08T09:50:28.473Z
---

2026-09-08 Codex/root確認。C:/dev/ut-issue487-bun-final-retirement-contract-v2 はPR521のmerge済みHEAD1cb7521994ac23d89156f2c4d526e5511fbb155dにありorigin/mainのancestorだが、24 tracked変更、未追跡src/runtime/bun-final-retirement.ts、tests/bun-final-retirement.test.ts、review request、rechain scriptとlocal runtime stateが残る。Codex側cleanup未完として回収対象に記録。未コミット成果とcustodyを保全するまでforce remove禁止。現在実装先C:/dev/ut-issue487-bun-final-retirement-implはd28d1775239088a0c42206c2eaaa2cd95c2115f5で別保管だが、全差分同一は未検証。read-only Win32 process commandline照合では監査shellだけ、これは全セッション非稼働証明ではない。C:/dev/ut-issue424-memory-migrationは未push2f05588c56c7c8aa0461ff83d3770ddbd51e9ca0かつrunner34511検証中なのでcleanup対象外。終了済みaudit subagentsは新worktree未作成。作成者側でmerge後に成果/custody保全・実行終了確認・worktree remove・branch cleanupまで担当し、人間の手作業前提にしない。今回まだ削除・DB操作なし。
