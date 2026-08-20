---
memory_id: memory:project:shared-harness-memory-has-not-been-committed-since-2026-08-13-and-is-split-per-worktree-488-files-here-vs-165-167-in-codex-worktrees-and-163-in-main
kind: project
title: "Shared HARNESS memory has not been committed since 2026-08-13 and is split per worktree: 488 files here vs 165-167 in Codex worktrees and 163 in main"
tags: ["handover", "harness-memory", "hybrid", "measurement", "p0-adjacent"]
updated_at: 2026-08-19T11:54:36.626Z
---

共有 HARNESS メモリが **2026-08-13 以降 git へ一切 commit されておらず、worktree ごとに分裂している**。2026-08-19 実測。P0 #2 の配送 parity (inbox の配送順) とは**別軸**の問題であり、混同しないこと。

## 実測

- origin/main の `.ut-tdd/memory/` = **163 ファイル**。main で `.ut-tdd/memory/` に触れた最新 commit は **d583067d (2026-08-13 12:16:40 +0900)**。以降 6 日間 0 commit。
- Claude worktree (`c:/Users/micro/OneDrive/Desktop/UT-TDD-agent-harness`) = disk 上 **488 ファイル**、うち git tracked **145**、**untracked 342**。
- Codex worktree `C:/Users/micro/ut-r4-473` = **165 ファイル**。
- Codex worktree `C:/Users/micro/ut-issue314-doctor-profile` = **167 ファイル**。
- `.gitignore` に `.ut-tdd/memory/` の除外規則は**無い** (`git check-ignore -v` で確認、除外されていない)。tracked 対象として設計されている。

つまり Codex 側の worktree はほぼ main の 163 件しか持たず、**Claude worktree にしか存在しないファイルが約 325 件**ある。`.ut-tdd/memory/` は working tree 内のパスなので **git worktree ごとに独立**し、commit されない限り相手ランタイムからは読めない。

## 影響

CLAUDE.md は「永続教訓は共有 HARNESS メモリへ昇格する (`ut-tdd memory add`、正本 `.ut-tdd/memory/`)」を引き継ぎの正本経路と定めるが、**commit されるまで共有されない**ため、この 6 日間に書かれた verdict / pre-gate / 監査結果は相手ランタイムから機械的に読めない状態だった。

2026-08-19 の実運用で実際に発生した観測: Codex が workspace `99a574e9…` で書いた `memory:project:claude-queue-non-forward-critical-backlog-after-pr343` を Claude worktree で探しても存在せず、内容は **inbox 通知の body 経由でしか届かなかった**。逆に Claude が本日書いた verdict 群 (PR #341 / #343 の closing、U-1 pre-gate、P0-2 監査、Pack 監査、issue #108 / #344 pre-gate) も Codex worktree の `.ut-tdd/memory/` には存在しない。

実際に機能していた伝達経路は **(a) PR comment と (b) inbox 通知の body** の 2 本であり、メモリファイル自体ではなかった。「verdict は PR comment と memory の両方へ書く」という既存の規律が、結果的にこの分裂を吸収していた (memory 側が届かなくても PR comment が届いた)。

## 注意 (誤った対処をしない)

- **一括 commit で解決しようとしない**。342 件には他セッション由来のものも含まれ、内容確認なしに stage するのは Git Rules (「自分が authored した意図ファイルのみを path 明示で stage」) に反する。
- **P0 #2 の配送 parity 修正と混ぜない**。あちらは inbox entry の配送順と retirement、こちらはメモリファイルの git 伝播であり、原因も修正面も別。
- 本件は Claude の PR 運用レーンの守備範囲外 (実装・PLAN authoring をしない)。**観測の記録に留め、機構化は所有 PLAN 側で判断すること**。
