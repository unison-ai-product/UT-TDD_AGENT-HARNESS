---
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: confirmed
plan_id: PLAN-L7-519-pack-publication-adapter
---

# L7 Pack publication adapter implementation test design

## 1. 位置付け

`PLAN-L7-515`のpair artifactが所有するremote publication契約を変更せず、後続の
`PLAN-L7-519`実装PRで必ずRedから開始する差分oracleだけを定義する。Pack/GitHubの実credential、
remote mutation、stable promotionは実行せず、in-memory spy/fault portのcall ledgerを正本にする。

このpair-freezeでは候補だけを宣言する。production sourceとtest codeを追加せず、共有
`L7-unit-test-design.md`への`U-*`登録も実装PRまで行わない。

## 2. 上位candidate集合の実装束縛

candidateの意味とIDの唯一ownerは、confirmedな上位pair artifact
`L7-pack-publication-remote-test-design.md` §3/§6である。本artifactは別IDを発行せず、実装PRへ次の
**全23行**をそのまま束縛する。

```text
CANDIDATE-PACKPUB-003-A
CANDIDATE-PACKPUB-003-B
CANDIDATE-PACKPUB-003-C
CANDIDATE-PACKPUB-003-D
CANDIDATE-PACKPUB-003-E
CANDIDATE-PACKPUB-003-F
CANDIDATE-PACKPUB-003-G
CANDIDATE-PACKPUB-003-H1
CANDIDATE-PACKPUB-003-H2
CANDIDATE-PACKPUB-003-I
CANDIDATE-PACKPUB-003-J
CANDIDATE-PACKPUB-003-K
CANDIDATE-PACKPUB-003-L
CANDIDATE-PACKPUB-003-M1
CANDIDATE-PACKPUB-003-M-late
CANDIDATE-PACKPUB-003-M2
CANDIDATE-PACKPUB-003-N
CANDIDATE-PACKPUB-003-O
CANDIDATE-PACKPUB-003-P
CANDIDATE-PACKPUB-003-Q
CANDIDATE-PACKPUB-003-R
CANDIDATE-PACKPUB-003-S1
CANDIDATE-PACKPUB-003-S2
```

実装PRは各行につき独立testを1件以上持ち、上位§3の単独mutation、typed reason、後続port 0、
partial/indeterminate保持を変更しない。同じmutationを別candidateとして複製せず、23行のいずれかを
未実装のまま`U-PACKPUB-REMOTE-*`完了と主張しない。

## 3. 検証規則

上位23候補は他guardを成立させたfixtureで一軸だけを変異する。typed reason、port名、call順、各port count、
全remote write countを直接検査し、別理由で落ちたケースを合格にしない。実装PRで上位candidateと実testを
1対1にした後だけ`U-PACKPUB-REMOTE-*`へ昇格し、共有registryへ登録する。

Node/npm targeted test、typecheck、Biome、PLAN lint、Linux/Windows/aggregate CIを同じPLAN revisionと
exact HEADへ束縛する。Bun、source worktree、開発DB/PLAN/evidence、local Pack checkoutからの補完は
fixtureにもproduction compositionにも許可しない。
