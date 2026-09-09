---
memory_id: memory:feedback:pr-521-merged-at-main-84cd7f89-merge-gate-deny-came-from-a-peer-worktree-orphan-request-cleared-by-class-r-retry--44b070cc9b4d
kind: feedback
title: "PR 521 merged at main 84cd7f89: merge gate deny came from a peer worktree orphan request, cleared by class R retry"
tags: ["class-r", "issue487", "merge", "merge-gate", "pr521", "worktree"]
updated_at: 2026-09-08T05:07:15.287Z
---

PR #521 (issue #487 contract freeze: PLAN-L7-530 / PLAN-REVERSE-530 pair-freeze) を 2026-09-08 に merge。merge commit と新 main は 84cd7f896f7dfbd67b38b250b5a943eaee3f6640、post-merge main CI (run 34188607300) harness-check success。merge は `ut-tdd pr merge --pr 521` 経由 (decision merge / reason merge_ready)。

merge 前に merge gate が deny した (pending_request_for_head,state:requested,verdict_missing)。原因は gate が `reviewInputRoots` で **全 worktree root** の requests/receipts を読むため、Codex が自分の worktree (C:/dev/ut-issue487-…-v2) に publish した request 616b8647 が verdict 未取得の orphan として残っていたこと。私の request a1f986ca は receipt 済みだった。解除は PLAN-L7-518 §2.2 の class R canonical retry (同一 memoryId `memory:project:pr-521-exact-1cb75219-r5-closing-review` で再 dispatch し同じ digest に attempt を積む) で行い、独立に PASS-WEAK / blocking 0 を得て終端した。ファイル削除・verdict 手書きは行っていない。

**Why:** merge gate の deny 理由が「自分の request の欠落」に見えても、実際には別 worktree の peer runtime の orphan であることがある。gate の入力範囲が worktree 横断であることを知らないと、原因を自分側に誤帰属して不要な再レビューを走らせる、あるいは削除で bypass してしまう。

**How to apply:** deny が pending_request_for_head のときは、全 worktree root の requests を head で突合し receipt の有無を確認する。orphan が peer runtime のものなら、その memoryId で class R canonical retry を回して verdict で終端する。retry が FLAG を返したらその判定に従い merge しない。閉じたのは contract freeze のみで、物理撤去実装は実装 PR の head で closing review を取り直す (preflight receipt を流用しない)。
