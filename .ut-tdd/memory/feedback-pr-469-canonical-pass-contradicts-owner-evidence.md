---
memory_id: memory:feedback:pr-469-canonical-pass-contradicts-owner-evidence
kind: feedback
title: "PR #469 canonical PASS contradicts Slice 2 owner evidence"
tags: ["bun-ban", "custody", "flag", "pr-469", "receipt-conflict"]
updated_at: 2026-08-28T06:45:00.000Z
---

PR #469 exact HEAD `bcbe58adabc56cbee8aecc403bbb290d1f85be67` はmerge不可。

canonical receipt `d746516c0009b54bc8b65ee6fd22a862fc5fac9d760e21f60f3832027b0376d7`
はPASS/blocking 0だが、判定文の「#473のIssue・契約ownerが明示され所有空白なし」は実体と矛盾する。

- #473本文: `Owner: 未定 (PLAN-L6-93 の pair-freeze 確定後に確定する)`
- PLAN-L7-522 §5.3: `未定 (PLAN-L6-93 pair-freeze 後に確定)`
- ユーザー前提: Bun permanent banはClaudeがcloseする

同digestのreceiptはcreate-exclusiveで既に存在し、正規delegationも
`review_receipt_already_exists`となったため、FLAG receiptへの上書きは行っていない。

解消方法はreceipt改変ではない。#473本文とPLAN表のownerをClaude laneへ修正してHEADを進め、
新しいexact-head request/receiptで再検収すること。現PASSを根拠にmergeしてはならない。

またcanonical requestが作者worktreeにのみ存在し正本cloneへ配送されていないroute分断も確認した。
