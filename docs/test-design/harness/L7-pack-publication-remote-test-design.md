---
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-515-pack-remote-canary-publication
---

# L7 Pack remote canary publication test design

## 1. 位置付け

この文書は `PLAN-L7-515-pack-remote-canary-publication` と
`PLAN-REVERSE-515-pack-remote-canary-publication-backfill` 専用の pair artifact である。
共有 `L7-unit-test-design.md` を変更せず、Issue #414 の remote publication adapter が
`PLAN-L7-508` の sealed staging result を正しく human-approved Pack canaryへ変換するかだけを
検証する。実際の Pack/GitHub credential、remote mutation、stable promotion はテストで実行しない。

Lunaの実装前は全て `CANDIDATE-*` とし、実装PRでRed→Greenを観測したものだけを
`U-PACKPUB-REMOTE-*` へ1対1で昇格する。既存 `U-PACKPUB-*`、`U-PACKASSET-*`、
`U-PACKPUB-STAGE-*`、`CANDIDATE-PACKPUB-004` を再所有しない。

## 2. テスト対象の入力と port

### 2.1 sealed input

fixtureは `SealedPackPublicationPlan` 相当の immutable 値として、release ID、source revision、
staging plan digest、Pack commit entries、control manifest sidecar、tar.gz と checksum の
exact 2 assets、各 digest/size、expected Pack main SHA、canary pointer objectを含む control-manifest
before snapshot digest を明示する。after snapshot は `channels.canary` の candidate pointer を
含み、before snapshotを上書きせずappendする。root intentでは未生成のrelease commit SHA/tree SHAを
事前計算せず、expected Pack tree/entries/digests、allowed merge mode、deterministic derivation rule
だけを明示する。release commit/tree はmerge read-back後に次のtag transition intentへappendし、
pointer commit/treeはappend後のreceipt observationだけに記録する。fixture生成時に source worktree、directory walk、Pack checkout、開発DB、PLAN本文、
環境変数から entry を補完しない。

### 2.2 injected ports

以下の各 port は操作名、入力 identity、呼出回数、呼出順、返却 observation を記録する。

| port | 操作 | 成功後に観測する値 |
| --- | --- | --- |
| `ApprovalPort` | receipt検証・nonce消費 | intent digest、approver、expiry、nonce、pre-transition state digest |
| `DurableExecutionStatePort` | append-only execution journal（各transitionのplanned+nonce consumed、mutation intent、read-back observation） | durable state digest、idempotency key、persist result、restart/reconciliation state |
| `PackRepositoryPort` | protected main/before snapshot観測、branch commit、PR作成、PR merge CAS/観測、release commit/tree read-back | main SHA、branch/PR、observed release Pack commit/tree、merge state |
| `TagPort` | merge read-back済みcommitへのannotated tag作成・観測 | tag name、observed target commit/tree、tag digest |
| `ReleasePort` | `draft=true` prerelease作成、exact asset 2件upload、各asset観測 | release identity、asset name/size/bytes/digest、draft state |
| `ReleaseVisibilityPort` | visibility transition approval検証、draft→visible transition/観測 | transition identity、approval receipt、visibility |
| `CanaryPointerPort` | current main/before snapshot/release commit再観測、after snapshot生成、protected main PR/CAS append、read-back | pointer object、before/after snapshot digest、post-observation pointer Pack commit/tree、release ID |
| `PublicationAuditorPort` | tag/Release/assets/sidecar/identity再計算 | attested/mismatch/unavailable |
| `ReceiptPort` | append-only receipt保存 | operation、identity、before/after、observation |

正常系の port 順序は親 `PLAN-L6-63` の正本 FSM と同じ
`planned → pack_commit → release_draft → assets → tag → release_visible → canary` に固定する。
canary pointer は独立 endpointへ直接書かず、control-manifest snapshot内の object として
protected Pack `main` へのPR/CAS appendで初めて公開する。

```text
planned / sealed re-attestation + before snapshot observe + operation approval/nonce consume + tag preflight
  → pack_commit / publication branch commit + PR create/observe + protected main CAS merge + independent tree/commit/sidecar/identity/mode attest + journal read-back
  → release_draft / draft prerelease create/observe (`draft=true`)
  → assets / tar.gz + checksum upload/observe
  → tag / annotated tag create/observe at release Pack commit
  → release_visible / transition approval + draft→visible transition/observe + auditor
  → canary / after snapshot with pointer object + pointer PR/CAS append + read-back
  → append-only publication receipt + durable execution state
```

## 3. Candidate oracle matrix

| Candidate | 変異・fault | 期待結果 |
| --- | --- | --- |
| `CANDIDATE-PACKPUB-003-A` | approval absent、wrong approver、期限切れ、intent/release/source identity不一致 | typed deny、全 remote write 0 |
| `CANDIDATE-PACKPUB-003-B` | nonce replay、同一nonceの別identity、operation/遷移/state/idempotency key改変 | typed deny、全 remote write 0。consume済みnonceの同一operation/遷移だけはreconciliationへ分離 |
| `CANDIDATE-PACKPUB-003-C` | expected Pack main SHA、canary pointer object、または before control-manifest snapshot digestを単独変異 | typed deny、全 remote write 0 |
| `CANDIDATE-PACKPUB-003-D` | commit entry、sidecar、assetの欠落・余剰・順序・bytes・size・digest変異 | typed deny、最初の remote write 0 |
| `CANDIDATE-PACKPUB-003-E` | source/worktree/DB/PLAN/local Pack checkoutからの暗黙補完を注入 | fallback拒否、最初の remote write 0 |
| `CANDIDATE-PACKPUB-003-F` | Pack branch/PR作成の拒否、timeout、unknown、別PR identity | `partial_publication`/`indeterminate`、後続 write 0 |
| `CANDIDATE-PACKPUB-003-G` | approved merge観測の拒否・timeout・unknown・別commit/tree、またはpack_commit read-back未確定 | typed partial/indeterminate、`release_draft`以降のRelease/assets/tag/visibility/pointer write 0 |
| `CANDIDATE-PACKPUB-003-H1` | `planned` tag preflightでduplicate/retarget/force push要求または既存tag identity drift | mutation前deny、**全 remote write 0**（tag/Release/assets/visibility/canaryを含む） |
| `CANDIDATE-PACKPUB-003-H2` | tag mutation後の拒否、timeout、response loss、観測不能、別target/identity | 既存draft/assetsは保持、`partial_publication`/`indeterminate`、visibility/pointer後続write 0、tag重複write 0 |
| `CANDIDATE-PACKPUB-003-I` | release_draftでRelease identity drift、`draft=true`でないRelease、または作成拒否/timeout | typed deny/indeterminate、assets/tag/visibility/canary write 0。可視化後の `draft=false` はこの行のdeny対象外 |
| `CANDIDATE-PACKPUB-003-J` | tarball/checksum bytes・name・size・digest単独変異、asset 0/1/3件、重複名 | auditor mismatch、tag/visibility/canary write 0 |
| `CANDIDATE-PACKPUB-003-K` | sidecar/control snapshot、source revision、release Pack treeの観測 drift | auditor mismatch、visibility/canary write 0 |
| `CANDIDATE-PACKPUB-003-L` | release_visibleのtransition approval欠落/期限切れ/wrong identity、visibility拒否/timeout/unknown、またはattestation前のtransition試行 | `mismatch`/`indeterminate`、canary pointer snapshot append 0 |
| `CANDIDATE-PACKPUB-003-M1` | initial preflightでcanary pointer object、before control-manifest snapshot、または期待Pack mainのdrift | `mismatch`/typed deny、**remote write 0**、pointer after-snapshot append 0 |
| `CANDIDATE-PACKPUB-003-M-late` | 第二PR/CAS直前のcurrent Pack main、before pointer snapshot、またはmerge read-back済みrelease commit/treeのlate drift | pointer append/write 0、既存draft/assets/tag/visible immutable objectsをpartial保持、success 0、新しいapprovalを要求 |
| `CANDIDATE-PACKPUB-003-M2` | after snapshotのCAS response loss、applied unknown、またはread-back mismatch | `applied=unknown`/`indeterminate`、重複CAS/append write 0、success 0。既存attested state以外の再試行不可 |
| `CANDIDATE-PACKPUB-003-N` | mutation後のcleanup失敗、remote response lost | publication結果を上書きせず、cleanupを独立typed observationへ分離 |
| `CANDIDATE-PACKPUB-003-O` | consume済みの同一identity・同一operation/遷移/nonce・durable state・idempotency keyでattested済みstateを再観測 | same-operation reconciliation、既存objectの再観測のみ、重複PR/tag/Release/asset/pointer write 0 |
| `CANDIDATE-PACKPUB-003-P` | 別release、別nonce、別operation/遷移/state/key、別Pack tree、順序飛越のretry | `nonce_replay`/typed mismatch、後続の新規write 0 |
| `CANDIDATE-PACKPUB-003-Q` | pointer before/after snapshotを上書き、pointerをsnapshot外へ置く、protected mainへdirect push、release/pointer Pack commit/tree identityを混同 | typed deny、早期canary公開 0、PR/CAS append順序と一意identityを保持 |
| `CANDIDATE-PACKPUB-003-R` | draft/assets/tag/pointer各操作単位のapproval receiptまたはnonce欠落、journalのplanned+nonce consumed/mutation intent/read-back observation欠落、write成功後のstate persist failure、response loss、crash/restart | 欠落receipt/nonceは当該mutation前deny・remote write 0。persist failure/response loss/restartは未観測成功を推測せず`indeterminate`、同一operationのreconciliationだけを許可 |
| `CANDIDATE-PACKPUB-003-S1` | initial linkageでroot intentのexpected Pack tree/entries/digests、sidecar、release identity、allowed merge mode/derivation ruleとpack_commit read-backのtree/sidecar/identityを単独変異、またはobserved commitがそのtreeを指さない | `mismatch`、`release_draft`以降のRelease/assets/tag/visibility/pointer write 0。observed commit SHAはjournal確定せず、tag targetへ事前計算SHAを注入しない |
| `CANDIDATE-PACKPUB-003-S2` | journal確定後にobserved release commit/tree、release_draftのidentity/`target_commitish`、asset、またはtag approval targetを単独差替え | `mismatch`、該当transition以降のwrite 0。release commit/treeはmerge後の次transition intentへappendし、pointer commit/treeはpost-observation receiptだけに残す |

各行は単独 mutationとして実測する。複数のguardが同時に発火して「別の理由で落ちた」
状態をGreenとしない。operation logの順序と各 port countを直接 oracleにし、prose claimや
最終状態だけで副作用0を推測しない。

## 4. fault sequence と不変条件

PR、merge、draft Release、asset upload、tag、release visibility transition、pointer snapshot
append/CAS の各 mutation の直後に、成功・拒否・
unknown・observer failure を注入する。最初の unknown または観測不能以降は全ての後続
mutation countを0にし、状態を `indeterminate` または `partial_publication` のまま保持する。
各transitionで `planned + nonce consumed`、`mutation intent`、`read-back observation` を
`DurableExecutionStatePort`のappend-only journalへ永続化する。write成功でもjournal persist failure、
response loss、crash/restartでread-backが欠ける場合は未確認の成功を仮定せず`indeterminate`とする。
remote状態とjournalを再観測して同一identity・operation・遷移のattested stateが確認できた場合だけ、
新規writeなしのsame-operation reconciliationを許可する。未確認の成功を仮定したcommand retryは許可しない。

全ケースで次を検証する。

1. 最初の write 前の deny は全 remote write count 0。
2. remote ambiguity 後は後続 write count 0。
3. `release_draft` は `draft=true` を要求し、`release_visible` の明示承認・transition後だけ
   `draft=false` を成功観測とする。可視化前の pointer appendは0。
4. pointer CAS/append は tag/Release/assets/visibility と control snapshot の完全 attestation 後だけ1回。
5. Pack main 直接push、force push、tag retarget、asset overwrite、duplicate operation は0。pointer
   はsnapshotに含まれ、before/after snapshotとrelease/pointer Pack commit/tree identityを区別する。
   未生成commit SHAの事前seal、deterministic precomputed commit、commit SHA/tree SHA単独変異はdenyする。
6. receipt と durable execution state は sealed intent、遷移ごとの approval/nonce、draft/assets/tag/pointer
   各操作単位の approval receipt、idempotency key、before/after identity、operation順序へ束縛される。
7. source/worktree/dev DB/PLAN/evidence/local Pack checkoutを fixture input にしても結果へ影響しない。
8. consume済みnonceの同一operation reconciliationは新規writeを発行せず、別operation/identityの
   nonce replayはdenyする。未使用nonceのresumeは存在しない。
9. initial preflight driftとlate pointer transition driftを分離する。late driftではpointer append/write
   0、既存draft/assets/tag/visible immutable objectsをpartial保持し、success 0・新approvalを要求する。
10. supersede-forward rollbackは別intentの参照境界として記録し、この sliceで既存objectを破壊しない。

## 5. Linux / Windows / mutation 検証

Node/npmの同一テストをLinuxとWindowsで実行し、POSIX/Windows path、CRLF、case、権限、
改行差が sealed bytes・identity・operation順序を変えないことを確認する。remote portは
両OSとも in-memory spy/fault adapterであり、実ネットワークや資格情報を使わない。

CIは targeted Red→Green、TypeScript、Biome、PLAN lint、Linux、Windows、aggregate を
同一PLAN revision・exact HEADへ束縛する。各 mutation candidate の期待理由が単独に検出
できることを確認し、digest不一致だけで全てを落とす曖昧な oracleは受理しない。

detached snapshot でもこの test-design のファイル名・frontmatter層・PLAN pair参照が一致する
ことを `test-design-naming` と `plan lint` で検証する。snapshotのHEADが親契約と異なる場合は
pair-freezeを成立させない。

## 6. 昇格と非スコープ

実装PRが `CANDIDATE-PACKPUB-003-A..S2`（`H1/H2` と `M1/M-late/M2`、`S1/S2` を含む）を1対1の `U-PACKPUB-REMOTE-*` へ昇格し、各
operation の spy count と typed reason を記録する。実装・CI・Reverse R1〜R4・Claude
non-author closing receiptが揃うまで候補を confirmed としない。

stable pointer、canary→stable自動昇格、完全自動rollback、Product A/B consumer E2E、
profile分割、Cloudflare、Execution Episode、Bun永久BANの実装、実remote credentialによる
公開実行はこの pair artifact の対象外である。
