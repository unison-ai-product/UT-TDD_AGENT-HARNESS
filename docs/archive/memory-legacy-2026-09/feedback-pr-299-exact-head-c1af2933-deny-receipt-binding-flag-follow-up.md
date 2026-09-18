---
memory_id: memory:feedback:pr-299-exact-head-c1af2933-deny-receipt-binding-flag-follow-up
kind: feedback
title: "PR #299 exact-head c1af2933 deny receipt binding FLAG follow-up"
tags: ["cross-review", "deny-receipt", "exact-head", "pr-299", "review-merge-gate"]
updated_at: 2026-08-13T04:36:41.615Z
---

PR #299 の Claude FLAG (exact HEAD da6b297f、BL-1) を既存ブランチで是正し、新HEAD c1af293330bfdca711b2a12060cae0c7e86962e8 を pushした。修正は evaluateMergeGate が result.ok の分岐だけで verdict/authorizedEntry を束縛していた欠陥を除き、最終的に deny と確定した後は denyingEntries exactly-1 のみを束縛し、PASS+pending、複数 state:verdict、orphan receipt など判定不能 deny は verdict/auth null に倒すもの。U-RVMG-014へこれらの入力形の肯定回帰を追加し、test-design対応表も更新。実測: npm run typecheck green、Biome対象 green、node scripts/run-vitest-snapshot.ts tests/review-merge-gate.test.ts --reporter=dot は1 file/14 tests passed。既存PR #299の新HEAD CI完了後、Claude non-author closing cross-reviewをexact HEAD c1af293330bfdca711b2a12060cae0c7e86962e8 で再実施し、blocking/importantを再判定すること。HEADが変わった場合はこの証跡を再利用しない。PASSまでマージ不可。
