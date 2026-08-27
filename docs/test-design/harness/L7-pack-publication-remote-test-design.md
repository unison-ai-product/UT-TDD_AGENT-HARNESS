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
exact 2 assets、各 digest/size、expected Pack main SHA、expected canary pointer before digest
を明示する。fixture生成時に source worktree、directory walk、Pack checkout、開発DB、PLAN本文、
環境変数から entry を補完しない。

### 2.2 injected ports

以下の各 port は操作名、入力 identity、呼出回数、呼出順、返却 observation を記録する。

| port | 操作 | 成功後に観測する値 |
| --- | --- | --- |
| `ApprovalPort` | receipt検証・nonce消費 | intent digest、approver、expiry、nonce |
| `PackRepositoryPort` | main/pointer観測、branch commit、PR作成、PR merge観測 | main SHA、branch/PR、Pack commit/tree、merge state |
| `TagPort` | annotated tag作成・観測 | tag name、target commit、tag digest |
| `ReleasePort` | draft prerelease作成、exact asset 2件upload、各asset観測、可視化観測 | release identity、asset name/size/bytes/digest、visibility |
| `CanaryPointerPort` | before-state観測、CAS、read-back | pointer before/after digest、release ID |
| `PublicationAuditorPort` | tag/Release/assets/sidecar/identity再計算 | attested/mismatch/unavailable |
| `ReceiptPort` | append-only receipt保存 | operation、identity、before/after、observation |

正常系の port 順序は次で固定する。

```text
sealed re-attestation
  → approval/nonce consume
  → Pack main + canary before-state observe
  → publication branch commit + PR create/observe
  → approved PR merge observe
  → exact Pack commit/tree re-observe
  → annotated tag create/observe
  → draft prerelease create
  → tar.gz + checksum upload/observe
  → complete auditor attestation
  → canary pointer CAS/read-back
  → append-only publication receipt
```

## 3. Candidate oracle matrix

| Candidate | 変異・fault | 期待結果 |
| --- | --- | --- |
| `CANDIDATE-PACKPUB-003-A` | approval absent、wrong approver、期限切れ、intent/release/source identity不一致 | typed deny、全 remote write 0 |
| `CANDIDATE-PACKPUB-003-B` | nonce replay、同一nonceの別identity、operation digest改変 | typed deny、全 remote write 0 |
| `CANDIDATE-PACKPUB-003-C` | expected Pack main SHA または canary pointer before digestを単独変異 | typed deny、全 remote write 0 |
| `CANDIDATE-PACKPUB-003-D` | commit entry、sidecar、assetの欠落・余剰・順序・bytes・size・digest変異 | typed deny、最初の remote write 0 |
| `CANDIDATE-PACKPUB-003-E` | source/worktree/DB/PLAN/local Pack checkoutからの暗黙補完を注入 | fallback拒否、最初の remote write 0 |
| `CANDIDATE-PACKPUB-003-F` | Pack branch/PR作成の拒否、timeout、unknown、別PR identity | `partial_publication`/`indeterminate`、後続 write 0 |
| `CANDIDATE-PACKPUB-003-G` | approved merge観測の拒否・timeout・unknown・別commit/tree | typed partial/indeterminate、tag以降 write 0 |
| `CANDIDATE-PACKPUB-003-H` | tag target改変、tag再利用、force push、tag観測不能 | typed deny/indeterminate、Release/asset/pointer write 0 |
| `CANDIDATE-PACKPUB-003-I` | Release identity drift、draftでないRelease、asset 0/1/3件、重複名 | typed deny、pointer write 0 |
| `CANDIDATE-PACKPUB-003-J` | tarball/checksum bytes・name・size・digest単独変異 | auditor mismatch、pointer write 0 |
| `CANDIDATE-PACKPUB-003-K` | sidecar/control snapshot、source revision、Pack treeの観測 drift | auditor mismatch、pointer write 0 |
| `CANDIDATE-PACKPUB-003-L` | auditorが unavailable/例外、attestation前に pointer CASを試行 | `unavailable`/`indeterminate`、pointer CAS count 0 |
| `CANDIDATE-PACKPUB-003-M` | canary pointer CASのbefore-state drift、拒否、応答不明、read-back不一致 | `mismatch`/`indeterminate`、成功扱い・再試行推測 0 |
| `CANDIDATE-PACKPUB-003-N` | mutation後のcleanup失敗、remote response lost | publication結果を上書きせず、cleanupを独立typed observationへ分離 |
| `CANDIDATE-PACKPUB-003-O` | 同一identity・同一nonceでattested済みstateを再観測 | idempotent resume、重複PR/tag/Release/asset/pointer write 0 |
| `CANDIDATE-PACKPUB-003-P` | 別release、別nonce、別Pack tree、順序飛越のretry | typed mismatch、後続 write 0 |

各行は単独 mutationとして実測する。複数のguardが同時に発火して「別の理由で落ちた」
状態をGreenとしない。operation logの順序と各 port countを直接 oracleにし、prose claimや
最終状態だけで副作用0を推測しない。

## 4. fault sequence と不変条件

PR、merge、tag、Release、asset upload、pointer CAS の各 mutation の直後に、成功・拒否・
unknown・observer failure を注入する。最初の unknown または観測不能以降は全ての後続
mutation countを0にし、状態を `indeterminate` または `partial_publication` のまま保持する。
remote状態を再観測して同一identityの attested state が確認できた場合だけ、同じ intentの
次境界へ再開する。未確認の成功を仮定した command retry は許可しない。

全ケースで次を検証する。

1. 最初の write 前の deny は全 remote write count 0。
2. remote ambiguity 後は後続 write count 0。
3. pointer CAS は tag/Release/assets と control snapshot の完全 attestation 後だけ1回。
4. Pack main 直接push、force push、tag retarget、asset overwrite、duplicate operation は0。
5. receipt は sealed intent、approval、before/after identity、operation順序へ束縛される。
6. source/worktree/dev DB/PLAN/evidence/local Pack checkoutを fixture input にしても結果へ影響しない。
7. supersede-forward rollbackは別intentの参照境界として記録し、この sliceで既存objectを破壊しない。

## 5. Linux / Windows / mutation 検証

Node/npmの同一テストをLinuxとWindowsで実行し、POSIX/Windows path、CRLF、case、権限、
改行差が sealed bytes・identity・operation順序を変えないことを確認する。remote portは
両OSとも in-memory spy/fault adapterであり、実ネットワークや資格情報を使わない。

CIは targeted Red→Green、TypeScript、Biome、PLAN lint、Linux、Windows、aggregate を
同一PLAN revision・exact HEADへ束縛する。各 mutation candidate の期待理由が単独に検出
できることを確認し、digest不一致だけで全てを落とす曖昧な oracleは受理しない。

## 6. 昇格と非スコープ

実装PRが `CANDIDATE-PACKPUB-003-A..P` を1対1の `U-PACKPUB-REMOTE-*` へ昇格し、各
operation の spy count と typed reason を記録する。実装・CI・Reverse R1〜R4・Claude
non-author closing receiptが揃うまで候補を confirmed としない。

stable pointer、canary→stable自動昇格、完全自動rollback、Product A/B consumer E2E、
profile分割、Cloudflare、Execution Episode、Bun永久BANの実装、実remote credentialによる
公開実行はこの pair artifact の対象外である。
