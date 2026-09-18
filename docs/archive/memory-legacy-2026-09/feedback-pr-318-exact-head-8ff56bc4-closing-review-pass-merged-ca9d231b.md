---
memory_id: memory:feedback:pr-318-exact-head-8ff56bc4-closing-review-pass-merged-ca9d231b
kind: feedback
title: "PR #318 exact HEAD 8ff56bc4 closing review PASS -> merged ca9d231b"
tags: ["closing-review", "d3a", "merged", "pr-318"]
updated_at: 2026-08-14T06:03:23.086Z
---

PR #318 (docs(plan): freeze D3a inbox schema migration) を exact HEAD 8ff56bc437f3c6f464815d5461f9a23b458f8516 で merge しました (merge commit ca9d231b0732534d2d5883d9ec4871b7cd945c3a, 2026-08-14T05:59:32Z)。

closing review = Claude 非 author family blind-reviewer、VERDICT PASS / blocking 0 / 非 blocking 4。verdict 全文は PR comment 5289948572。CI run 31772655922 = 3 job pass / CLEAN。

実測: 委譲 dry-run 両族 (codex blind-reviewer -> gpt-5.6-sol lane=blind-review / claude reviewer -> claude-opus-5 lane=implementation-review) で契約 6 literal の実行可能性を確認、candidate ID 重複 0 (unique 124)、plan lint 875 OK、doctor gate 4 本 (merged-plan-status / plan-artifact-existence / deliverable-plan-trace / oracle-test-trace) 直呼び ok。

実装 PR で回収してほしい非 blocking 4 件:
1. v3 envelope の改変範囲 (file 粒度) が未 freeze。対象は src/runtime/claude-memory-wake.ts:18,22-30,106,129,167-184 と consumer src/cli.ts:551,1203,3950-3956。1 PR = 1 論点の判定材料として着工前に対象 module を 1 行明記してください。
2. 「反対族 runtime 不在」の判定入力 (PATH 不在 / spawn 失敗 / usage cap 429) が未定義。全分岐が deny に収束するため実害なし。
3. 利用上限で反対族が使えない期間の運用出口が契約に無い (receipt 0 のまま永久 deny)。intra_runtime_subagent 証跡は canonical receipt にならない旨を 1 行足すと運用衝突を防げます。
4. CANDIDATE-RVATT-023/024 の期待値が件数のみで typed reason 未固定 (同表の U-RVATT-007 は verdict_file_missing / breach=verdict まで固定)。

別件 errata (本 PR の hunk 外、別 commit で是正してください): docs/plans/PLAN-L7-465-cross-review-author-binding.md:352 の「現 HEAD に evaluateMergeGate は存在しない」が stale。daf1af5b で src/feedback/review-merge-gate.ts:107 に実在し、同文書 :718 と自己矛盾しています。
