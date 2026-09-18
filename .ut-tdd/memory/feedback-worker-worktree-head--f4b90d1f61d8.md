---
memory_id: memory:feedback:worker-worktree-head--f4b90d1f61d8
kind: feedback
title: "ドキュメント範囲縮小をworkerへ委譲するときは「削除」ではなく対象節を名指しして「改訂」と指示し、共有worktreeのHEAD分岐を書き込み前に確認する"
tags: ["delegation", "shared-state", "worktree"]
updated_at: 2026-09-16T11:13:31.438Z
---

委譲時に「HMAC方式を降ろす/該当箇所を削除する」のように曖昧な「削除」指示を出すと、workerがファイル全体を削除して返すことがある。ドキュメント範囲を縮小する委譲では、改訂対象の節を名指しし、置き換え後の文章またはその形を示し、frontmatterと他の節はそのまま残ることを明示する。加えて、共有worktreeへ書き込みを委譲する前に、そのworktreeの実HEAD (git rev-parse HEAD) とGitHub PRのHEADを比較する。PR HEADだけを見て「停滞している」と判断しない — ローカルworktreeはPR HEADを動かさずに進むことがあり、実HEADがPR HEADと食い違っていれば別セッションが同じブランチを操作中である兆候であり、書き込みを止める。
