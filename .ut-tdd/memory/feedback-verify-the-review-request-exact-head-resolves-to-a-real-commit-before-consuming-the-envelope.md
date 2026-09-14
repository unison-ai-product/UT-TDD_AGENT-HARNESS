---
memory_id: memory:feedback:verify-the-review-request-exact-head-resolves-to-a-real-commit-before-consuming-the-envelope
kind: feedback
title: "Verify the review request exact HEAD resolves to a real commit before consuming the envelope"
tags: ["exact-head", "fail-close", "issue-456", "pr-455", "review"]
updated_at: 2026-08-28T01:38:34.144Z
---

review request を受領したら、**レビュー実行前に exact HEAD が実在する commit へ解決できるかを必ず確認する**
(`git cat-file -t <sha>`)。書式が 40-hex でも実在するとは限らない。

**Why**: `review live-dispatch` の検証は `^[0-9a-f]{40}$` の書式のみで
(`src/feedback/review-attestation.ts:51,73`)、SHA の実在性も PR の実 HEAD との一致も検査しない。
well-formed だが実在しない SHA がそのまま canonical request として永続化される (issue #456)。
実在しない HEAD に receipt を発行すると、request digest が捏造 SHA を含んだまま canonical identity に
なり、merge gate が exact HEAD 照合で deny し続けるため **その request は恒久的に閉じられない**
(#448 で観測された袋小路と同型)。

**実例 (2026-08-28、PR #455)**: request `96e8d675…` の `exactHead` が
`2b531830a2b7ba8f80c60e68dc95ca804256a37e` を宣言していたが、この object は存在せず、
prefix `2b531830` を持つ唯一の object は実 HEAD `2b531830de9f40ffcb09b81d19c97802072b76ec` だった。
**先頭 8 桁だけ一致し以降が異なる**。memory id / branch 名 (`pr-455-exact-head-2b531830-…`) は
8 桁 prefix しか持たないため、そこから 40 桁 SHA を composeすると残り 32 桁が捏造される。
偶然の prefix 衝突ではなくこの生成経路を疑うのが正しい。

**How to apply**:
1. envelope 受領後、live-consume を走らせる前に
   `git cat-file -t <exactHead>` と `git rev-parse --disambiguate=<先頭8桁>` を実行する。
2. 解決できなければ **attempt を消費せず fail-close** し、正しい SHA での再 dispatch を依頼する。
   実 HEAD をレビューして偽 SHA の receipt を出してはならない (receipt の意味が壊れる)。
3. dispatch する側は SHA を memory title / branch 名から composeせず、
   `git rev-parse HEAD` か `gh pr view <n> --json headRefOid` の出力をそのまま渡す。

関連: [[feedback-verify-upstream-canonical-plan-before-judging-a-contract-point-undetermined-or-po-bound]]
