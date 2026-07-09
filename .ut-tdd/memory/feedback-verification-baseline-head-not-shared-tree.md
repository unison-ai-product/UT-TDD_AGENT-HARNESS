---
memory_id: memory:feedback:verification-baseline-head-not-shared-tree
kind: feedback
title: "Verification baseline = HEAD, not shared tree"
tags: ["hybrid", "po-rule", "verification"]
updated_at: 2026-07-08T08:13:56.099Z
---

引き継ぎ・検証の基準点は commit/push 済 HEAD ただ一つ。hybrid では working tree を相手ランタイムが常時書き換えるため full tree の計測値は transient で非正本。測定値が動いたら相手を疑う前に自分が動く面を測っていないかを先に疑う。引き継ぎ feedback は harness.db feedback_events から受け取る (PLAN-L7-110)。prose handover (CURRENT.json) は補助。
