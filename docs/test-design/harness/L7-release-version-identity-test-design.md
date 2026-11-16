---
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: confirmed
plan_id: PLAN-L7-523-release-version-identity
---

# L7 初回canary version locator identity test design

## 1. 対象境界

`PLAN-L7-523`専用のpair artifactである。package/CLI prerelease version、annotated tag locator、
content-derived release ID、release Pack commit/treeの束縛だけを検証する。manifestのrelease ID導出、
asset bytes/naming、remote publication FSMは既存oracleを再所有しない。

実装前は全IDを`CANDIDATE-*`とし、Red→Greenを観測したものだけを同番号の正規IDへ昇格する。
`U-RELVER-001..006/009`と`P-RELVER-001`は本実装でRed→Greenを確認済みであり、
RELVER candidate 007/008は未実装の負系候補として正規oracleへ昇格しない。

## 2. Candidate oracle matrix

| Candidate | 独立変異・入力 | 期待結果 |
| --- | --- | --- |
| `U-RELVER-001` | root `package.json.version`、`package-lock.json` top-level `.version`、同 `.packages[""].version` を別々に読む | 三者が`0.2.0-canary.1`でexact一致し、CLI `--version`もexact一致。version定数の別実装0 |
| `U-RELVER-002` | 新package parserへ`0.2.0-canary.1`、numeric/non-numeric prerelease、stableを個別入力 | canonical package prereleaseをparseしSemVer precedenceどおり。stableは同core prereleaseより高い |
| `U-RELVER-003` | package parserへleading `v`、空identifier、空白、不正leading zero、巨大numeric version | parse失敗をtyped/fail-open advisoryとして保持し、trim/coerceしない。既存stable tag parserは変更しない |
| `U-RELVER-004` | sealed entriesのpackage欠落/重複、invalid JSON、version欠落/non-string | seal前typed deny、全remote write 0 |
| `U-RELVER-005` | package versionまたはlockfile top-level/root versionを一軸ずつ`0.1.4`へ変異 | `release_version_mismatch`、seal前にdenyし全remote write 0。他digest軸はvalidに固定 |
| `U-RELVER-006` | tagだけbare、`v0.1.4`、`v0.2.0-canary.2`へ変異 | `tag_version_mismatch`、全remote write 0 |
| `CANDIDATE-U-RELVER-007` | intent/receiptの`releaseVersion`または`tagName`を各一軸変異 | reconcile/receipt受理をdenyし、新規remote write 0 |
| `CANDIDATE-U-RELVER-008` | staging seal後にpackage entry bytesを変え、version/tagだけ整合させる | entry/content/manifest/intent digest mismatch、最初のremote write 0 |
| `U-RELVER-009` | stable tag、`v0.2.0-canary.1`、別prerelease、nightlyを混ぜて`latestReleaseTag`と`checkForUpdate`を実行 | prereleaseをstable候補へ選ばず、既存`U-UPDCHK-001/002`を保持。local canary対stable tagだけpackage SemVer precedenceで比較 |
| `P-RELVER-001` | package/CLI=`0.2.0-canary.1`、tag=`v0.2.0-canary.1`、既存content-derived releaseIdを入力 | manifest releaseId式を変えず、同じrelease Pack commit/treeへ束縛したsealed intentを一意生成 |

## 3. 判別性

各負系はpackage/tag/version以外のrelease ID、source revision、entry digest、sidecar、asset digest、
approval、nonceをvalidに固定する。digest不一致だけで全caseを落とさず、versionとtagのtyped reasonおよび
port call ledgerを直接観測する。`releaseId`をsemverへ置換するmutationは正系をRedにしなければならない。
既存`parseSemver`をprerelease対応へ広げるmutation、または`latestReleaseTag`がcanary tagを選ぶmutationは
`U-RELVER-009`をRedにしなければならない。

## 4. 実装・検証順

1. TerraがcandidateごとのRedとnegative controlを実装する。
2. Lunaがpackage/lock、prerelease parser、publication linkageを最小実装する。
3. targeted test、typecheck、Biome、PLAN lint、Linux/Windows/aggregateを同一exact HEADで実行する。
4. OpusまたはSolがrelease ID式、tag target、sealed entry、write 0を非著者攻撃する。

実credential、実remote mutation、Bun撤去、clean consumer L12、stable昇格、Product A/Bは非Scopeとする。

## 5. CLI version 表示と sealed release identity の candidate oracle (Issue #867)

契約は `docs/design/harness/L6-function-design/cli-version-identity.md`。
§2 の `U-RELVER-001..006/009` は publication 側の oracle であり再所有しない。本節は CLI と update-check の
表示元だけを扱う。いずれも実装前は `CANDIDATE-*` で、Red→Green を観測したものだけを同番号の正規 ID へ昇格する。
番号は既存の candidate `007/008` と重ならないよう `010` から振る。

各 case は表示元以外 (digest・receipt・active pointer・tag 書式) を valid に固定し、1 軸だけを変える。

| Candidate | 独立変異・入力 | 期待結果 |
| --- | --- | --- |
| `CANDIDATE-U-RELVER-010` | Release asset だけから導入した sealed consumer (tag `v0.2.0-canary.8`) で、`node .ut-tdd/bin/ut-tdd.mjs --version` を実行する。cwd は harness の `package.json` が無い consumer root | 出力は exact に `0.2.0-canary.8` (先頭の `v` なし、改行のみ付加)。`0.0.0` を含まない。`package.json` の version や `release_id` を表示する変異は Red |
| `CANDIDATE-U-RELVER-011` | source checkout で `node src/cli.ts --version` を実行する (`__UT_TDD_BUNDLED__` 未定義)。一時 fixture 上で `package.json` の version を別値へ変え、近傍に偽の `bundle-manifest.json` を置く | 出力は fixture の `package.json` の version と exact 一致 (`U-RELVER-001` の CLI 軸を保持)。sealed 用の manifest 探索を source で行う変異は偽 manifest の tag が出て Red |
| `CANDIDATE-U-RELVER-012` | sealed bundle の `bundle-manifest.json` を (a) 削除、(b) 不正 JSON、(c) `identity.release_tag` だけ欠落 (旧 generation 相当、digest は整合して再計算) にする。別に (d) リポジトリ外へ手で置いた bundle (`scripts/build-node.mjs` の出力を `bundle-manifest.json` なしで実行)。全 case で bundle の外の近傍に別 version の `package.json` を置く | 全て exit 0 で出力は exact に `unidentified`。`0.0.0` を出さない。bundle 外の `package.json` を拾う変異は近傍の別 version が出て Red |
| `CANDIDATE-U-RELVER-013` | sealed bundle の `bundle-manifest.json` で `identity.release_tag` だけを別 tag へ書き換え、`bundle_digest` は再計算しない | 出力は `unidentified` (書き換え後の tag を表示しない)。digest 検証を省く変異は書き換え後の tag が出て Red |
| `CANDIDATE-U-RELVER-014` | installer (`completeConsumerRuntimeInstallation` 経路) で tag `v0.2.0-canary.8` の Release を導入し、保存された identity を test 側で独立に読む。別 axis で (a) identity 構築の tag 入力を `release_id` に置換する変異、(b) 書式不一致 (`v` 欠落) の `release.tag` を持つ release 文書を入れる | `identity.release_tag` が asset 名・release 文書の `release.tag` と exact 一致し、`bundle_digest` の入力に含まれる (他を固定して `release_tag` だけ変えると digest が変わる)。(b) は `consumer_runtime_identity_mismatch` で deny、consumer root への write 0。(a) の変異は Red |
| `CANDIDATE-U-RELVER-015` | `CANDIDATE-U-RELVER-010` の導入後、`<release-dir>` を削除し、network を遮断 (git remote・env の remote を空) して `--version` を実行する | 出力は exact に `0.2.0-canary.8`。release-dir・Pack checkout・network のいずれかを読む変異は削除後に `unidentified` か失敗となり Red (`U-PACKRT-005` と同じ fixture を再利用し、再所有しない) |
| `CANDIDATE-U-RELVER-016` | `checkForUpdate` の local version 入力を (a) sealed identity の tag `v0.2.0-canary.8`、(b) `unidentified` とし、remote は fixture の stable tag `v0.2.0` を返す | (a) は `localVersion = 0.2.0-canary.8`、`checked=true`、`updateAvailable` は package SemVer precedence どおり (stable `0.2.0` が canary より高い)。(b) は `checked=false`、`detail` に `harness version unidentified`、`renderUpdateLine` に `v0.0.0` を含まない。remote の解決順 (`U-UPDCHK-*`) は不変 |
| `CANDIDATE-U-RELVER-017` | (P1 採択済み。実装は producer の別 PR) 一時 git repo で artifact commit の `package.json` の version を (a) tag と一致、(b) 不一致、(c) `package-lock.json` だけ不一致にして producer の source binding を実行する | (a) は通過。(b)(c) は出力前に typed error で fail-close し、出力先に asset 0。本 candidate は producer の実装 PR が所有し、`010..016` の実装 PR とは別に昇格する (`010..016` は不変)。 |

### 判別性

- `010` と `011` は形態 (sealed / source) を分け、識別元の取り違えを互いに落とす。`011` の偽 manifest は sealed 用探索の混入を、
  `012` の近傍 `package.json` は bundle 外の拾い食いを個別に落とす。
- `013` は identity の digest 束縛を、`014` は保存の書き込み側 (installer) を、`015` は自己完結性を個別に固定する。
  `013` だけでは「保存されない」実装を検出できないため `014` も置く。
- `0.0.0` への fail-open は `012` (表示) と `016(b)` (update-check) で別々に落とす。
- 実装 PR は candidate ごとに Red (`it.fails`) を先に入れ、Green 後に同番号の `U-RELVER-*` へ昇格する。fixture は一時ディレクトリだけを使う。
  `src/cli.ts` を変える実装は S7 (#1379) の merge 後とする。
