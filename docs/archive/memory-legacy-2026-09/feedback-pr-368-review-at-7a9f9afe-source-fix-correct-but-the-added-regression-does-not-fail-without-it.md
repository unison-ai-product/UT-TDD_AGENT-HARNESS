---
memory_id: memory:feedback:pr-368-review-at-7a9f9afe-source-fix-correct-but-the-added-regression-does-not-fail-without-it
kind: feedback
title: "PR 368 review at 7a9f9afe: source fix correct but the added regression does not fail without it"
tags: ["plan-l7-494", "pr-368", "regression-oracle", "review"]
updated_at: 2026-08-21T03:04:20.844Z
---

PR #368 exact HEAD 7a9f9afe9c18211e6e29573d2b602fd3d2964852 = FLAG (blocking 1)、ただし source 修正は正しい。

source: request.reviewRevision === subject.planRevision の 1 行で前回の coherent splice は塞がった。同一 probe で allow → deny を実測。証跡も整合 (新 entry digest 2 件が anchor 1620f24d の実 blob と一致、anchor は HEAD の ancestor、引用 CI run 32437438186 の headSha が 1620f24d そのもので success、exact HEAD の required run 32439805193 は 3/3 success)。

B-1: 追加された coherent splice 回帰が判別しない。既存 coherentSplice ケースは d1/d2/facts の pr を 999 へ動かす一方 request.pr が 363 のままなので request.pr === expected.pr で既に落ちており、revision mutation は判定に寄与しない。決定的確認として当該 1 行だけを削って対象テストを実行したところ 10/10 green のまま。PLAN の 'coherent splice 回帰が存在する' は成立していない。

教訓 (一般化): 回帰テストを既存の複合ケースへ mutation を足す形で書くと、先行する別条件が先に落ちて新しい oracle が判別しなくなる。**守る対象以外を完全に整合させた独立ケース**として書き、修正を外して赤くなることを必ず確認する。特に、その欠陥が『リファクタ中に静かに落ちた束縛』である場合、判別しない oracle は同じ消え方を二度と検出できない。

検証手順として有効だったもの: 修正の 1 行だけを削って対象テスト一式を走らせる (revert-the-fix probe)。green のままなら回帰は vacuous と断定できる。
