---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
plan: docs/plans/PLAN-L6-01-function-spec.md
forward_plan: docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
reverse_plan: docs/plans/PLAN-REVERSE-473-staged-release-backfill.md
---

# Release channel manifest 関数契約

## 1. 目的と境界

本書は `PLAN-REVERSE-473` R4 のbackpropとして、PF-1〜PF-5で実装された段階リリース部品を
L6の関数契約へ合流する。正本はsource repositoryのcontrol manifestであり、Pack checkoutや
`harness.db`は派生物である。ここで定義するpureな関数は外部I/Oを行わず、Git解決・materialize・
staging/applyは既存のportを介して副作用境界を明示する。

実装の開始条件は別途 `PLAN-L7-473` のS2 pair-freezeであり、本書のconfirmedは実装完了を意味しない。
R3で確認されたPF5のadvisory（attestation再照合、apply後cleanup/restoreの状態、snapshot境界）は
実装前にL7 oracleへ追加して閉じる。

| 関数 | 署名 | 事前条件 (pre) | 事後条件 (post) | 不変条件 (invariant) | 検証oracle |
| --- | --- | --- | --- | --- | --- |
| `parseReleaseManifest` / `parsePublicationManifest` | `parseReleaseManifest(input: unknown) => ReleaseManifestParseResult` / `parsePublicationManifest(input: unknown) => PublicationManifestParseResult` (`src/schema/release-manifest.ts`) | canonical bytes、schema・型・own propertyが妥当 | freeze済みmanifestまたはtyped error | 入力不変、未知field拒否 | `U-RELMAN-001`, `U-RELMAN-009`, `U-RELMAN-013` |
| `resolveReleaseChannel` | `resolveReleaseChannel(manifest, channel) => ReleaseRecord` | 登録済みown channel | 選択recordまたは`unknown_channel` | manifest/order/write不変 | `U-RELMAN-002`, `U-RELMAN-007` |
| PF-2 `materializeReleaseArtifacts` | `materializeReleaseArtifacts(input, dependencies?: ReleaseMaterializerDependencies) => ReleaseMaterializationResult` (`src/setup/release-materializer.ts`) | version tokenと読取済みtracked entriesを入力する | materialized entriesとframed digest、またはtyped failure | pure変換のみ、Git読取/worktree/network/writeなし | `U-RELMAN-011` / PLAN-L7-486 |
| PF-3 `resolveReleaseArtifacts` | `resolveReleaseArtifacts(input, dependencies: ReleaseArtifactResolverDependencies) => Promise<ReleaseArtifactResolution>` (`src/setup/release-artifact-resolver.ts`) | selected release identityとlocal Git object portを入力する | exact object読取とPF-2呼出しの結果、またはtyped failure | worktree/remote fallback/copy/writeなし、digest attestationはPF-4 | `U-RELMAN-012` / PLAN-L7-487 |
| `admitReleaseAggregate` | `admitReleaseAggregate(input: ReleaseAggregateAdmissionInput, dependencies) => Promise<ReleaseAggregateAdmissionResult>` (`src/setup/release-aggregate-admission.ts`、sealed planは`SealedReleaseAggregatePlan`) | 3 predicateが成立 | sealed planまたはtyped failure | side effect前にAND判定 | `U-RELMAN-014`, `U-RELMAN-015`, `U-RELMAN-016` |
| `applySealedReleaseAggregate` | `applySealedReleaseAggregate(plan, ports) => ApplyResult` | exact final treeとattestation | `not_applied` / `applied` / `indeterminate` | prior state不変、partial publish 0 | `U-RELMAN-017`, `U-RELMAN-018` |

> 訂正注記 (issue #977 design_follow): 旧版は `parseCanonicalReleaseManifest` と
> `buildCleanDistributionPlan` を契約名としていたが、前者は実装に存在せず（実体は
> `parseReleaseManifest` / `parsePublicationManifest`）、後者は `src/setup/distribution.ts` の別の既存関数
> （legacy clean distribution planner）と衝突する名前だった（実体は `admitReleaseAggregate`）。
> 経緯は errata memory `docs/archive/memory-legacy-2026-09/feedback-errata-on-merged-l6-release-channel-manifest-section-4-it-names-buildcleandistributionplan-c9fff25e16963a22.md` を参照。
> oracle対応: `U-RELMAN-001/009/013` は `tests/release-manifest.test.ts`、`U-RELMAN-014/015/016` は
> `tests/release-aggregate-admission.test.ts` が検証する。対応は変更しない。

## 2. 正規manifestの契約

### `parseReleaseManifest(input)` / `parsePublicationManifest(input)`

- **Pre**: 正規manifest pathから得たUTF-8 bytesだけを入力し、未知field、prototype由来property、
  不正なschema version、release/channel/orderの型・形式違反を受け付けない。
- **Post**: null-prototypeのfreeze済みmanifestを返す。`releaseId`、`artifactSourceCommit`、
  `artifactSetDigest`は形式と導出式が一致し、channelsのown keyとchannelOrderは同じ集合を一度ずつ持つ。
- **Invariant**: 入力bytesと返却値を変更せず、parse失敗時はtyped error以外の値を返さない。

### `resolveReleaseChannel(manifest, channel)`

- **Pre**: channelは登録済みのown propertyであること。
- **Post**:選択release recordだけを返し、unknown channel・未登録release・prototype由来名は
  `unknown_channel` または対応するtyped errorでfail-closeする。
- **Invariant**: manifest/channelOrderを更新せず、channel解決だけでcopy/writeを起動しない。

## 3. artifact revision とdigest

### 3.1 PF-2 `materializeReleaseArtifacts(input, dependencies?)`

- **Pre**: `input = { materializerVersion: unknown, entries: readonly ReleaseSourceEntry[] }` と、
  任意の `ReleaseMaterializerDependencies` を受け取る。tracked sourceのpath/mode/contentは読取済みであり、
  PF-2自身にGit object readerを渡さない。
- **Post**: `ReleaseMaterializationResult` として、Pack destinationのPOSIX path、mode、変換後contentを
  byte順に固定したentriesとlength-prefix framingによるdigest、または既存typed failure
  (`unavailable` / `invalid_distribution_plan` / `invalid_artifact`)を返す。
- **Invariant**: pure変換のみ。Git/worktree/network/filesystemへのアクセスやcopy/writeをせず、
  control manifest自身をartifact digestへ混入させず、入力を変更しない。symlink、mode、path衝突、
  root外参照、unsupported kindはtyped failureで閉じる。release identityへのdigest attestationは行わない。
- **検証/所有**: `U-RELMAN-011`、PLAN-L7-486、`tests/release-materializer.test.ts`。

### 3.2 PF-3 `resolveReleaseArtifacts(input, dependencies)`

- **Pre**: `input = { repository: string, release: ReleaseIdentity }` と、
  `ReleaseArtifactResolverDependencies`を受け取る。`git: LocalGitObjectReader`は選択releaseの
  local Git commit/tree/blobだけを読み、`materialize` portへ読取済みentriesを渡す。
- **Post**: `Promise<ReleaseArtifactResolution>`として、選択identity、materialized entries、計算digest、
  または既存typed failure (`unavailable` / `invalid_distribution_plan` / `invalid_artifact`)を返す。
  object/version不在や読取例外は`unavailable`で閉じる。
- **Invariant**: current worktree、Pack checkout、lazy fetch、network補完、source reconstruction、copy/writeを
  用いない。source objectを変更せず、control manifestをartifact digestから除外するPF-2境界を維持する。
  releaseの`artifactSetDigest`を運ぶが計算digestとの一致を検収しない。一致/`mismatch`判定は
  PF-4 `attestReleaseChannel`が所有し、PF-2/PF-3へ移さない。
- **検証/所有**: `U-RELMAN-012`、PLAN-L7-487、`tests/release-artifact-resolver.test.ts`。

> Issue #943訂正: 旧表/§3はPF-2 pure materializerとPF-3 local Git resolverを一つの署名に混ぜていた。
> 既存実装・owner・oracleを変更せず二つの境界へ分離した。#980のparse/aggregate名訂正は維持する。

## 4. 許可済み配布計画の契約

### `admitReleaseAggregate(input, dependencies)`

- **Pre**: clean Pack allowlistとcontrol manifestの対応が一意であり、選択revisionから許可された
  destinationへの写像が存在すること。
- **Post**: control metadataとartifact entryを混同しないsealed planを返す。三条件（manifest正本・
  allowlist包含・selected revision mapping）はside effect前にAND判定し、欠落時はplanを発行しない。
- **Invariant**: destination外、未許可path、重複mapping、schema不正ではresolver/materializer/copy/write
  の呼出しを発生させない。

## 5. 原子的なapply

### `applySealedReleaseAggregate(plan, ports)`

- **Pre**: sealed planがexact final treeから生成され、三条件とdigest attestationが成立していること。
- **Post**: 成功時はdestination commit/applyを一度だけ行い `applied` を返す。入力不備やrollback可能な
  faultは `not_applied`、restore/cleanupの結果が確定できないfaultは `indeterminate` として
  `rollback_failed` を保持する。
- **Invariant**: staging/apply各境界のfaultでprior bytes/mode/path、control manifest、allowlistを
  不変に保ち、partial publishを0にする。成功前に外部公開・pointer更新・二重applyを行わない。

## 6. L7 oracleとの対

既存の `U-RELMAN-001/002/006/007/009/011/012/013/014/015/016/017/018` が本契約の
parse・channel・materializer・resolver・aggregateを検証する。R3 advisory A-1（attested後の
identity再照合）、A-2（apply後cleanup/restore失敗時の `indeterminate`）、A-3（snapshot destination
境界）はS2実装前にmutationとして追加し、単体Greenの合算だけでR4完了を宣言しない。

外部GitHub、Pack repository、force push、tag付替え、commit/pushは本契約の副作用ではない。
promotion/rollbackのpointer変更は別のS3 pair-freeze（`CANDIDATE-RELMAN-003/004/005/008/010`）で扱う。

## 7. v2 publication manifest の出荷集合と inventory digest

移行元: `docs/plans/PLAN-L6-63-pack-staged-release-rollback.md` (issue #648)

### 7.1 `releases.<releaseId>.artifacts[]` の形

- 新規公開の入力は schema `v2` だけとする。`parsePublicationManifest` は v1 を `v1_read_only` で拒否し、
  v1 は既存 release の解決・監査用の read-only 互換に留める。v1 から tracked tree や allowlist を読んで
  集合を補完する fallback は持たない (`src/schema/release-manifest.ts:347-350`)。
- v2 の release record は `materializerVersion` (印字可能 ASCII)、`artifactSourceCommit`、`artifactSetDigest`、
  `artifactInventoryDigest`、`releaseAssetInventoryDigest`、`releaseRecordDigest`、`artifacts[]` を strict に持つ。
  `artifacts[]` の各 entry は `sourcePath` / `destinationPath` / `mode` / `size` (非負 safe integer) /
  `contentDigest` (`sha256:<64 lowerhex>`) だけを持つ。v2 の channels は `canary` / `stable` の 2 件、
  `channelOrder` は `[canary, stable]` に固定する (`src/schema/release-manifest.ts:160-180`、`:262-270`)。
- `artifacts[]` が出荷集合の唯一の列挙である。glob、directory walk、current worktree、Pack checkout から
  暗黙に追加しない。entry は `destinationPath` の UTF-8 byte 順で厳密昇順、source / destination とも重複 0。
  path は空・NUL・backslash・先頭 `/`・drive・UNC・非正規形・空 / `.` / `..` segment を拒否する
  (`validPublicationPath` / `validPublicationArtifacts`、`src/schema/release-manifest.ts:194-230`)。
- `mode` は `100644` / `100755` だけを受け付ける。mode `120000` (symlink) は v2 公開契約では拒否する
  (`PUBLICATION_MODES`、`src/schema/release-manifest.ts:9`)。

### 7.2 digest の framing

- `artifactInventoryDigest` = SHA-256 of: ASCII `ut-tdd-pack-inventory-v2\0`、entry 数 u32be、各 entry の
  `sourcePath` / `destinationPath` / `mode` / `contentDigest` を「u32be byte 長 + UTF-8 bytes」、`size` を u64be。
  `mode` と `contentDigest` は文字列表現 (`sha256:` prefix を含む) を length-prefix で入れる
  (`deriveArtifactInventoryDigest`、`src/schema/release-manifest.ts:110-125`)。
- `releaseRecordDigest` = SHA-256 of: ASCII `ut-tdd-pack-release-v2\0`、`materializerVersion` の length-prefix、
  40 byte ASCII の source commit、`artifactSetDigest` / `artifactInventoryDigest` / `releaseAssetInventoryDigest`
  の raw 32 bytes (`deriveReleaseRecordDigest`、`src/schema/release-manifest.ts:127-143`)。
- `artifactSetDigest` は §3 の既存 framing のままで、inventory digest で置き換えない。parse 時に releaseId 導出値、
  inventory digest、record digest のいずれかが不一致なら manifest を拒否する
  (`src/schema/release-manifest.ts:283-310`)。

### 7.3 設計判断

- immutable release record と可変 channel pointer を分ける。rollback を履歴破壊なしの pointer 宣言にし、
  canary / stable の同時異 version 運用を保つため。
- 出荷集合は明示 manifest (`artifacts[]`) で固定する。profile 名や directory allowlist で集合を暗黙に広げる
  方式は採らない。`pack-docs/local/consumer/admin` profile と least-privilege capability は本契約の範囲外とする。
- symlink は実需が無いため開かない。将来必要になった場合は別 slice で
  `src/setup/consumer-local-runtime-admission.ts:120` の `validSymlink` (相対 target のみ、NUL / backslash /
  drive / UNC / absolute 禁止、destination root escape 禁止) を再利用し、oracle を先に足す (未実装、PLAN-L6-63 §2)。

## 8. v2 multi-artifact inventory の基数契約

移行元: `docs/plans/PLAN-L7-742-release-aggregate-v2-inventory-cardinality.md` (issue #648)

### 8.1 admission (`admitReleaseAggregate`)

- v1 / v2 は selected release が `artifacts` 配列を持つかで判別する (`isPublicationRelease`、
  `src/setup/release-aggregate-admission.ts:140-142`)。
- v1 は従来どおり対象 channel の mapping exactly-one。2 件以上は `missing_channel_mapping`。
- v2 は対象 channel で filter した mapping 列が selected release の `artifacts` 列と**順序付き完全一致**
  (件数 N ≥ 1、各 index で `sourcePath` / `destinationPath` 一致) を要求する。欠落・余剰・重複・順序入替は
  全て不一致。述語 `publicationMappingsMatchArtifacts` は 1 つだけ置いて export し、promotion gate が再利用する
  (`src/setup/release-aggregate-admission.ts:125-138`)。各 mapping は既存 PF-5 条件 (channel / releaseId /
  sourceRevision / path 形式 / `sourcePaths` 所属 / allowlist) を個別に満たす (`:144-189`)。
  不一致は既存の `missing_channel_mapping` で返し、finding 列挙は増やさない。ここまでは attestation 呼出し前に判定する。
- attestation 後・sealed plan 発行前に `entries[i].path === artifacts[i].destinationPath` (件数一致を含む) を
  検査し、不一致は `invalid_artifact` とする (`src/setup/release-aggregate-admission.ts:290-297`)。

### 8.2 sealed plan の destination 正本

- `SealedReleaseAggregatePlan` は `schemaVersion: "v1" | "v2"` の判別共用体とする。v2 variant は scalar
  `destinationPath` を持たず、destination の正本は `entries[].path` だけ (並行配列も持たない)。v1 variant だけが
  scalar `destinationPath` を保持する (`src/setup/release-aggregate-admission.ts:66-74`、`:223-233`)。
- consumer-local admission は v2 variant だけを受け入れ、余剰の `destinationPath` を持つ plan と v1 plan を
  fail-close する (`src/setup/consumer-local-runtime-admission.ts:219-236`)。

### 8.3 昇格・巻き戻しの gate

- 入力は `mappings: readonly ReleaseChannelMapping[]` (`src/setup/release-promotion-rollback-gate.ts:104`)。
  v2 は mappings と artifacts の順序付き完全一致と `sealedPlan.entries[i].path === artifacts[i].destinationPath`、
  v1 は `mappings.length === 1` と scalar destination の一致を要求する。manifest と sealed plan の version が
  食い違えば不一致とする (`:600-632`)。不一致は既存 `identity_mismatch`、shape 不正は既存 `invalid_input`。
- v2 variant に余剰の scalar `destinationPath` がある sealed plan は promotion / rollback の shape 検証でも
  `invalid_input` とする (`validSealedPlanShape`、`:332-358`)。rollback の候補選択の意味は変えない。
- 採択は案 A2。棄却: A' (scalar に先頭 artifact を入れる。意味が無く destination 記録が二重化する)、
  B (mapping を release あたり 1 件へ畳む。artifact ごとの allowlist 検査が消える)。
- oracle: `CANDIDATE-U-RELAGGV2-001..009` (`docs/test-design/harness/L7-unit-test-design.md`)。

## 9. Pack 公開トランザクション (identity・byte 契約・段階公開・rollback)

移行元: `docs/plans/PLAN-L6-63-pack-staged-release-rollback.md` の §1〜§8・§10 (issue #958。§7.x は #648 で移行済みの
manifest 形と digest framing、本節はその残り)。Pack repository 側の公開境界だけを扱い、source 側の PF-5 aggregate
admission (§4)、promotion / rollback の pointer gate (§8.3)、Pack 導入後の二 consumer 隔離 (`PLAN-L6-101` が所有) は
再実装しない。

### 9.1 公開 object と可変範囲

| object | identity | 可変範囲 |
|---|---|---|
| immutable release record | `releaseId`、source commit、materializer version、inventory / artifact-set / asset-inventory / record の各 digest | 作成後は不変 |
| control manifest snapshot | release records と channel pointer を含む snapshot digest | pointer 変更ごとに新 snapshot を append し、過去 snapshot を上書きしない |
| Git tag | exact Pack commit と release record digest を指す annotated tag | 付替え・削除・force push 禁止 |
| GitHub Release | tag / Pack commit / release record へ束縛された draft から可視化する record | notes 編集で identity・asset・digest を変えない。asset 差替え禁止 |
| tarball / checksum | manifest の明示集合から生成した bytes とその SHA-256 | 同一 release ID で再生成・差替えしない |
| channel pointer | `canary` / `stable` から release ID への宣言 | 明示した宣言変更だけ。release record 自体は変えない |

semver / tag は表示・取得の locator であり release identity の代替ではない。可変 channel を含む snapshot digest を
immutable release identity へ入れず、receipt は release record digest と、pointer 変更前後の snapshot digest を
別 field で束縛する。tag / Release / manifest / tarball / checksum / receipt のどれかが同じ `releaseId` / digest /
source revision / Pack object SHA を指さなければ公開を成立させず `mismatch` として監査する。

### 9.2 release asset と snapshot の byte 契約

- release asset は exact に `ut-tdd-pack-<releaseId の 64 lowerhex>.tar.gz` とその `.sha256` の 2 件だけ
  (`src/setup/pack-publication-assets.ts:311-323`)。payload tarball は `artifacts[]` の destination だけを含み、control
  manifest・Release notes・checksum・signature を含めない。control manifest は Pack commit 内の sidecar として配布し、artifact-set
  digest・payload tarball・asset inventory の全てから除外する。
- tar は POSIX ustar の regular entry だけを destination path 順に並べる (directory / symlink / hardlink / PAX / GNU
  extension 禁止、ustar で表現できない path は fail-close)。header は mode = manifest 値、uid / gid = 0、mtime = 0、
  typeflag = `0`、uname / gname 空、devmajor / devminor = 0、padding はゼロ、末尾は 2 ブロックのゼロ
  (`tarHeader` / `createTar`、`:160-215`)。
- gzip は CM = 8、FLG = 0、MTIME = 0、XFL = 0、OS = 255、extra / name / comment 無しで、DEFLATE は stored block
  (BTYPE = 00、入力を 65535 byte 以下で順に分割) とし、CRC32 / ISIZE の trailer を付ける (`fixedGzip`、`:225-240`)。
  checksum file の bytes は `<64 lowerhex>  <tarball 名>\n`。
- `releaseAssetInventoryDigest` = SHA-256 of: ASCII `ut-tdd-pack-assets-v2\0`、asset 数 u32be、asset を名前の UTF-8
  byte 順に並べ、名前を「u32be 長 + UTF-8」、size を u64be、content の SHA-256 を raw 32 bytes で連結
  (`deriveReleaseAssetInventoryDigest`、`:241-250`)。tarball の SHA-256、checksum file が宣言する値、実 bytes の再計算値、
  release record が束縛する asset inventory が全て一致するまで可視化しない。
- `controlManifestSnapshotDigest` は YAML serializer の出力を信用せず、SHA-256 of: ASCII `ut-tdd-pack-control-v2\0`、
  `releases` ラベルと件数、releaseId の UTF-8 順に `releaseId + releaseRecordDigest`、`channels` ラベルと件数、
  `channelOrder` 順に `channelName + releaseId` を、すべて u32be length-prefix でフレーミングする
  (`deriveControlManifestSnapshotDigest`、`src/setup/pack-publication-staging.ts:167-185`。ラベルと件数を digest に
  含める点は PLAN 本文の記述より厳密で、実装に合わせた)。意味的に同じ manifest は YAML の表現や map 挿入順が違っても
  同じ digest になる。
- 生成は一方向 DAG とする: `artifact entries → artifactSetDigest / artifactInventoryDigest → deterministic payload tarball
  / checksum → releaseAssetInventoryDigest → releaseRecordDigest → control の manifest の snapshot → Pack の commit / tree →
  annotated tag / draft Release`。Pack commit / tree / tag と control manifest snapshot を release record へ戻さない
  (digest の自己参照を構造的に作らない)。

### 9.3 段階公開と promotion

公開順は `sealed PF-5 artifact → Pack commit / release record / draft Release / tarball / checksum → assets attested →
annotated tag → Release visible → canary pointer → canary の Linux / Windows / aggregate と Pack-only 二 consumer の
証跡 → human-approved promotion receipt → stable pointer` の直列とする。

- `canary` と `stable` は異なる immutable release を同時に指せる。canary の harness-check、artifact identity 再計算、
  二 consumer 隔離、監査証跡が `attested` になるまで stable へ進めない。`mismatch` / `unavailable` は理由を保持して
  fail-close し、成功へ丸めない。
- stable 昇格は新しい宣言変更であり、既存 release の編集や暗黙の `latest` upgrade ではない。PR、必須 CI、非著者の
  closing receipt、QA の Go / No-Go、承認済み remote mutation receipt を束ねる (pointer gate は §8.3)。
- source / worktree / dev DB / PLAN / evidence / local Pack checkout を、公開・昇格の実行入力や fallback にしてはならない。
  sealed artifact、manifest、Pack repository の公開 object、typed receipt だけで再現できなければ拒否する。

### 9.4 remote mutation と receipt

計画生成 (`sync-plan` / `release-plan` / auditor) は read-only / emit-only とし、適用側は人間の明示承認なしに remote
を変更しない。承認対象は tag 作成、Release 作成、asset upload、channel pointer 更新、promotion、rollback の操作単位。

- 承認 receipt は exact な operation plan digest、repository、before-state digest、release ID、nonce、expiry、approver を
  束縛して one-shot で消費する。期限切れ・nonce 再利用・before-state drift・別 repository / operation への転用は副作用前に
  拒否する (実装は `PackPublicationApproval` に transition / mutation / operationId / nonce / expiresAt / intentDigest /
  approvalStateDigest / idempotencyKey を持たせ、port が消費した nonce を adapter が自分で照合する。
  `src/setup/pack-publication-adapter.ts:34-60`)。
- 実行 receipt は receiptId、releaseId、channel、対象 ref、before / after digest、承認者と実行者、manifest・tarball・
  checksum・tag・Release の観測結果、CI / QA / closing receipt、成功操作の順序、失敗操作、remote response、auditor の判定を
  残す。欠落・identity 不一致・remote 取得不能は `unavailable` / `mismatch` とし、完了や昇格を宣言しない。
- force push、tag 付替え、tag 削除後の再利用、既存 asset の差替え、channel pointer の無承認変更は禁止する。

### 9.5 partial publication と rollback

- 公開は跨サービスで atomic にできないため、append-only の state machine とする。実装の遷移は `planned → pack_commit →
  release_draft → assets → tag → release_visible → canary` (mutation は `planned` / `pack_branch_commit` / `pack_pr_create`
  / `pack_pr_merge` / `release_draft_create` / `asset_upload:<name>` / `tag_create` / `release_visibility` /
  `canary_pointer_append`、`src/setup/pack-publication-adapter.ts:18-35`、`:710-745`)。各遷移は before-state への CAS、
  operation id / idempotency key、期待 remote identity を要求する。同一 identity の object が既にあるときだけ安全な再開と
  みなし、別 identity・欠損 asset・順序飛越・観測不能は `partial_publication` / `mismatch` / `indeterminate` で止める。
  再開は auditor が remote を再観測して最後の attested 状態から行い、成功を推測しない。
- GitHub Release は draft で作り、全 asset の name / size / digest を attest するまで公開しない。consumer が取得できる境界は
  tag / Release / assets を attest した後の canary pointer CAS であり、途中の tag や draft は stable / canary から発見されない。
- **未実装の目標契約**: `stable` pointer の append (遷移名 `stable_attested`) と、独立した rollback の append-only 遷移
  `rollback_planned → rollback_approved → pointer_cas_applied → rollback_attested` は adapter に実装が無い
  (実測: adapter の遷移は canary まで)。契約は次のとおり。rollback は過去 object を壊さない supersede-forward とし、
  `rollback_planned` が channel・current release ID・before snapshot digest・pointer gate (§8.3) が一意に選んだ直前の
  attested release ID・operation id を束縛する。候補 0 件 / 複数、current pointer drift、target の attestation 不一致は
  write 0 で拒否する。`rollback_approved` は同じ plan digest に対する未使用の nonce / expiry を消費する。pointer CAS 後に
  応答を失ったら `indeterminate` として auditor が snapshot を再観測し、同じ target への CAS 成立だけを再開し、別 target・
  未知 snapshot・部分変更は `rollback_failed` で止める。`rollback_attested` は pointer・snapshot・target の
  release / tag / Release / assets の全 identity を再計算した後にだけ成立する。復旧に失敗しても別 channel や別 consumer へ波及
  させず、未変更と誤報しない。

### 9.6 設計判断と持ち越し

- 設計判断 (record / pointer 分離、出荷集合の明示 manifest、profile 範囲外) は §7.3 のとおり。remote mutation は人間承認 receipt と
  auditor の観測を必須にし、自動 push / force update は採らない。
- **持ち越し (正式 stable と L12 受入の前の条件)**: `pack-docs` / `pack-local` / `pack-consumer` / `pack-admin` の
  least-privilege profile は本契約では採用していない。広い `src/**` / `tests/**` / `scripts/**` の同梱を維持する根拠、または
  profile / capability の分離を、実 artifact inventory と consumer の権限境界で検証するまで、正式 stable は完成と扱わない。
- 旧 `release-plan` は Node 正規 CLI ではなく Bun を含む command と、package 処理が生成しない `.sig` asset を出す
  参考面に留まり、実行可能な publication plan の正本として再利用してはならない。後続の publication slice が Node 正規
  CLI と実生成 asset inventory に置換するまで read-only の known gap とする (Issue #376)。
- Pack 導入後の二 consumer 受入 (source 非依存、A / B の異 version 同時稼働、片系だけの upgrade / rollback、局所障害の
  非波及) は `PLAN-L6-101` の責務で、本契約は Pack 公開の前提と非依存境界だけを定める。

### 9.7 oracle の対

`CANDIDATE-PACKPUB-001..004` (B-1: 公開 object と遷移の crosswalk、B-2: 明示 inventory 外の混入拒否、B-3: remote mutation の
承認 / 実行 receipt、B-4: supersede-forward rollback と `indeterminate` 保持) は
`docs/test-design/harness/L7-unit-test-design.md` の「PLAN-L6-63 / PLAN-REVERSE-505」節に登録済みで、local staging 部分は
`U-PACKPUB-STAGE-001..010` へ昇格済み。remote adapter 側は `docs/test-design/harness/L7-pack-publication-*-test-design.md`
が対になる。rollback FSM と stable pointer (§9.5 の未実装部分) の oracle は上記 `CANDIDATE-PACKPUB-003/004` のまま残る。
