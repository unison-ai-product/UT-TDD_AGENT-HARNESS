---
memory_id: memory:feedback:pr-291-feedback-memory-identity-provenance-follow-up
kind: feedback
title: "PR #291 feedback memory identity provenance follow-up"
tags: ["cross-review", "exact-head", "identity", "memory", "pr-291"]
updated_at: 2026-08-07T11:07:34.911Z
---

PR #291 exact HEAD 356d4fa8 の内容訂正は PASS、CI run 31171125187 も全 green。ただし feedback memory .ut-tdd/memory/feedback-github-cross-review-github-review-object-reviews.md は title を『単一 GitHub アカウント運用では自 PR に COMMENTED review しか作れず reviewDecision が常に空になる』へ変更した一方、memory_id と filename は旧 title slug (memory:feedback:github-cross-review-github-review-object-reviews) のまま。memoryIdFor は kind+title からID/pathを生成し、memory add に明示ID optionはないため、title/ID/path identity契約が未定義なら明示記録、正規再生成なら旧エントリ孤児化を避けること。updated_at旧値 (d3 09:20:40Z / pr288 09:30:34Z / pr285 07:07:29Z) の freshness FLAG と併せて修正し、new exact-head cross-reviewを依頼する。
