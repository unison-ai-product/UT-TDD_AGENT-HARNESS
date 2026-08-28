---
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-519-pack-publication-adapter
---

# L7 Pack publication adapter implementation test design

## 1. 位置付け

`PLAN-L7-515`のpair artifactが所有するremote publication契約を変更せず、後続の
`PLAN-L7-519`実装PRで必ずRedから開始する差分oracleだけを定義する。Pack/GitHubの実credential、
remote mutation、stable promotionは実行せず、in-memory spy/fault portのcall ledgerを正本にする。

このpair-freezeでは候補だけを宣言する。production sourceとtest codeを追加せず、共有
`L7-unit-test-design.md`への`U-*`登録も実装PRまで行わない。

## 2. Candidate oracle matrix

| Candidate | 単独変異 / fault | 期待oracle |
| --- | --- | --- |
| `CANDIDATE-PACKPUB-519-001` | branch commit、PR作成、PR CAS mergeのいずれかで同じapproval nonceを再利用する | 2個目のmutation前に`nonce_replay`、そのmutation以降write 0。各mutationへ別nonceを与えた正常系だけ進行する。 |
| `CANDIDATE-PACKPUB-519-002` | draft Release、asset A、asset B、tag、visibility、pointerの隣接2操作でnonceを共有する | 共有をtyped denyし、各操作単位のsingle-use nonceなら正本FSM順に進む。 |
| `CANDIDATE-PACKPUB-519-003` | branch/PR等の実write後に後続faultを返し、resultの`remoteWrites`を定数0へ変異する | port ledgerの実call数とresultが一致せずRed。write前denyだけ0を返す。 |
| `CANDIDATE-PACKPUB-519-004` | draft Release identity/draft stateを単独変異する | asset/tag/visibility/pointer write 0、期待typed reasonを単独検出する。 |
| `CANDIDATE-PACKPUB-519-005` | assetを0/1/3件、重複name、bytes/size/digestの各一軸へ変異する | tag/visibility/pointer write 0。digest以外のguardを除去しても各oracleがRedになる。 |
| `CANDIDATE-PACKPUB-519-006` | tag refusal/response loss/target driftまたはvisibility refusal/unknownを単独注入する | 既存immutable objectを保持して後続write 0、`partial_publication`/`indeterminate`を成功へ丸めない。 |
| `CANDIDATE-PACKPUB-519-007` | commit/tree/sidecar/release identity/merge modeのうち一軸だけをread-backで差し替える | `release_draft`以降write 0。未生成commit/treeを事前値で通さない。 |
| `CANDIDATE-PACKPUB-519-008` | mutation intent後のpersist failure、response loss、crash/restartを注入する | success推測とwrite replay 0。同一operation/transition/state/keyのread-only reconciliationだけを許可する。 |
| `CANDIDATE-PACKPUB-519-009` | late main/pointer driftまたはpointer CAS response loss/read-back mismatch | pointer append 0またはapplied unknown、重複CAS 0、canary success 0。 |

## 3. 検証規則

各候補は他guardを成立させたfixtureで一軸だけを変異する。typed reason、port名、call順、各port count、
全remote write countを直接検査し、別理由で落ちたケースを合格にしない。実装PRで各candidateと実testを
1対1にした後だけ`U-PACKPUB-REMOTE-*`へ昇格し、共有registryへ登録する。

Node/npm targeted test、typecheck、Biome、PLAN lint、Linux/Windows/aggregate CIを同じPLAN revisionと
exact HEADへ束縛する。Bun、source worktree、開発DB/PLAN/evidence、local Pack checkoutからの補完は
fixtureにもproduction compositionにも許可しない。
