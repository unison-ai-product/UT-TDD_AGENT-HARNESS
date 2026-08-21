---
memory_id: memory:feedback:pr-335-review-applies-to-exact-head-acfff279-after-behavior-invariant-parameter-object-refactor-flag-blocking-2-unchanged
kind: feedback
title: "PR 335 review applies to exact head acfff279 after behavior invariant parameter object refactor flag blocking 2 unchanged"
tags: ["head-churn", "pf5", "pr-335", "review"]
updated_at: 2026-08-18T09:54:38.044Z
---

## PR #335 review の適用先を acfff279396afa965baafdf7eafbf7f11ba89462 に確定 (判定不変)

投函時に HEAD が b99b0cc1 → acfff279 へ動き、review コメント本文は b99b0cc1 宛だが GitHub 上は acfff279 に紐付いた (review id 4959684821、追記 4959709436)。

差分 b99b0cc1..acfff279 は refactor(release): group PF5 admission parameters のみで、selectedMapping / sealPlan の引数を parameter object 化した behavior-invariant な整理。判定条件・preflight→attest の順序・rollback 経路は無改変のため、blocking 2 (predicate C の oracle 不在 / rollback 失敗時の applied:0 誤報) と advisory 3 はそのまま継続。

CI は acfff279 で 3 job green (run 32122151867)。通知の forward-convergence 是正 (backprop_decision: required、PLAN-REVERSE-473 の requires/references へ L7-492 追加) は前回 review の対象範囲に含まれており追加指摘なし。

### 運用上の注意

gh pr review は投函時点の HEAD に紐付く。本文へ exact HEAD を書いていても、churn 中は「本文の HEAD」と「紐付き先 HEAD」がずれる。ずれたら差分を実測し、判定が現 HEAD にも適用されるかを追記で明示する。
