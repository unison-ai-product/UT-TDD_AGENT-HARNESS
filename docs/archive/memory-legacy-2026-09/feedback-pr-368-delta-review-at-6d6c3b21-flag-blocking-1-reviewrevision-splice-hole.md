---
memory_id: memory:feedback:pr-368-delta-review-at-6d6c3b21-flag-blocking-1-reviewrevision-splice-hole
kind: feedback
title: "PR 368 delta review at 6d6c3b21: FLAG blocking 1 (reviewRevision splice hole)"
tags: ["identity-binding", "plan-l7-494", "pr-368", "review"]
updated_at: 2026-08-21T01:36:53.587Z
---

PR #368 exact HEAD 6d6c3b21ed7f1ef692830db9e3d8e2bbf317cc41 の non-author closing delta review = FLAG (blocking 1)。

B-1: identity chain を subject/expected 直接照合から request 経由へ組み替えた際、PLAN revision の錨だけが外れた。request.reviewRevision は validReviewRequestShape で isString としか検査されず、どこでも subject.planRevision と突き合わされない。d1.reviewRevision と authorizedEntry.reviewRevision はその自由な request.reviewRevision としか比較されないため、3 箇所を同時に揃えた coherent splice が通る。exact HEAD の worktree で fixture の request/d1/authorizedEntry の reviewRevision だけを別値へ揃えたところ decision=allow を実測。f86a73fe には d1.reviewRevision === subject.planRevision があったので今回の delta で入った退行であり、PLAN-L7-494 §2 の 'control exact HEAD / PLAN revision を D1・D2・receipt の subject として相互照合する' に反する。是正は request.reviewRevision === subject.planRevision の 1 行。

教訓 (一般化): splicing 回帰テストが '片側だけ書き換える' 形しか無いと、複数フィールドを整合させた coherent splice を素通りさせる。identity chain を直接照合から中継オブジェクト経由へ組み替えるリファクタでは、中継側の各フィールドが元の錨へ束縛されているかを 1 つずつ確認する必要がある。中継の導入は錨の本数を暗黙に減らす。

前回 B-1 (IMP-077) は解消を実測確認。tests_green_at を 12:02:40Z へ引き上げ、anchor を 24567f43 へ張り替えて digest 4 件が実 blob と一致。required CI run 32435665636 は Linux/Windows とも success。

PASS 側: shape 検査の実装 (validReviewRequestShape/validDispatchEntryShape/validMergeDecisionShape/validMergeFactsShape/validReviewSourceShape/validSealedPlanShape)、reviewPartsSupplied と validReviewShape の分離による invalid_input / review_missing の区別、reviewIsReady への d1.breaches/d1.reasons/facts.state 追加、CI/QA 観測順序。

非 blocking: (N-1) verdict 等値 3 本の削除で PASS と PASS-WEAK の食い違いが通る、(N-2) facts.state === 'OPEN' 要求は PR merge 後の promotion を永久 deny にする、(N-3) 観測順序違反が identity_mismatch へ丸められている、(N-4) evidenceDigest の JSON.stringify key 順序依存。
