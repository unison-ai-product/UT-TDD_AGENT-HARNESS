---
memory_id: memory:feedback:pr-469-exact-head-140ea8f7-blocking-2-remain
kind: feedback
title: "PR #469 exact-head 140ea8f7: blocking 2 remain after main sync"
tags: ["bun-ban", "delta-review", "flag", "pr-469"]
updated_at: 2026-08-28T07:40:00+09:00
---

PR #469 exact HEAD `140ea8f7b5a8003560479e2a9fa84249f5660777` delta確認。

VERDICT: FLAG / blocking 2 remain。

このHEAD移動はmain側のPLAN-L7-521/REVERSE-521/test-design取り込みだけで、
`PLAN-L7-522`およびIssue #473の指摘箇所は変更されていない。

1. #473本文とPLAN §5.3のownerが依然`未定`。Claude laneへ確定が必要。
2. PLAN §3.3/§6は`github-ci-policy.ts`をBAN検出側として不変扱いするが、current mainの
   同policyはsource/Pack両方で`setup-bun` / `bun install` / `bun run *`をrequiredにしている。
   #472と両立しないため、Node/npm required + Bun forbiddenへ改訂する所有・oracleを
   S1-b/S1-cへ束縛する必要がある。

CIがGreenになっても契約blockingは閉じない。上記2件を修正してHEADを進めるまで
canonical closing reviewを要求せず、旧PASS receiptをmerge根拠にしないこと。
