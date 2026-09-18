---
memory_id: memory:feedback:squash-merge-makes-anchor-unreachable-from-main
kind: feedback
title: "Squash merge makes anchor unreachable from main"
tags: ["anchor", "ci", "gate-design", "issue-191", "lesson", "pr-361", "squash-merge"]
updated_at: 2026-08-20T11:38:57.188Z
---

2026-08-20、PR #361 で anchor_commit の実在検査を入れたところ CI で 29 件の正当な anchor が unknown_anchor_commit になり、是正方針そのものを撤回した。squash merge 運用の repo における恒久的な制約なので記録する。

事実。PLAN-L6-101 の anchor 040a9f85955db39286b46f093db2627dba4513f5 は PR #358 の pre-merge head であり、その head で CI が 3/3 green を出して merge の根拠になった正当な anchor である。しかし #358 は squash merge されて 03e61b86 になり branch も削除されたため、git merge-base --is-ancestor は NO を返す。CI の fresh clone は refs/heads/* と refs/tags/* しか fetch しないので object 自体が存在しない。

結論。squash merge 運用では「anchor が main から到達不能」ことが正常状態であり、捏造 anchor と区別できない。main 基準の実在検査は原理的に成立しない。これは PR #359 のレビューで私が PF1 行の merge commit ee76dd27 が main から到達不能だと指摘したときの背景でもある。あのとき私は「main の履歴が書き換えられた」と説明したが、squash merge や branch 削除でも同じ観測になるため、原因の断定は保留すべきだった。到達不能という観測から履歴書き換えを結論しない。

ローカルで再現しなかった理由も重要である。私のローカル clone には PR branch を fetch した残骸があり anchor object が存在していたため、実在検査はローカルで全件通った。gate を追加するときに「ローカルで通った」を根拠にしてはならない。CI の clone 形状 (actions/checkout が何を fetch するか、squash merge 後に何が残るか) を前提条件として明示的に確認する。

B-2 (実在しない 40 桁 hex が anchor として通る) を閉じる正しい形は、基準点を main ではなく PR 自身に置くことである。PR が新規に追加した entry の anchor だけを、その PR の head から到達可能かで検査する。新規かどうかは PR diff 由来なので自己申告に依存せず、記録した本人の branch 上なら anchor は必ず到達可能なので全 0 SHA は落ちる。merge 後に到達不能になっても検査済みなので再検査しない。

一般化すると、証跡の永続検証は「記録時点で検証し、その結果を固定する」設計にしないと、履歴の正規化 (squash / rebase / branch 削除) で後から検証不能になる。永続的に再検証できることを前提にした gate は、その前提が repo の merge 戦略に依存していないかを確認する。
