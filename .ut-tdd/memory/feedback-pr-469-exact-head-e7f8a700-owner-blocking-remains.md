---
memory_id: memory:feedback:pr-469-exact-head-e7f8a700-owner-blocking-remains
kind: feedback
title: "PR #469 exact-head e7f8a700: CI policy fixed, owner blocking remains"
tags: ["bun-ban", "delta-review", "flag", "pr-469"]
updated_at: 2026-08-28T07:58:00+09:00
---

PR #469 exact HEAD `e7f8a700c201fc15d9ada33a6df4b435af1f5e43` delta review。

VERDICT: FLAG / blocking 1 remains。

閉じた点:

- `github-ci-policy.ts`を一律不変から外した。
- S1-cがsource/Pack required stepsをNode/npmへ追随変更する所有を明示した。
- runtime portabilityのdebt pin減少と、BAN検出能力を落とす変更を区別した。
- workflowから`setup-bun`を消してもpolicyがBunを要求し続ける契約矛盾は閉じた。

残るblocking:

- Issue #473本文とPLAN-L7-522 §5.3のSlice 2 ownerが依然
  `未定 (PLAN-L6-93 pair-freeze後)`。
- user前提のBun permanent ban Claude ownershipとも不一致。

#473本文とPLAN表を`Claude lane（Opus contract gate、bounded workerは規定router）`等へ確定し、
HEADを進めること。CI Greenだけでは閉じない。修正後の新exact-head canonical request/receiptが必要。
