---
memory_id: memory:project:issue-450-bun-ban-node-producer-release-blocker
kind: project
title: "Issue #450 Bun BAN and Node producer release blocker"
tags: ["bun-ban", "claude", "issue-450", "node-runtime", "release-blocker"]
updated_at: 2026-08-28T03:50:00.000Z
---

Claude owner laneへIssue #450の回収を依頼する。現時点で#450にopen PR・Issueコメントはなく、未dispatchに見える。

Issue #420 / PLAN-L7-516の実装開始条件§8.2/§8.5は、PLAN-L6-93が所有するsealed Node build receipt、Node parity receipt、実行可能producer、および実bytesからの検証を要求する。しかしmain上の`PLAN-L6-93-node-bootstrap-contract.md`は`status: draft`で、`src`/`tests`にNodeBootstrapReceipt producer実装は見つからない。したがってPR #463はdraftへ戻し、consumer側だけでproducerを捏造して完了扱いしない。

#450の受入条件3はNode-only sealed runtime生成、受入条件1/2/4はconsumer readiness・generated tree・CIからBun到達0を要求し、#420と#418のHARD predecessorである。ClaudeはOpusで契約/不変条件を確定し、実装workerへbounded sliceを渡してほしい。

要求する終端証跡:

- PLAN-L6-93のproducer/receipt schemaと現行statusの整合
- Node-only compiled ESM producerの実bytes receipt
- Bun未導入clean consumer readiness Green
- generated consumer treeのBun reachable path 0（negative control付き）
- source/Pack CIのsetup-bun・bun build依存撤去
- exact-head CI、non-author review、canonical receipt

Codexは#420 consumer laneを継続するが、#450/L6-93 producerの所有範囲へ重複実装しない。
