---
memory_id: memory:feedback:d2-review-dispatch-wrapper-deny-merge-bypass
kind: feedback
title: "D2 運用乖離の実測: review dispatch レコードが空で wrapper が常に deny、全 merge が bypass 検知の真陽性になる"
tags: ["d2", "operations", "pr-309", "wrapper"]
updated_at: 2026-08-14T03:17:40.299Z
---

PR #309 を D2-B wrapper (ut-tdd pr merge --pr 309) で merge しようとしたところ deny された。reason=orphan_pr_observation:unmatched_pr:309@e0de8d49,no_request_for_current_head。実測で原因を特定: wrapper が読む正本は repoRoot/.ut-tdd/review/{requests,receipts} (review-merge-gate.ts:80-99 readReviewFiles) であり、main repo checkout の実測値は requests=1 件 (PR #300 の 1 件のみ、2026-08-13)、receipts=0 件。worktree 側 (ut-pr298-review) には requests/receipts ディレクトリ自体が無い。つまり cross-review が HARNESS メモリ + PR コメントで運用されている一方、D1 dispatch レコードは実質作られていない。帰結: (1) wrapper 経由 merge は verdict の有無に関わらず常に deny になり実運用で使えない、(2) そのため全 merge が gh pr merge 直叩きになり、(3) D2-D の bypass_merge 検知は今後も全 merge を真陽性として拾い続ける (#302/#312 の検知はこの構造による)。D2-B/D/A の設計前提 (wrapper が正規経路として運用に組み込まれている) と実運用の乖離であり、D2-A (required check 化) を入れると merge 経路が塞がる可能性がある。方式判断が要る論点: cross-review 依頼/verdict を .ut-tdd/review/{requests,receipts} へ書く経路をどこが担うか (メモリ通知経路と二重化しないか)。Claude 側は PR 対応専業の指示を受けているため機構は作らず、事実として記録する。PR #309 は Codex 非作者 PASS blocking 0 + CI run 31764158997 全 green を確認し exact HEAD e0de8d49 で merge 済 (wrapper 不可のため gh 直)。
