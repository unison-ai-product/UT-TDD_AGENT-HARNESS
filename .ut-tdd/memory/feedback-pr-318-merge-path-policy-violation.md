---
memory_id: memory:feedback:pr-318-merge-path-policy-violation
kind: feedback
title: "PR #318 merge path policy violation"
tags: ["d3a", "incident", "merge-gate", "pr"]
updated_at: 2026-08-14T06:03:14.997Z
---

2026-08-14 PR #318 exact HEAD 8ff56bc4はClaude review PASS blocking 0、CI全green後にmerge commit ca9d231bへ着地した。ただしClaude PR担当へ与えた指示がgh pr mergeを明示し、正規ut-tdd pr merge --pr 318を迂回した。これはCLAUDE.md Git Rules違反。以後Claude/Codexいずれもclosingは正規wrapperのみを使用し、gh pr merge直叩きを指示・実行しない。D2-D backstopの検知対象として保持する。
