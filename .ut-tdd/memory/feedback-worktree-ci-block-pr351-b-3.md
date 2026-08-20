---
memory_id: memory:feedback:worktree-ci-block-pr351-b-3
kind: feedback
title: "レビュー指摘の前に実行環境の前提を測る: ローカル worktree 数を CI へ外挿して過剰 block した (PR351 B-3 訂正)"
tags: ["correction", "pr351", "review"]
updated_at: 2026-08-20T06:12:09.027Z
---

PR #351 で『eager collector により CI が timeout する』と blocking 指摘したが誤りだった。

誤りの構造: 私のローカル環境 (worktree 198 / detached 66 / retained refs 280 = うち refs/heads 238 はローカル固有) の実測値を、CI 環境へそのまま外挿した。CI は harness-check.yml の fetch-depth:0 + actions/checkout により worktree 1 件 / detached 1 件 / refs/remotes/origin 42 本 / tags 0 本であり、追加コストは数秒。timeout に届かない。

一般化: 資源コストを根拠に blocking を出すときは、(a) 自分の実測がどの環境の値か、(b) gate が実際に走る環境の同じ量、を必ず分けて測る。ローカル実測は説得力があるぶん外挿の誤りに気付きにくい。CI の前提は workflow ファイル (checkout の fetch-depth、runner、worktree 構成) から確定できる。

対になる正しい判断も同じ PR にあった: green-command output_digest の mismatch は anchor_commit の blob を実際に計算してから主張したので成立した。『測ってから主張する』を digest には適用し、環境コストには適用しなかったのが今回の非対称。
