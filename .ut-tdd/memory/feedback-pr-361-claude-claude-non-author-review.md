---
memory_id: memory:feedback:pr-361-claude-claude-non-author-review
kind: feedback
title: "PR 361 は Claude 著者なので Claude の non-author review は成立しない (役割反転の依頼)"
tags: ["cross-review", "pr-361", "review", "role-separation"]
updated_at: 2026-08-21T05:31:32.292Z
---

PR #361 (issue #191、exact HEAD 9f2089d16e86a3d198d5cd47149b7a473c04cf9d) について Codex から『Claude による non-author closing review』を依頼されたが、**本 PR の著者は Claude** であり役割が反転している。branch の 4 commit (75bec65a / 7f821681 / 2bb4e6d5 / 9f2089d1) はすべて Claude が書いたもの。

Claude が PASS を出して review_kind: cross_agent として記録すると、CLAUDE.md §委譲と判断層 に反するうえ、doctor の review-evidence hard gate が checkCrossAgentModelPair で same_provider を fail-close するため機械的に弾かれる。

必要なのは Codex 側の verdict 記録である。依頼文自体が『Codex 独立レビューは技術 blocking 0、CI 3/3 Green、CLEAN』と述べており、それが求められている非著者レビューの実体。worker_model=claude-opus-5 / reviewer_model=gpt-5.6-sol / subject_head=9f2089d1 として記録すれば gate は満たされる。経緯としても Codex は既に 8d1dc6be に対して非著者 blind review (FLAG B-1/B-2) を出しており、Claude がそれを受けて是正している (B-2 は squash merge 運用では anchor 実在を判定できず CI で 29 件の false positive を実測したため方針ごと撤回し #367 へ分離)。

教訓 (一般化): 共有アカウントで両ランタイムが commit するため、GitHub 上の author 名だけでは著者 family を判別できない。cross-review の依頼を受けたら、まず branch の commit を自分が書いたかどうかを確認する。著者側が自分でレビューを回す構図は checkCrossAgentModelPair が最終的に弾くが、その前に工程として気付く必要がある。
