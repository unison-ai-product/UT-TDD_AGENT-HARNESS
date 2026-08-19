---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
plan: docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
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

| Function(s) | Signature | pre | post | invariant | oracle |
| --- | --- | --- | --- | --- | --- |
| `parseCanonicalReleaseManifest` | `parseCanonicalReleaseManifest(input) => Result` | canonical bytes、schema・型・own propertyが妥当 | freeze済みmanifestまたはtyped error | 入力不変、未知field拒否 | `U-RELMAN-001`, `U-RELMAN-009`, `U-RELMAN-013` |
| `resolveReleaseChannel` | `resolveReleaseChannel(manifest, channel) => ReleaseRecord` | 登録済みown channel | 選択recordまたは`unknown_channel` | manifest/order/write不変 | `U-RELMAN-002`, `U-RELMAN-007` |
| `materializeReleaseArtifacts` | `materializeReleaseArtifacts(record, reader, materializer) => ArtifactSet` | object・versionが利用可能 | framed digest付きartifact set | worktree/network/write非依存 | `U-RELMAN-011`, `U-RELMAN-012` |
| `buildCleanDistributionPlan` | `buildCleanDistributionPlan(manifest, artifacts, allowlist) => SealedPlan` | 3 predicateが成立 | sealed planまたはtyped failure | side effect前にAND判定 | `U-RELMAN-014`, `U-RELMAN-015`, `U-RELMAN-016` |
| `applySealedReleaseAggregate` | `applySealedReleaseAggregate(plan, ports) => ApplyResult` | exact final treeとattestation | `not_applied` / `applied` / `indeterminate` | prior state不変、partial publish 0 | `U-RELMAN-017`, `U-RELMAN-018` |

## 2. canonical manifest

### `parseCanonicalReleaseManifest(input)`

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

### `materializeReleaseArtifacts(record, sourceReader, materializer)`

- **Pre**: recordの `artifactSourceCommit` と `materializerVersion` が実装済みで、sourceReaderは
  current worktreeやnetwork補完を使わず対象Git objectを読めること。
- **Post**: Pack destinationのPOSIX path、mode、変換後contentをbyte順に固定したartifact setと、
  length-prefix framingによる `artifactSetDigest` を返す。release ID導出値との不一致は
  `mismatch`、object・version不在は `unavailable` とする。
- **Invariant**: control manifest自身をartifact digestへ混入させず、入力・source objectを変更しない。
  symlink、mode、path衝突、root外参照、unsupported kindはtyped failureで閉じる。

## 4. clean distribution plan

### `buildCleanDistributionPlan(manifest, artifactSet, allowlist)`

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
