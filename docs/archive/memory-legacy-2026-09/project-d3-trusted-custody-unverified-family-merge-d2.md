---
memory_id: memory:project:d3-trusted-custody-unverified-family-merge-d2
kind: project
title: "D3 trusted custody の終端 unverified_family は merge 許可ではない (D2 への境界)"
tags: ["custody", "d3", "fail-close", "merge-gate", "plan-l7-465"]
updated_at: 2026-08-07T11:00:44.743Z
---

D3 trusted custody は main へ着地し live 実証まで完了したが、**その終端は `unverified_family` であり
「merge してよい」という意味を一切持たない**。D2 の merge gate を書くときにこれを取り違えると
恒久 fail-open になる。

## 実測 (2026-08-07、main c211ff92)

`review-attestation.yml` を default branch から 2 本 dispatch (run 31163323673 / 31163381133)。
両方 conclusion=success、admit step の出力は同一:

```
review-custody admit - OK (mechanical custody verified; terminal state unverified_family,
                           provider family authority is not approved yet)
```

artifactDigest は入力が違えば別値になる (`fd08ae36…` / `6bd96f94…`) ため、receipt は request 内容に
束縛されている。

## D2 が守るべき境界

1. **`unverified_family` を merge 許可に読み替えない。** provider family authority を検証する信頼根は
   意図的に未実装であり、承認前に実環境で `custody_admitted` が観測されたらそれ自体がバグ (負の oracle)。
   信頼根の方式承認 (provider 別 GitHub App / bot / OIDC subject 等) は authentication / authorization を
   変える高影響境界で、PO 承認事案。
2. **GitHub の review state を merge 権限の根拠にしない。** ただし前提を正確に置くこと。
   同一アカウント運用では `reviewDecision` は常に空 (COMMENTED は設定せず、設定できる
   APPROVE / REQUEST_CHANGES は自 PR で禁止) なので、**`reviewDecision` を条件にすると恒久
   fail-open** になる。一方 **`reviews[]` は COMMENTED review を実際に含みうる**
   (PR #214 の `4840857609` / `4841325020`、PR #291 の `4881956236`) ため、**空とみなして
   無視してはならない** — verdict 検知は `reviews[]` と PR コメントの両方を見る。それでも
   body は prose であり typed な信頼根ではないので、merge 可否は D1 receipt / D3 custody に
   置く ([[feedback-github-pr-commented-review-reviewdecision]])。
3. **`mergeMethod` は GitHub facts ではなく operator 供給の assertion。** issue/admit 間の一致と
   enum/欠落の fail-close までが D3 の保証範囲で、方式そのものの真実性は証明していない。D2 が
   merge eligibility の根拠に使うなら検証可能性を別途定義する必要がある。

## 参照

PLAN-L7-465 の「是正後 live dispatch の実測」節 (merge ce68bdbb)。
