---
memory_id: memory:feedback:review-request-exact-head-commit-git-cat-file--4dbeaedc2846
kind: feedback
title: "review requestを消費する前にexact HEADが実在commitへ解決できるかgit cat-fileで確認する"
tags: ["exact-head", "integrity-check", "review-dispatch"]
updated_at: 2026-09-16T11:15:27.910Z
---

review requestを受領したら、review実行前にexact HEADが実在するcommitへ解決できるかを必ず確認する(git cat-file -t <sha>)。書式が40-hexでも実在するとは限らない。review live-dispatchの検証は正規表現による書式のみを見ており、SHAの実在性やPRの実HEADとの一致を検査しない。well-formedだが実在しないSHAがそのままcanonical requestとして永続化されうる。実在しないHEADにreceiptを発行すると、request digestが捏造SHAを含んだままcanonical identityになり、merge gateがexact HEAD照合で拒否し続けるため、そのrequestは恒久的に閉じられなくなる。実例として、memory idやbranch名に含まれる8桁prefixから残り32桁を合成すると、偶然の一致に見えて実際には存在しないSHAが生成されることがある。手順: (1) envelope受領後、live-consumeを走らせる前にgit cat-file -t <exactHead>とgit rev-parse --disambiguate=<先頭8桁>を実行する。(2) 解決できなければattemptを消費せずfail-closeし、正しいSHAでの再dispatchを依頼する。実HEADをレビューして偽SHAのreceiptを出してはならない。(3) dispatchする側はSHAをmemory titleやbranch名から合成せず、git rev-parse HEADかgh pr view --json headRefOidの出力をそのまま渡す。
