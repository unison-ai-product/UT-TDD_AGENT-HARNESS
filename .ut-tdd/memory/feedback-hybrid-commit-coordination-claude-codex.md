---
memory_id: memory:feedback:hybrid-commit-coordination-claude-codex
kind: feedback
title: "Hybrid commit coordination (Claude<->Codex)"
tags: ["git", "hybrid", "po-rule"]
updated_at: 2026-07-08T08:13:38.948Z
---

history 書き換え前に git log/reflog で相手ランタイムの commit を確認。他ランタイムの commit を reset/revert/checkout/force で破棄しない。working tree の foreign 変更は既定で相手の正規作業とみなす。自分の成果は相手の commit の上に積み、path 明示 stage のみ (git add -A 禁止)。foreign staged が居る時は git commit -- <path> 形式必須 (b63d99c 混線→a863c63 復旧の教訓)。
