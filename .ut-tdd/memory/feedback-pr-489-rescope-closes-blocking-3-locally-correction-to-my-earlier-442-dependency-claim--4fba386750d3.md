---
memory_id: memory:feedback:pr-489-rescope-closes-blocking-3-locally-correction-to-my-earlier-442-dependency-claim--4fba386750d3
kind: feedback
title: "PR 489 rescope closes blocking 3 locally; correction to my earlier 442-dependency claim"
tags: ["advisor", "pr", "rescope"]
updated_at: 2026-08-31T08:29:47.722Z
---

# PR #489 補足: blocking 3 は close ではなく **rescope** で閉じられます

先の receipt `6338225f` のコメントで「#442 が先に着地しないと閉じられない可能性が高い」と
書きましたが、**この見立ては過剰一般化でした。訂正します。**

`ut-tdd advisor --decision progress` (claude-fable-5) に諮り、返ってきた反駁を
repo 実測で検証した結果、#489 は local に閉じられます。

## 訂正の根拠

`PLAN-L7-465` item2 が禁じているのは **`reviewer_family` 等の自己申告を「信頼根として」使うこと**
だけです。#489 の実体の大半 —— Git blob / tree / merge commit digest の機械的再構成 —— は
item2 に触れない正当な mechanical custody です。実際 review record preimage は
byte 列が凍結されており、レビュアーが再計算して一致を確認しています。

抵触しているのは、frozen record 内の `reviewer_family:"codex"` /
`review_kind:"retrospective_non_author"` を `PLAN-L7-458:300` が
「fresh retrospective Sol **non-author** review record」として **family / non-author 性に依拠**
させている一点です。

さらに `PLAN-L7-465` item3 は、family の強証明が無い状態を `unverified_family` として
**正式に定義済み**です。D3d の live 実測 (run `31163323673` / `31163381133`) も
`unverified_family` 終端で closed しており、これは契約破りではなく sanctioned state です。

## 推奨 rescope

1. frozen review record を **`unverified_family` の evidence** として再ラベルする
   (family は無検証の申告である、と明示する)。`PLAN-L7-458:300` の
   「non-author review record」という位置づけを外す。
2. `LegacyF0aCustodyBackfillReceiptV1` の admission 根拠を **digest 束縛側に限定**する
   (PR #192 の subject/tree、8 Git object 行、CI run id の immutability)。
   family 主張を mint 条件から外す。
3. legacy route にも `unverified_family` 相当の降格状態を明示的に定義し、
   自己申告が無条件に mint 条件へ昇格しない形にする。

これで blocking 3 は閉じます。blocking 1 / 2 (D0 行の ReviewBundle outer digest の
供給正本不在、custody digest の正規化規則未定義) は独立の欠陥なので別途必要です。

## #442 との関係 (訂正後)

#442 は #489 と抵触の深さが違います。#442 は `d127defa` で
**検証鍵として対称鍵 (HMAC-SHA256) を採択し、既存の `hmac-lease-token-key-ring.ts` /
`hmac-evidence-attestation-authority.ts` / `kernel/hmac-evidence-attestation-verifier.ts` を
再利用**する方式を freeze しています (逐語確認済み)。一方 `PLAN-L7-465` の所有境界節は
同じ `evidence-attestation.ts` について

> 同期booleanかつ`hmac-sha256`固定の既存`src/plan-asset/ports/evidence-attestation.ts`は変更せず、
> **GitHub信頼根にもprovider-family証明にも使わない**。

と明記しています。#442 は方式の**核**が禁止対象なので、iteration では閉じません。
**#489 は #442 の着地を待つ必要はありません。**
