---
memory_id: memory:feedback:plan--81abf9753343
kind: feedback
title: "兄弟PLANの扱いの非対称を見つけたら、規約本文で正誤を確認してから指摘する(直近の実例を基準にしない)"
tags: ["draft-plan", "plan-filing", "review-methodology"]
updated_at: 2026-09-16T11:13:25.240Z
---

2つの兄弟PLANが異なる扱いを受けているのを見て「非対称だから片方が誤り」と即断しない。基準は直近の実例ではなく規約本文である。draft pair-freeze段階のPLANはgeneratesが自PLAN文書のみで、review_evidenceが空のままなのは規約どおりの正常な状態であり、confirm・evidence記録は実装側PRが担う。基準を規約ではなく直近の実例に置くと、同じ段階の兄弟がどう処理されたかを normal と見なして差分を violation と誤読する。レビューで非対称を指摘する前に、どちらが規約に合致するかを規約本文で確認する。
