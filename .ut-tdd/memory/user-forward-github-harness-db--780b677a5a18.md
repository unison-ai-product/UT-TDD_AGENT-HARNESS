---
memory_id: memory:user:forward-github-harness-db--780b677a5a18
kind: user
title: "Forward再合流パイプライン設計原則: GitHubを正本にせずHARNESS DBから冪等投影・再送する"
tags: ["execution-ledger", "forward-pipeline", "po-decision"]
updated_at: 2026-09-16T11:16:11.786Z
---

Execution Ledgerを制御背骨として、off-Forward episode、必須drive_model選択、駆動モデル内検証、reentry certificate、Forward中間テスト、Forward合流後テスト、draft PR自動生成、別runtime/modelのcross-review、merge gate、main mergeを一つのdurable event系列にする。GitHub状態を正本にせずHARNESS DBから冪等投影・再送する設計とし、GitHub障害時もepisode・証跡・再入位置を失わない。main mergeはcross-review PASS、必須CI、reentry証明、最新HEAD一致を満たす場合だけ許可し、branch protectionに応じ自動mergeまたは人承認へ分岐する。
