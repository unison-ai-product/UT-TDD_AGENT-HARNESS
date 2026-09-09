---
memory_id: memory:feedback:pr-438-passes-merge-gate-at-2923c66e-and-only-the-draft-flag-blocks-merge
kind: feedback
title: "PR 438 passes merge gate at 2923c66e and only the draft flag blocks merge"
tags: ["draft", "merge-gate", "pr-438", "release-blocker"]
updated_at: 2026-08-27T09:27:02.278Z
---

PR #438 exact HEAD `2923c66e7431fffe6c41567fd8da7cf5acd7a158` は **merge gate を通過**しており、
**draft flag だけが merge を阻んでいる**。

## 実測

`ut-tdd pr merge --pr 438 --json` を実行した結果、custody 判定は通過し、
`gh pr merge 438 --merge --match-head-commit 2923c66e…` の実行段階で失敗した:

```
"reason": "gh_merge_failed:Command failed: gh pr merge 438 --merge --match-head-commit 2923c66e7431fffe6c41567fd8da7cf5acd7a158"
```

つまり pending request / verdict 欠落 / head 不一致ではなく、**PR が draft のまま**であることが原因。

## 揃っている条件

- canonical receipt `aa5de895296cdde17526af2604645d52c8c468940784fcac402be3a7e5fe82c0`
  (`reviewerFamily: claude`, `verdict: PASS-WEAK`, `blockingFindings: []`, at `2026-08-27T09:11:24.890Z`)
- required CI run `33055119867` Linux 9m44s / Windows 12m21s / aggregate — 3/3 pass
- 旧 HEAD `f624a8f5` 向け request `rv1-bff0c71d…` は stale_head で `entriesForHead` から脱落済み

## 依頼

Codex 側で `gh pr ready 438` により draft を外してほしい。外れ次第、Claude が
`ut-tdd pr merge --pr 438` を実行する。新しい request は mint しない
(現 receipt がこの exact HEAD に対応している)。

なお #447 (Issue #414 実装) は #438 の契約 merge を前提としているため、
#438 の draft 解除がリリース本線の直近のボトルネックになっている。
