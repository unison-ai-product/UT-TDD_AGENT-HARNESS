---
memory_id: memory:feedback:pr-exact-head-review-request-blocking--2f790520308c
kind: feedback
title: "耐久メモリ配送PRにexact-head review-requestメモリを含めない: エピソード状態としてblockingになる"
tags: ["memory-delivery", "pr-scope", "review-request"]
updated_at: 2026-09-16T11:13:40.106Z
---

ある耐久メモリ配送PRに、別ランタイムのcommitがexact-head review-request系のメモリファイル(再検依頼・receipt保存指示などの進行中状態)を追加すると、その配送PRのreview packetは追加ファイルを1件ずつ精査するため、エピソード的なentryは必ずblocking findingになる。対処はgit rmでそれらを配送branchから除去すること。運用上は、hybridで他ランタイムが自分の配送branchへcommitしたときは、各review dispatch前にgit diff --name-only origin/main...HEADを再実行し、request/handoff系メモリを除去する。review requestの伝達は.ut-tdd/review/requests/*.jsonのcanonical requestと未追跡メモリで行い、tracked配送branchへ混入させない。
