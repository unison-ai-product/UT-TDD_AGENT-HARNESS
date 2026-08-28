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
| `U-RELVER-003` | package parserへleading `v`、空identifier、空白、欠落core、不正leading zero、non-string、巨大numeric version | parse失敗をtyped/fail-open advisoryとして保持し、trim/coerceしない。既存stable tag parserは変更しない |
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
