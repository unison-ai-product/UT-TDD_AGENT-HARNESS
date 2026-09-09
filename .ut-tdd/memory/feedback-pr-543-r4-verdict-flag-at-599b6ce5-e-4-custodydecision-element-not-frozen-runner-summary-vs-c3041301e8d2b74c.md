---
memory_id: memory:feedback:pr-543-r4-verdict-flag-at-599b6ce5-e-4-custodydecision-element-not-frozen-runner-summary-vs-custodydecision-state-split-into-custodystate-custodyreasons--c958290f6e8a
kind: feedback
title: "PR #543 r4 verdict FLAG at 599b6ce5: E.4 custodyDecision element not frozen (runner summary vs CustodyDecision.state); split into custodyState + custodyReasons"
tags: ["issue542", "pr543", "review", "seal-preimage", "verdict"]
updated_at: 2026-09-09T02:14:47.674Z
---

## 非著者 closing review r4 (Codex `gpt-5.6-sol`) — exact HEAD 599b6ce54494314112de8a20644df437fc382649

**VERDICT: FLAG** (blocking 1)

- canonical receipt: `.ut-tdd/review/receipts/ffd39034fef1c82545ce23870bfce2388947bfe2125bfd96b3e7bef7ba725757.json` (reviewerFamily codex, at 2026-09-09T02:12:46Z)
- request memory: `review-request-pr543-599b6ce5`
- exact-head CI: run 34299062573 5/5 success

r3 の blocking 3 件のうち **path 束縛 (finding 2) と certificate キー順 (finding 3) は解消**と判定された。
E.4 の preimage については 1 点が未凍結として残った。

### blocking finding

1. **`internal-processing.md:1199` (E.4)**: `custodyDecision` を「`admitCustodyReceipt` が返す decision の
   enum 値」と規定したが、exact head の `src/feedback/review-custody-runner.ts:223-269` で同関数が返すのは
   enum ではなく `{exitCode, summary: string}` であり、成功時にも `custody_admitted` と `unverified_family` の
   2 通りが出る。さらに内部 `CustodyDecision.state` と runner の `summary` のどちらを preimage に使うかが
   確定しておらず、同一 custody 観測から複数の digest を導出できる。

指摘は実体と一致する。`src/feedback/review-custody.ts:315-341` の `CustodyDecision` は
`state ∈ {custody_admitted, custody_rejected}` の 2 値 enum + `reasons` であり、機械 custody が全 green でも
`VerifiedProviderIdentity` 未実装のため終端は `state = custody_rejected` / `reasons = [unverified_family]`
になる (runner はこれを exit 0 に写す)。したがって `summary` は自由文字列であり、`state` 単独でも
`custody_admitted` と `unverified_family` を区別できない。

### r5 での是正 (実施済み)

- preimage の decision 要素を 1 個から 2 個へ分割:
  `[label, repositoryIdentity, planId, pullRequestNumber, baseRef, headSha, custodyState, custodyReasons]`。
  `custodyState` は `CustodyDecision.state` の 2 値そのまま、`custodyReasons` は `custody_rejected` のとき
  `reasons` を宣言順で `,` 連結した ASCII、`custody_admitted` のとき長さ 0 の要素 (framing は UInt32BE
  長さ前置なので空要素も一意)。
- 入力は runner の戻り値ではなく `admitReviewCustody` の `CustodyDecision` そのものと明記し、
  `RunnerOutcome.summary` を preimage に使うことを明示的に禁止した (理由と行番号を併記)。
- `custody_admitted` と `unverified_family` を同一視しないことを契約として明文化し、E.4 既存の
  「family 分離を強証明しない / `unverified_family` 終端を継承する」節と整合させた。
- E.6 に負系 2 件追加: `custody_admitted` と `custody_rejected` + `[unverified_family]` が別 digest になること、
  runner の `summary` を入力にした導出が本契約の digest と一致しないこと。

r4 receipt は head 599b6ce5 のみに束縛され、修正後の head へは流用しない。
