---
memory_id: memory:user:db-github-forward
kind: user
title: "駆動モデルDBとGitHubをForward再合流パイプラインで連動する"
tags: ["cross-review", "drive-model", "execution-ledger", "forward", "github", "reentry"]
updated_at: 2026-07-14T08:48:02.889Z
---

Execution Ledgerを制御背骨として、off-Forward episodeと必須drive_model選択、駆動モデル内検証、reentry certificate、Forward中間テスト、Forward合流後テスト、draft PR自動生成、別runtime/modelのcross-review、merge gate、main mergeを一つのdurable event系列にする。GitHub状態を正本にせずHARNESS DBから冪等投影・再送し、GitHub障害時もepisode・証跡・再入位置を失わない。main mergeはcross-review PASS、必須CI、reentry証明、最新HEAD一致を満たす場合だけ許可し、branch protectionに応じ自動mergeまたは人承認へ分岐する。
