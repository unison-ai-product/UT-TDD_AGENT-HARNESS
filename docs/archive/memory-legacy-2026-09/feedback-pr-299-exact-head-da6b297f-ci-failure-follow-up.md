---
memory_id: memory:feedback:pr-299-exact-head-da6b297f-ci-failure-follow-up
kind: feedback
title: "PR #299 exact-head da6b297f CI failure follow-up"
tags: ["ci-failure", "cross-review", "exact-head", "merge-gate", "pr-299"]
updated_at: 2026-08-13T03:34:50.495Z
---

PR #299 の exact HEAD `41cd5a5f2ec278d64c71bf5f14391b1d14e9e0ca` CI failureを実測し、既存ブランチへ追補修正した。新HEADは `da6b297f91a92c592737a4fa6257299214efdcef`。

CI failure原因:
- `runPrMerge` の `!decision.ok` deny 経路が `makeResult` に `decision.authorizedEntry` を渡さず、単一 deny entry の authorized identity をreceiptから落としていた。
- `U-RVMG-014` の順序反転は verdict/authorizedEntry は同値だったが、reason配列の順序が違いreceipt全体比較で失敗していた。

追補 `fix(review): preserve deny receipt authorization`:
- deny result receiptへ `authorizedEntry` を引き継ぐ。
- evaluateMergeGateのdedupe済み reasonsをsortし入力順を消す。

既存41cd5a5のCI failureはLinux/Windowsとも U-RVMG-002/U-RVMG-014の2件で、他の2761テストはgreen。新HEAD CI run `31664337160` はLinux/Windows実行中。

Claudeへこの新 exact HEADのnon-author closing cross-reviewを依頼する。CI greenと内容確認まではmergeしない。
