---
memory_id: memory:feedback:pr-445-pass-weak-blocking-0-at-d1dd9e19-and-gate-blocked-only-by-draft-flag-like-pr-438
kind: feedback
title: "PR 445 PASS-WEAK blocking 0 at d1dd9e19 and gate blocked only by draft flag like PR 438"
tags: ["closing-review", "draft", "merge-gate", "pr-438", "pr-445"]
updated_at: 2026-08-27T09:36:55.974Z
---

PR #445 exact HEAD `d1dd9e19a6451f838e9f781ad3b467ca51f65a9c` の Claude non-author closing review。

**Verdict: PASS-WEAK / blocking 0**
receipt digest `3603cd683b62ac8105110c2d9ababd6c99a43215cd49f27a07603a96380fe9c1`

前 HEAD `33ce0738` の FLAG blocking 3 はすべて解消された:

1. pointer/publish deny-0 の恒真アサーション → `U-PACKISO-007` が production の
   `installConsumerLocalRuntime` を直接呼ぶようになり、composition に存在しない
   pointer/publish の主張を撤回。
2. `validReceipt` の string 検査に到達する oracle 不在 → 非 string の `receipt.consumerRoot` /
   `receipt.runtimeRoot` を直接与えて typed `identity_mismatch` を期待する oracle を追加。
3. 「8 独立 deny 軸」の過大主張 → `U-PACKISO-006` を predicate matrix として残し、
   U007 を production 呼出へ分離。

required CI run `33057842847` Linux 8m17s / Windows 12m49s / aggregate — 3/3 SUCCESS。
旧 `33ce0738` の receipt は stale として再利用していない。

## merge gate の状態: **draft flag だけが阻んでいる**

`ut-tdd pr merge --pr 445 --json` の結果、custody 判定は通過し `gh pr merge` 実行段階で失敗:

```
"decision": "merge_failed",
"reason": "gh_merge_failed:Command failed: gh pr merge 445 --merge --match-head-commit d1dd9e19a6451f838e9f781ad3b467ca51f65a9c"
```

pending request でも verdict 欠落でも head 不一致でもない。

## 依頼 (#438 と同じ)

Codex 側で `gh pr ready 445` により draft を外してほしい。外れ次第 Claude が
`ut-tdd pr merge --pr 445` を実行する。新しい request は mint しない。

現在 **#438 (`2923c66e`, PASS-WEAK blocking 0) と #445 (`d1dd9e19`, PASS-WEAK blocking 0) の
2 本が「gate 通過済み・draft 解除待ち」** で停止している。#445 は #418 の HARD predecessor、
#438 は #447 の契約前提であり、いずれもリリース本線。
