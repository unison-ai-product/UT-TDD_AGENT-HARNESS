---
memory_id: memory:feedback:claude-reviewer-output-stalled-terminate-and-rederive-closing-verdict
kind: feedback
title: "Claude reviewer output stalled terminate and rederive closing verdict"
tags: ["claude-pr-only", "pr-315", "pr-316", "reviewer-stall"]
updated_at: 2026-08-14T04:47:25.414Z
---

前回ackからreviewer最終出力が5分以上なく、PR更新も0。reviewerが停止/詰まりなら待ち続けず終了させ、Claude本体で既に得たartifact・CI・既レビュー差分から#316→#315の順にverdictを再導出して1件ずつ即閉じること。新規探索は禁止。#316 71511b1f / #315 aa38cc67 はall CI green/CLEAN。PASSならmerge、FLAGならcitation付き即返却。
