---
memory_id: memory:project:repository-placement-must-separate-git-durable-state-and-scratch
kind: project
title: "Repository placement must separate Git, durable state, and scratch"
tags: ["filesystem", "git", "issue-141", "onedrive", "runtime-state", "windows", "worktree"]
updated_at: 2026-07-23T02:25:56.073Z
---

Repository を同期フォルダ配下に置いたまま、worktree の実体だけを外へ出しても配置負債は解消しない。
worktree は primary clone の共通 `.git` にある refs、locks、worktrees metadata を参照し続ける一方、
HARNESS の DB、lease、lock、一時状態は cwd ごとの `.ut-tdd` に分裂するためである。

2026-07-23 の実測では、OneDrive 配下の共通 `.git` に 38 worktree が登録され、38 全てに
`.ut-tdd/`、22 に個別 `harness.db` が存在した。primary の DB は 3,859,845,120 bytes
（3.86 GB / 3.595 GiB）まで増加していた。これは OneDrive 単体の性能問題ではなく、
Git 正本の共有と runtime state の分裂が同時に起きる topology 契約の欠落である。

正規移行は OneDrive 外の `C:\dev\ut-tdd\source` に new clone を作り、必要な worktree だけを
`C:\dev\ut-tdd\worktrees` へ再生成し、scratch を `C:\dev\ut-tdd\scratch` に分離する。
既存 clone / worktree の生移動は禁止する。commit/push 済 HEAD を基準に移行し、巨大 DB はコピーせず
正規入力から再構築する。repository lineage ごとの canonical state root、durable/cache/scratch/evidence
の所有境界、scratch の owner/TTL/terminal receipt を設計と検証契約の対として持つこと。

この負債の正本は GitHub Issue #141。DB 肥大は #118、worker 資源境界は #124、Bun 廃止は #134 が
それぞれ担当する。新しい移行・診断経路で Bun を起動してはならず、Node/Rust 制御面を使う。
