---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
issue: 152
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

## 9. Pack の実行可能ファイルの mode を保つ方式 (Issue #821)

source で `100755` のファイルが、Pack の C1 (Pack checkout で作る commit) と公開 tar では `100644` になる。
本節はその是正方式を freeze する設計判断であり、実装・テストはこの節を oracle の正本として別 PR で行う。
PLAN は凍結中 (#1166) のため、方式判断はここへ置く。

### 9.1 実測した事実

| 事実 | 根拠 |
| --- | --- |
| source で `100755` の tracked file は 2 件だけ: `scripts/ut-tdd` (blob `bfd690c5`)、`scripts/git-hooks/pre-push` (blob `1f7ad806`) | `git ls-files -s \| grep ^100755` (origin/main `09ee54f0d`) |
| Pack main には `100755` が 0 件。`scripts/ut-tdd` の blob は source と同一 (`bfd690c5`) で、落ちているのは mode だけ | `gh api repos/unison-ai-product/UT-TDD_AGENT-HARNESS-Pack/git/trees/HEAD?recursive=1` の mode 絞り込みが空、`contents/scripts/ut-tdd` の sha |
| sync-pack の copy は `cpSync` / `writeFileSync` だけで mode を扱わない。Git index も触らず、`git add` / `commit` / `push` は文字列として `nextCommands` に出すだけ (`localGitMutationExecuted: false`) | `src/cli/distribution.ts:186-213` (copy)、`:1085-1101` (`nextCommands`)、`CLAUDE.md` §Distribution Repository |
| Windows の Git は `core.filemode=false` で、working tree の実行 bit が無いため、新規 file の `git add` は `100644` を index に載せる | この PC の `git config core.filemode` = `false`。issue #821 の推定原因 (未確定) と整合する |
| 期待 mode はすでに sealed 済みの値がある。release manifest v2 の `artifacts[].mode` は source の tag/commit の Git tree から作られ、`artifactInventoryDigest` に入っている | `docs/design/harness/L6-function-design/release-channel-manifest.md` §7.1-7.2、`src/schema/release-manifest.ts:110-125` |
| 公開 tar の header mode は C1 の Git object の mode を使い、`100644` / `100755` 以外を拒否する。#807 / PR #813 は tar が C1 の mode を保つことまでを扱い、C1 自体の落ち込みは範囲外 | `src/setup/pack-publication-assets.ts:116`、`:163`、`:263`、issue #821 本文 |

未確認: canary.3 の C1 が sync-pack + 人手の `git add` で作られたことは、issue 本文の推定であり、
本調査では C1 作成時の操作ログを再現していない。

### 9.2 選択肢

| 案 | 内容 | 長所 | 短所 |
| --- | --- | --- | --- |
| A | sync-pack が期待 mode を読み、`git add` の後・`commit` の前に実行する `git -C <repo> update-index --chmod=+x <path>` を `nextCommands` と copy evidence に出す。sync-pack 自身は index を変更しない | 非破壊境界 (commit / push / index 変更なし) を保つ。修復手順が機械的に出る | 手順が人手で飛ばされると検出できない |
| B | C1 作成後に、独立した Git 読取り (`git ls-tree`) で C1 の path / mode / blob を期待値と照合し、`100644` への落ち込みを fail-close する | 実際に作られた C1 を測るので、手順の抜けを必ず検出する | 検出だけで、修復手順を示さない |
| C | A と B を両方採る | 修復手順と検出の両方がそろう | 実装が 2 か所になる。ただし B は A の手順を実施したかの判定そのもの |

### 9.3 技術助言 (advisor)

- 相談先: `gpt-6.1-sol` (`ut-tdd advisor --decision implementation --current-model claude-sonnet-5-5 --execute`)。
- 回答の要約: 案 C を推奨する。期待 mode の正本は公開対象 source commit の Git tree とし、可変な index を毎回
  `ls-files -s` で読む方式は staged 変更が混入するので公開判定に使わない。manifest の `artifacts[].mode` はその
  commit から導いた値として固定し、source commit SHA と結び付ける。検査は `+x` 対象だけでなく全 artifact の
  mode を完全照合する (不要な `100755` の混入も落とす)。oracle はファイルシステムの実行 bit を使わず、
  Git object (`git ls-tree` と blob) だけを見る。
- 前提の検証: 助言の「manifest が mode をどこから得るか」という不足証拠は §9.1 の実測で埋まった
  (manifest は source の tag/commit の Git tree から導出済み)。リスク「manifest と C1 が同じ誤った mode から
  作られると照合が効かない」は、独立に source commit の Git tree を読むことで避ける (§9.4 の 2)。
  助言と実測の食い違いはない。

### 9.4 採択: 案 C

1. **期待 mode の正本は、公開対象 source commit の Git tree とする**。新しい「実行可能ファイル宣言 manifest」は
   作らない (source の mode が正本であり、宣言を別に持つと二重管理になる。棄却)。sync-pack は
   `git ls-tree -r <sourceTag または sourceRevision>` から artifact ごとの期待 mode を導く。working tree や
   index (`git ls-files -s`) は staged 変更が混ざるため、期待値の入力にしない。
2. **A (sync-pack の出力)**: sync-pack は copy 後、期待 mode が `100755` の path について、人間が実行する
   `git -C <repo> update-index --chmod=+x -- <path>` を `nextCommands` の `git add` の後・`commit` の前に出す。
   同じ path / mode の一覧を copy evidence (`.ut-tdd/pack-sync/<tag>.sync-pack.json`) の `pack` に記録する。
   sync-pack は引き続き `git add` / `update-index` / `commit` / `push` を実行しない
   (`localGitMutationExecuted: false` を保つ)。path は `--` 区切りで渡し、空白・引用符を含む path でも
   手順が別 path を指さないようにする。
3. **B (C1 の照合)**: C1 作成後、公開前に、C1 の Git tree を独立に読む (`git ls-tree -r <C1>`、blob は
   `git cat-file`) 照合を追加する。期待値は 1 の source commit の Git tree から導いた (path, mode, bytes の
   digest) と、release manifest v2 の `artifacts[].mode` の双方で、どちらかと食い違えば fail-close する。
   検査は全 artifact の mode の完全照合であり、`100755` を期待しない path が `100755` の場合も落とす。
   manifest と C1 を同じ producer の出力だけで比べる検査にはしない。照合の対象 C1 は SHA で固定し、
   後続の公開処理が同じ SHA を使うことを同じ gate で確かめる。
4. **範囲外**: #807 / PR #813 の tar 生成 (`pack-publication-assets.ts`) は変更しない。canary.3 の公開物は
   作り直さず、是正は次の版で効けばよい。#418 の AT-DIST の判定を止めない。
5. **棄却**: A のみ (人手の抜けを検出できず、本 issue の再発を止められない)、B のみ (落ち込みを検出しても
   修復手順が出ず、毎回人間が原因を探す)、宣言 manifest (1 のとおり二重管理)。

### 9.5 oracle

`CANDIDATE-U-PACKMODE-001..006` (`docs/test-design/harness/L7-unit-test-design.md`)。Windows と Linux の両方で、
実行 bit ではなく Git object の mode だけを観測する。
