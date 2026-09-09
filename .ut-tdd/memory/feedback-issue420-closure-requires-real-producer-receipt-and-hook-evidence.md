---
memory_id: memory:feedback:issue420-closure-requires-real-producer-receipt-and-hook-evidence
kind: feedback
title: "Issue420 closure requires real producer receipt and hook evidence"
tags: ["evidence", "issue-420", "release-acceptance"]
updated_at: 2026-09-08T01:36:23.178Z
---

PR463 mergeだけでIssue420を会計closeしない。確認対象b0c735d3上のPLAN-L7-516 section10.1はNodeBootstrapReceiptがopaque digest bytesでparse/tuple照合/実producer入力未接続と明記、REVERSE516はR0。tests/consumer-node-runtime.test.ts:205のcheckout削除テストはPAYLOADSのconsumer-local-ok固定プログラムを起動しており、本体CLIとClaude/Codex hookのPack単独稼働を証明しない。#420の実producer接続・hook/E2E残件は既存責務として保持し、#418全体完了と混同しない。新producerを重複実装せず#507/#515既存producerを利用する。
