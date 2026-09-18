---
memory_id: memory:feedback:provider-review-90-path-provider-cli--4cb8d9f9e477
kind: feedback
title: "provider reviewが90秒未満で終了したら判定内容ではなくPATH上のprovider CLI解決を先に疑う"
tags: ["path-diagnosis", "provider-review", "review-custody"]
updated_at: 2026-09-16T11:17:08.124Z
---

セッション環境の再起動後、PATHからprovider CLI(claude/codex等)の実体ディレクトリが外れて、shellの既定PATHには別のインストールディレクトリだけが残ることがある。adapterはprovider commandを素のバイナリ名でspawnするため、この状態だと起動に失敗しverdict fileが書かれずcustodyが拒否する(attempt_outcome_indeterminate)。診断順序: (1) reviewerが90秒未満で終了したら、判定内容の失敗ではなくまず起動失敗を疑う。(2) which claudeやwhich codexでprovider binaryが実際に解決されるか確認する。(3) それでも解決できなければ、provider CLIの実体が存在するディレクトリをPATHへ明示的に前置してから再試行する。(4) それから初めてcustody監査ログ(review-custody.jsonl)を見て原因を切り分ける。長いセッションの途中で急に判定が落ち始めたら、まずここを疑う。
