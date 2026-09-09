---
memory_id: memory:feedback:pr543-r1-flag-at-c0c40c65-seal-preimage-contract-forged-via-crafted-commit-and-local-review-json-provider-family-authority-port-already-forbids-local-artifacts-as-authority--dd2cc4d63d11
kind: feedback
title: "PR543 r1 FLAG at c0c40c65: seal preimage contract forged via crafted commit and local review JSON; provider-family-authority port already forbids local artifacts as authority"
tags: ["custody-input", "flag", "issue-542", "pr-543", "provider-family-authority", "sealed-lineage"]
updated_at: 2026-09-08T12:04:07.824Z
---

## 非著者 closing review r1 (Codex `gpt-5.6-sol`) — exact HEAD c0c40c65556cad352f46183ccaa2ce8f2782d4f9

**VERDICT: FLAG** (blocking 2)

- canonical receipt: `.ut-tdd/review/receipts/8b68c1fa24d8dcd40aba46ec34565ca2a6b3e7425d4fe562b655d99a22bdc34b.json` (reviewerFamily codex)
- request memory: `review-request-pr543-c0c40c65`
- exact-head CI: run 34221918481 5/5 success

### blocking findings (いずれも妥当。契約を修正する)

1. **`internal-processing.md:1152` (E.3)**: `sourceCommit` が seal 対象の exact HEAD またはその到達可能な履歴に
   属することを束縛していない。blob 一致と TOCTOU 再確認だけでは、攻撃者が自作 commit object と整合する
   `sourceCommit` / `sourceBlobOid` / digest 一式を用意して 5 照合すべてを通し、`sourceAuthorityDigest` を偽造できる。
2. **`internal-processing.md:1163` (E.4)**: `reviewedImplementationAuthorityDigest` をローカル JSON の自己申告
   fields とファイル名 digest だけで受理しており、attested provenance と `VerifiedProviderIdentity` を束縛しない。
   実際、receipt のファイル名 digest は file-bytes の sha256 **ではなく** request digest であり、同じ規則で
   任意 JSON を hand-mint して PASS / 別 family / 任意 head を宣言できる。authority にならない。

### 補足 (Claude 側で確認した既存契約)

指摘 2 は既存契約と正面から一致する。`src/feedback/ports/provider-family-authority.ts` は
「本 repo に受理側の実装は無い」「自己申告 `reviewerFamily`、PR comment marker、HARNESS memory 本文、
commit trailer、local JSON/HMAC、同一 OS user が使える鍵は、この port の実装として受理してはならない」と
明記しており、家族分離の機械証明は PO 承認を要する外部権限設計として保留されている。したがって
E.4 をローカル receipt で定義した設計は最初から成立しない。

### 対応方針 (r2 で修正)

- E.3: `sourceCommit` を tracked remote ref から到達可能であること、かつ seal 候補 HEAD と一致することを
  照合条件に追加する (自作 commit object を排除)。
- E.4: ローカル artifact による authority 定義を撤回し、既存の live GitHub facts 観測経路
  (`review-custody-runner` の `observeStable` / `admitCustodyReceipt`) を再利用する形へ置き換える。
  family 分離は `VerifiedProviderIdentity` が未実装である限り機械証明を主張せず、`unverified_family` の
  既存終端をそのまま継承する (偽の強証明を書かない)。

r1 receipt は head c0c40c65 のみに束縛され、修正後の head へは流用しない。
