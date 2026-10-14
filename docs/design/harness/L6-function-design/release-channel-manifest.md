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
promotion/rollbackのpointer変更の許可判定（S3、`CANDIDATE-RELMAN-003/004/005/008/010`）は§9で扱う。

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

## 9. S3 promotion admission / rollback admission gate (Issue #360)

実装は `src/setup/release-promotion-rollback-gate.ts` (PLAN-L7-494)。本節は PF-1〜PF-5 が確定した release artifact を次の
配布段階へ進める promotion admission と、直前の attested release へ戻す rollback admission の判定契約を定める。

### 9.1 責務境界

S3 が新規に所有するのは、既存の receipt と identity を合成する **pure な decision gate だけ**である。gate 自身の `sideEffects` は
常に `"none"` で、apply / restore の実行結果は既存 port の別 receipt として入力される。次は S3 の範囲外とする: Pack copy、
consumer runtime の導入・更新・復旧 (`pack-consumer-isolation.md` の責務)、GitHub Release、D1〜D3 の authority、Execution Episode、
force push、tag 付替え、commit / push。新しい artifact 生成、publish、rollback apply engine を発明しない。

pure predicate 単体の呼び出し回数は「副作用 0」の証跡に数えない。deny と indeterminate の各経路の副作用 0 は、既存 PF-5 の
pointer write / publish / apply / restore の injected port を composition harness へ渡し、spy count と prior state で観測する。
pure gate は port を直接 import も呼び出しもせず、観測は composition 側が所有する。

### 9.2 入力の正本と型境界

| 入力 | 正本 | S3 での扱い |
|---|---|---|
| release identity / channel order | `src/schema/release-manifest.ts` の `ReleaseIdentity` / `ReleaseManifest`、本書 §2〜§3 | `releaseId`、`materializerVersion`、`artifactSourceCommit`、`artifactSetDigest` を正本値とし、channel は manifest の own property と `channelOrder` から解決する |
| PF4 attestation | `src/setup/release-channel-adapter.ts` の `ReleaseChannelAttestation` | `status: "attested"` だけを受理し、`releaseId` / `artifactSourceCommit` / `expectedDigest` / `actualDigest` を manifest と再照合する。`mismatch` / `unavailable` は deny |
| PF5 sealed aggregate | `src/setup/release-aggregate-admission.ts` の `SealedReleaseAggregatePlan` | `channel` / `releaseId` / `sourceRevision` / `expectedDigest` / `actualDigest` を同じ release identity へ束縛する |
| canonical CI | `CanonicalCiEvidence` | `checkName` は `REQUIRED_GITHUB_CHECK`、exact HEAD、PLAN revision、`legs` (linux / windows / aggregate) がすべて `success`、`evidenceDigest`、`observedAt` を必須とする |
| QA Go/No-Go | `QaReleaseGateEvidence` | G01〜G08 の各判定、対象 release identity、source revision、artifact digest、channel、`evidenceDigest` を必須とする。`go` 以外は `qa_no_go` |
| review | `ReviewGateEvidence` | 既存 D1 の `ReviewDispatchEntry`、D2 の `MergeGateDecision` と `MergeGateFacts`、`claimBlind` / `specBlind` の `ReviewReceiptSource` を、派生コピーにせず**そのまま束縛**する |

型の制約は次のとおりとする。

- 値は `success` / `go` 以外を成功へ coerce せず、unknown field、欠落、重複は typed deny とする。
- `observedAt` は監査と同一入力内の順序確認にだけ使う。暗黙の TTL や wall-clock 依存の期限切れ判定は導入しない。freshness は
  exact subject / head / PLAN revision / evidence digest の一致と、既存契約が要求する timestamp の形式・順序で決める。
- review は、D1 が `merge_ready` で verdict が `PASS` か `PASS-WEAK`、breaches / blocking / reasons が空、D2 が `ok` かつ
  `merge_ready` で reasons が空、`facts.state` が `OPEN` で checks green、`claimBlind` と `specBlind` の両 lane が
  `validCrossReviewSource` を通ること、を要求する。片 lane の欠落、lane の混線、D1 の blocking 残存、D2 の subject 不一致は
  deny である。`ReviewReceiptSource` 単体を D1 / D2 の代用にしない。
- 比較は exact head と PLAN revision (`facts.headSha`、`evaluatedHeadSha`、`d2.headSha`、`d1.exactHead`、全 lane の subject) の
  全一致、author / reviewer family と receipt digest の `expectedEvidence` との一致で行う。

### 9.3 promotion admission

次の全条件の AND が成立した場合だけ `allow` とする。

1. manifest の選択 identity、PF4 attestation (`attested`)、PF5 sealed plan、channel mapping が、同一 release identity で成功している。
2. `CanonicalCiEvidence` が exact HEAD と PLAN revision に束縛され、`harness-check` の Linux / Windows / aggregate が成功している。
3. `QaReleaseGateEvidence` が G01〜G08 すべて `go` で、対象の release identity、source revision、artifact digest、channel、
   evidence digest に exact に束縛されている。
4. review が §9.2 のとおり ready である。
5. manifest、materialized artifact、resolver 結果、channel mapping、PF5 sealed aggregate の `releaseId` / `sourceRevision` /
   `artifactDigest` が一致する。
6. target channel が `channelOrder` 上で current channel の**直後**である。

いずれかが欠落・不一致・stale (head、PLAN revision、evidence digest の不一致)・別 subject なら `deny` とする。promotion 先への
write、publish、tag 変更、commit、push は 0 である。receipt を別 release から再利用する fallback と、CI / QA の一部成功を
promotion 成功へ丸める fallback は持たない。

判定結果は `allow` (identity と束縛済み evidence digest を持つ sealed decision。publish / apply は呼び出し側の後段 port に委ねる)
または `deny` (typed reason) だけである。reason の優先順位は次のとおりで、先に該当したものを返す。

| 順 | reason | 該当 |
|---|---|---|
| 1 | `invalid_input` | typed input の shape 不正、必須 field の欠落 |
| 2 | `identity_mismatch` | stale または別 subject (HEAD、PLAN revision、release identity、artifact digest、evidence digest、channel の不一致)。stale を missing へ丸めない |
| 3 | `ci_missing` | canonical CI evidence の欠落 |
| 4 | `qa_missing` / `qa_no_go` | QA evidence の欠落 / G01〜G08 のいずれかが `go` でない |
| 5 | `review_missing` | D1 / D2 / claim-blind / spec-blind のいずれかの欠落、または ready でない |
| 6 | `channel_transition_invalid` | target が current の直後でない、unknown channel |
| 7 | `attestation_unavailable` | attestation の欠落または `attested` でない |

### 9.4 rollback admission

rollback の対象は、現在の release に対して**直前に attest 済み**で、identity (releaseId、sourceRevision、artifactDigest、
materializer version、channel) が完全一致する**一つの** release だけである。判定は 2 段に分かれる。

1. **候補選択** (`selectRollbackCandidate`): 現行 `ReleaseIdentity`、current / target channel、exact head、PLAN revision、
   期待する review binding、候補を受ける。review 証跡は rollback でも必須で、欠落または shape 不正は `invalid_input`、
   identity 不一致は `identity_mismatch`、ready でない場合は `invalid_input` とする。target channel は current の**直前**でなければならない。
   候補が 0 件なら `candidate_missing`、2 件以上なら `candidate_ambiguous` で deny する。一意の候補は pointer delta
   (channel、from、to) と、その digest を持つ `allow` になる。
2. **apply 結果の分類** (`classifyRollbackApply`): 既存 `ReleaseAggregateApplyResult` を次のとおり写像する。
   `{ ok: true, applied: 1 }` は `allow`、`{ ok: false, error: "unavailable", applied: 0 }` は
   `deny` / `artifact_unavailable`、`{ ok: false, error: "rollback_failed", applied: "indeterminate" }` は
   `indeterminate` / `rollback_failed`。それ以外は `deny` / `invalid_input`。`rollback_failed` は indeterminate decision の唯一の
   reason であり、別の restore-unknown reason は導入しない。

候補選択の reason 優先順位は、`invalid_input` → `identity_mismatch` (review の不一致) → `candidate_missing` /
`candidate_ambiguous` → `identity_mismatch` (候補の stale、別 subject、非隣接 target を含む) → `attestation_missing` →
`artifact_unavailable` とする。private staging / apply の復元不能は成功へ丸めず、`rollback_failed` / `indeterminate` として
fail-close する。rollback の選択は同一入力から再実行して同じ結果になる決定論的な手順とする。rollback 対象外の release、最新化による
暗黙 upgrade、source repository への fallback は許可しない。promotion と同様に force push、tag 付替え、commit、push、
consumer runtime 操作は行わない。

### 9.5 oracle との対

`CANDIDATE-RELMAN-003/004/005/008/010` と `019`〜`023` が、`docs/test-design/harness/L7-unit-test-design.md` の
`U-RELMAN-*` (S3 promotion / rollback) として本節を検証する。新しい ID は発明せず、対応する `U-RELMAN-*` へ 1:1 で対応させる。
