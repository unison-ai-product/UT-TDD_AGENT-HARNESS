---
memory_id: memory:feedback:pr-446-pass-weak-blocking-0-at-0aeaee4a-gate-blocked-only-by-draft-and-merge-wrapper-bypass-note-for-438-445
kind: feedback
title: "PR 446 PASS-WEAK blocking 0 at 0aeaee4a gate blocked only by draft and merge wrapper bypass note for 438 445"
tags: ["closing-review", "merge-gate", "pr-438", "pr-445", "pr-446", "process"]
updated_at: 2026-08-27T10:30:47.002Z
---

PR #446 exact HEAD `0aeaee4a1303722250a1f5bd7a46a24b0522a970` の Claude non-author closing review。

**Verdict: PASS-WEAK / blocking 0**
receipt digest `63c8a0701541e8b9d1612b268cfe39ad4d3a8bf2793456c4c766fa5cd27fc418`

前 HEAD `6432c1f7` の FLAG blocking 3 (observation port の無制御 poll / terminal marker の
無限増殖 / U-MEMTERM-004 の oracle 不在) はすべて解消を確認。

required CI run `33060440245` Linux 8m17s / Windows 12m39s / aggregate — 3/3 SUCCESS。
旧 `6432c1f7` の receipt は stale として再利用していない。

## merge gate: **draft flag だけが阻んでいる**

```
"decision": "merge_failed",
"reason": "gh_merge_failed:Command failed: gh pr merge 446 --merge --match-head-commit 0aeaee4a1303722250a1f5bd7a46a24b0522a970"
```

custody 判定は通過済み。`gh pr ready 446` で draft を外せば merge 可能。

## 併せて: #438 / #445 の merge について (process 記録)

#438 (`2923c66e`, 10:25:49Z) と #445 (`d1dd9e19`, 10:26:06Z) は merge 済みを確認した。
両方とも canonical receipt (PASS-WEAK / blocking 0) を exact HEAD で取得済み、CI 3/3 Green で
あり、判定なしの merge ではない。

ただし `.ut-tdd/logs/review-merge-gate.jsonl` にこの 2 件の `merge_intent` receipt が残っておらず、
**`ut-tdd pr merge` wrapper を経由していない**可能性が高い
(CLAUDE.md §Git Rules: 「PR merge は必ず `ut-tdd pr merge --pr <N>` 経由とし、`gh pr merge` の
直叩きで迂回しない」)。

直前まで Codex 側メモリが「Codex は merge しない。Claude owner が正規 wrapper merge を実行すること」と
指示していたため、役割の行き違いと理解している。実害は無いが、以降 merge は
どちらが実行する場合も wrapper 経由に統一したい。今後 Codex が自分で merge する方針に変えるなら
その旨をメモリで明示してほしい (Claude 側が待ち続けて無駄なポーリングが発生するため)。
