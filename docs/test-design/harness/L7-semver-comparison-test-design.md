---
title: "L7 semver comparison test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/semver-comparison.md
status: confirmed
updated: 2026-11-19
issue: 1721
---

# semver 比較の置き換えのテスト設計 (issue #1721)

## 1. 対象と上位の契約

上位の契約は `docs/design/harness/L6-function-design/semver-comparison.md` の §4 (挙動の表) と §5 (食い違いの決定)。本書は、その表の各行を oracle の候補にする。置き換えは後続の Refactor PR が行い、各 PR の Red で候補を正式 ID (`U-SEMVER-*`) へ昇格する。それまでテストは引用しないので、すべて `CANDIDATE-` で宣言する (`src/lint/oracle-test-trace.ts` は `CANDIDATE-*` を宣言にも引用にも数えない)。

## 2. fixture

- 比較の関数は、値を渡すだけの純粋なテストにする。一時 dir も環境変数も使わない。
- `newestVersioned` は `existsSync` に依存する。一時 dir に空の file を作って「存在する候補」を作り、作らない path を「存在しない候補」にする。開発 repository の `.ut-tdd/`・`harness.db`・OneDrive を操作しない。
- A の関数は現在 module の外に出ていない。置き換えの PR では、テストできる形 (export する adapter か、`resolveClaudeCommand` の入口) を、その PR の契約として L6 に足してから Red を書く。
- 期待は、置き換え**前**の実装で先に通ることを確かめる (特性化テスト)。置き換え後も同じテストが通ることが、挙動を保った証拠になる。ただし `CANDIDATE-U-SEMVER-022` は、置き換えで意図して変える 1 件であり、置き換え前は通らない。

## 3. 候補の oracle

### 3.1 A: lenient な版の比較

| ID | 対象 | 入力・期待・反例 |
|---|---|---|
| `CANDIDATE-U-SEMVER-001` | 数値の大小 | 入力: `1.10.0` と `1.9.0`。期待: 符号が正。反例: 文字列で比べる実装。 |
| `CANDIDATE-U-SEMVER-002` | platform 接尾辞の無視 | 入力: `1.10.0-win32-x64` と `1.9.0`、`1.2.3-rc.1-win32` と `1.2.3`。期待: 正、0。反例: `semver.compare` を素通しにして prerelease とみなす実装。 |
| `CANDIDATE-U-SEMVER-003` | prerelease が順序に効かない | 入力: `1.2.3-rc.1` と `1.2.3`、`1.2.3` と `1.2.3-win32-x64`。期待: どちらも 0。反例: 素の版を新しいとみなす実装 (-1 / +1 になる)。 |
| `CANDIDATE-U-SEMVER-004` | build の無視 | 入力: `1.0.0+a` と `1.0.0+b`。期待: 0。 |
| `CANDIDATE-U-SEMVER-005` | 足りない部は 0 | 入力: `1.2` と `1.2.0`、`1` と `1.0.0`、`.5` と `0.5.0`、`1.2.` と `1.2.0`。期待: すべて 0。反例: `semver.compare` が例外を投げて落ちる実装。 |
| `CANDIDATE-U-SEMVER-006` | 数えられない入力は最古 | 入力: (空) と `0.0.0`、`abc` と `0.0.0`、`abc` と `1.0.0`、`win32-x64` と `0.0.0`、`-1.2.3` と `0.0.0`。期待: 0、0、負、0、0。反例: `semver.coerce` を使い `win32-x64` を 32.0.0、`-1.2.3` を 1.2.3 と読む実装。 |
| `CANDIDATE-U-SEMVER-007` | `v` 接頭辞 | 入力: `v1.2.3` と `1.2.3`。期待: 負 (現在の挙動は `0.2.3`)。反例: `semver.coerce` で同値にする実装。 |
| `CANDIDATE-U-SEMVER-008` | `parseInt` の寛容さ | 入力: `1.x.3` と `1.0.3`、`1.2abc.3` と `1.2.3`、`01.02.03` と `1.2.3`。期待: すべて 0。反例: `semver.coerce` (`1.0.0`、`1.2.0`、null) を使う実装。 |
| `CANDIDATE-U-SEMVER-009` | 4 部目以降 | 入力: `1.2.3.4` と `1.2.3`、`1.2.3.4` と `1.2.3.5`。期待: 正、負。反例: 4 部目を落とす実装。(契約 D-A4。落とす案を採るなら、この行を 0 に改めて契約の根拠を書く) |
| `CANDIDATE-U-SEMVER-010` | 桁あふれ | 入力: `99999999999999999999.0.0` と `1.0.0`。期待: 正。反例: 例外を投げる、または 0.0.0 に落とす実装。 |

### 3.2 A: `newestVersioned`

| ID | 対象 | 入力・期待・反例 |
|---|---|---|
| `CANDIDATE-U-SEMVER-011` | 候補が空 / 全て存在しない | 入力: 空の配列、path が全て存在しない配列。期待: どちらも `null`。 |
| `CANDIDATE-U-SEMVER-012` | 最新を選ぶ | 入力: `1.9.0` と `1.10.0` が存在 (並びは両方の順で)。期待: どちらの順でも `1.10.0` の path。反例: 辞書順で `1.9.0` を選ぶ実装。 |
| `CANDIDATE-U-SEMVER-013` | 同値は先を残す | 入力: AppData の `1.0.0` と VS Code の `1.0.0-win32-x64`。`abc` と `0.0.0`。期待: どちらも先に渡したほうの path。 |
| `CANDIDATE-U-SEMVER-014` | 読めない版と存在しない候補 | 入力: `abc` と `1.0.0` が存在、`1.10.0` は存在せず `1.9.0` が存在。期待: `1.0.0` の path、`1.9.0` の path。反例: 存在しない `1.10.0` を比べる実装。 |

### 3.3 B: release tag

| ID | 対象 | 入力・期待・反例 |
|---|---|---|
| `CANDIDATE-U-SEMVER-015` | `parseSemver` の受け入れ | 入力: `v0.1.4`、`0.1.4`、`  v1.2.3\n`。期待: `[0,1,4]`、`[0,1,4]`、`[1,2,3]`。 |
| `CANDIDATE-U-SEMVER-016` | prerelease と build の拒否 | 入力: `v0.2.0-rc.1`、`1.2.3+b`、`v1.0.0-beta`。期待: すべて `null`。反例: `semver.valid` を関門にする実装 (3 件とも通す)。 |
| `CANDIDATE-U-SEMVER-017` | 欠けた部と別の接頭辞の拒否 | 入力: `v1.2`、`release-candidate`、(空)、`vv1.2.3`、`=1.2.3`、`V1.2.3`、`v 1.2.3`。期待: すべて `null`。 |
| `CANDIDATE-U-SEMVER-018` | 先頭 0 と桁あふれの受け入れ | 入力: `v01.2.3`、`v99999999999999999999.0.0`。期待: 受け入れる。`v01.2.3` は `[1,2,3]`。反例: `semver.valid` を関門にする実装 (どちらも null)。 |
| `CANDIDATE-U-SEMVER-019` | `latestReleaseTag` の選び方 | 入力: `["v0.1.9","v0.1.10","v0.1.2","nightly","v1.0.0-beta"]`、`[]`、`["nightly","poc"]`、`["v1.0.0-beta","v0.9.0"]`。期待: `"v0.1.10"`、`null`、`null`、`"v0.9.0"`。 |
| `CANDIDATE-U-SEMVER-020` | 同値と trim と先頭 0 | 入力: `["v1.2.3","1.2.3"]` と逆順、`["  v0.1.4  ","v0.1.3"]`、`["v01.2.3","v1.2.4"]`、`["v1.2.3","v01.2.3"]`。期待: 先頭の tag (逆順は `"1.2.3"`)、`"v0.1.4"`、`"v1.2.4"`、`"v1.2.3"`。反例: 同値で後ろを選ぶ実装。tag をそのまま (trim せず) 返す実装。 |
| `CANDIDATE-U-SEMVER-021` | 入力の順序に依らない | 入力: 同値を含まない tag の並びを全ての順列で。期待: 結果が一定。 |

### 3.4 C: package の version

| ID | 対象 | 入力・期待・反例 |
|---|---|---|
| `CANDIDATE-U-SEMVER-022` | 長さの上限 (契約 D-C2。意図して変える 1 件) | 入力: `1.0.0-` + `a` を 251 個 (長さ 257)、`1.0.0-` + `a` を 250 個 (長さ 256)。期待: 前者は `null`、後者は受け入れる。**この行だけ、置き換え前は前者を受け入れるので通らない。** |
| `CANDIDATE-U-SEMVER-023` | 厳密な受け入れ | 入力: `1.0.0 `、`1.0.0\n`、` 0.2.0-canary.1`、`v0.2.0-canary.1`、`=1.0.0`、`1.2`、`01.0.0`、`1.0.0-a..b`、`1.0.0+`、`1.0.0-1.01`、`0.2.0-`、`0.2.0-01`、`9007199254740992.0.0`、`undefined`、数値。期待: すべて `null`。反例: `semver.valid` を関門にする実装 (`1.0.0 `、`1.0.0\n`、` 0.2.0-canary.1`、`v0.2.0-canary.1` を通す)。 |
| `CANDIDATE-U-SEMVER-024` | prerelease の型と順序 | 入力: `0.2.0-canary.1` と `0.2.0`。期待: `prerelease` は `["canary","1"]` (文字列の配列)、前者が低い。反例: `semver.parse` の返り値を公開する実装 (`["canary",1]`)。 |
| `CANDIDATE-U-SEMVER-025` | build は無視 | 入力: `1.0.0+build.1` と `1.0.0+build.2`。期待: 0。 |
| `CANDIDATE-U-SEMVER-026` | prerelease の識別子の順 | 入力: `1.0.0-alpha` と `1.0.0-alpha.1`、`1.0.0-1` と `1.0.0-alpha`、`1.0.0-rc.2` と `1.0.0-rc.10`、`1.0.0-RC` と `1.0.0-rc`、`1.0.0-9007199254740993` と `1.0.0-9007199254740994`。期待: 5 組とも前者が低い。 |
| `CANDIDATE-U-SEMVER-027` | 返り値の符号だけを約束 | 入力: 026 の組と、同値の組。期待: `Math.sign` で比べる (負・0・正)。値の大きさは確かめない。 |
| `CANDIDATE-U-SEMVER-028` | `semver.compare` との順序の一致 | 入力: major・minor・patch と prerelease の識別子をランダムに組んだ有効な組 (種を固定。2000 組以上)。期待: `Math.sign(comparePackageSemver)` と `semver.compare` が全て一致。 |

## 4. 昇格の手順

実装 PR ごとに、その PR が置き換える範囲の候補 (A は 001〜014、B は 015〜021、C は 022〜028) だけを正式 ID へ昇格する。Red は、置き換え前の実装で特性化テストが通ること (022 を除く) と、置き換え後も通ることを確かめる。`tests/update-check.test.ts` の既存の `U-UPDCHK-001` `U-UPDCHK-002` `U-RELVER-002` `U-RELVER-003` は、引き続き通す。

## 5. 契約からの追跡

| 契約の節 | 候補 |
|---|---|
| L6 §4.1 | 001〜010 |
| L6 §4.2 | 011〜014 |
| L6 §4.3 | 015〜021 |
| L6 §4.4 | 022〜028 |
| L6 §5 の D-A1〜A6 | 002、003、005、006、007、008、009、010 |
| L6 §5 の D-B1〜B5 | 016、017、018 |
| L6 §5 の D-C1〜C4 | 022、023、024、027 |
