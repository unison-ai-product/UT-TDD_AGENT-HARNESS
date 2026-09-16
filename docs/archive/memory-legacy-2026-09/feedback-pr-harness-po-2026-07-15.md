---
memory_id: memory:feedback:pr-harness-po-2026-07-15
kind: feedback
title: "レビュー所見はPRコメント止まり禁止: HARNESSメモリへ昇格が正 (POルール2026-07-15)"
tags: ["cross-review", "memory-promotion", "po-rule"]
updated_at: 2026-07-15T08:24:13.096Z
---

PO ルール (2026-07-15): cross-review の所見を PR コメントだけで返さない。PR コメントは相手ランタイムの SessionStart digest に載らず、次セッションの Codex/Claude から不可視になる (chat 止まり・PR 止まりの教訓と同型)。

**Why:** 引き継ぎ feedback の正本は harness.db / HARNESS メモリ (.ut-tdd/memory/) であり、SessionStart で surface される経路だけが確実に相手へ届く。PR コメントは人間向けの記録・監査面。

**How to apply:** cross-review を実施したら (1) PR コメントに所見を記録 (人間/監査向け) + (2) 同内容の要約と是正依頼を ut-tdd memory add --kind feedback で共有メモリへ昇格、の両方を必ずやる。関連 [[feedback-pr-merge-cross-family-review-2026-07-14]]
