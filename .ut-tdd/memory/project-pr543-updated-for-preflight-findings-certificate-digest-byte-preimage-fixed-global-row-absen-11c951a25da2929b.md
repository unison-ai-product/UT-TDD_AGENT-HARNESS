---
memory_id: memory:project:pr543-updated-for-preflight-findings-certificate-digest-byte-preimage-fixed-global-row-absence-claim-withdrawn-forged-receipt-negative-added-closing-review-not-yet-requested--ab0c725dc57e
kind: project
title: "PR543 updated for preflight findings: certificate digest byte preimage fixed, global row-absence claim withdrawn, forged-receipt negative added; closing review not yet requested"
tags: ["custody-input", "issue-542", "pr-543", "preflight-findings", "sealed-lineage"]
updated_at: 2026-09-08T12:19:53.996Z
---

PR #543 (Issue #542 契約 freeze) を head fe80ed7d49a817f88e55826c8eb1235ed3f06ebc まで更新した (2026-09-08、Claude)。
Codex root の preflight 指摘 (memory feedback:pr543-c0c40c65-preliminary-contract-findings-before-closing-review) を反映。
root の指摘は旧 head c0c40c65 に対するもので、canonical verdict ではないことを了解している。

## 反映内容

1. **E.4 (旧 head の指摘 1)**: r2 (7a3ab978) で既に対応済み。ローカル receipt JSON / ファイル名 digest を
   authority とする定義を撤回し、live GitHub facts 観測を経た既存 custody 経路
   (`review-custody-runner` の `observeStable` / `admitCustodyReceipt`) の結果へ束縛した。
   receipt path が request identity digest であって内容の真正性ではないという指摘は、まさに撤回理由と同じである
   (`review-attestation.ts` / `review-verdict-custody.ts` の実装位置も指摘どおり)。
   本 head で **自己整合的に偽造された receipt file を custody 経路で拒否する負系** を E.6 に追加した。
   新 trust root は作っていない (`VerifiedProviderIdentity` 未実装のため family 分離は unverified_family 継承)。
2. **E.5 / E.6 の矛盾 (指摘 2)**: 妥当。`certificate_json` は writer が `canonical()` で生成する **byte 列**であり、
   digest の preimage は object ではなくその byte 列であると明記した。caller から byte 列や digest を供給する経路は
   設けない。したがって「キー順を変えた等価 object が digest 不一致」という矛盾した oracle は置かず、
   拒否対象は caller 供給経路そのものとした。
3. **global 主張の撤回 (指摘 3)**: 「既存 row はどの ledger にも存在しない」を互換性契約として書いていた箇所を、
   当該 machine の 7 ledger を read-only 確認した時点・範囲の観測に限定し、他 machine や未検査 ledger への
   不在主張を撤回した。入力型拡張の適用は seal 実行時に対象 ledger で row と command id の不在を確認してから行う。
   E.7 の universal rollout 撤回 (target 単位の実測条件化) は r2 で反映済み。

## 状態

CI は本 head で再実行される。**closing review は未依頼**であり、source inspection を PASS として扱っていない。
次セッションで CI green を確認したうえで `ut-tdd codex --role blind-reviewer` により exact-head で正式依頼する。
r1 receipt 8b68c1fa は head c0c40c65 限定であり流用しない。
