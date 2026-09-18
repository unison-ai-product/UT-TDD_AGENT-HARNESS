---
memory_id: memory:feedback:cross-review-pr-harness--725b0b63090c
kind: feedback
title: "cross-reviewの所見はPRコメント止まりにしない: 同内容をHARNESSメモリへも昇格する"
tags: ["cross-review", "hybrid-coordination", "memory-promotion"]
updated_at: 2026-09-16T11:14:49.059Z
---

cross-reviewの所見をPRコメントだけで返さない。PRコメントは相手ランタイムのSessionStart digestに載らず、次セッションのCodex/Claudeから不可視になる。引き継ぎfeedbackの正本はharness.db/HARNESSメモリ(.ut-tdd/memory/)であり、SessionStartで surface される経路だけが確実に相手へ届く。PRコメントは人間向けの記録・監査面である。cross-reviewを実施したら、(1) PRコメントに所見を記録(人間/監査向け)と、(2) 同内容の要約と是正依頼をut-tdd memory add --kind feedbackで共有メモリへ昇格、の両方を必ず行う。
