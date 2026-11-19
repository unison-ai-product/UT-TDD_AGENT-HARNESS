---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_semver_comparison
pair_artifact: docs/test-design/harness/L7-semver-comparison-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1721
---

> **L6 contract marker**: 本書は、自前の semver 比較 2 か所を既存の依存 `semver` へ寄せる Refactor の**前提となる契約**である。置き換えで保つ挙動を、入力から出力への表として固定する。コードは本 PR では変えない。実装は後続の Refactor PR (1 PR = 1 論点) が受け持ち、oracle の詳細 (`CANDIDATE-U-SEMVER-*`) は `docs/test-design/harness/L7-semver-comparison-test-design.md` が固定する。

# semver 比較の置き換えの契約 (issue #1721)

## 1. 目的

`semver` (dependencies の `^7.8.6`、`src/lint/toolchain-pin.ts` と `src/setup/distribution.ts` で使用済み) があるのに、2 か所が約 130 行の比較を自前で持つ。置き換えの前に、現在の挙動を表にして固定する。表の行は「置き換え後も変わらない」ことの宣言であり、`semver` と食い違う行は §5 の決定に従う (食い違いの正体は、すべて実測した)。

## 2. 対象と現在の挙動の要約

| 対象 | 場所 | 入力の由来 | 受け入れの規則 | 比較の規則 |
|---|---|---|---|---|
| A. `parseVersion` / `compareVersion` / `newestVersioned` | `src/runtime/adapter.ts` | Claude の native binary の置き場の名前。AppData の `Claude/claude-code/<version>` と、VS Code 拡張の `anthropic.claude-code-<version>` (例 `2.1.295-win32-x64`) | 受け入れない入力は無い。`-` か `+` より前を取り、`.` で分け、各部を `parseInt` し、`NaN` は 0 | 数値の部を先頭から比べ、足りない部は 0。部の数に上限は無い。接尾辞 (prerelease / build / platform) は比べない。同値なら先の候補を残す |
| B. `parseSemver` / `compareSemver` / `latestReleaseTag` | `src/setup/update-check.ts` | `git ls-remote` が返す release tag | trim して `^v?\d+\.\d+\.\d+$`。prerelease・build・欠けた部は null | 3 つの数値の比較。同値なら先の tag を残し、trim した tag を返す |
| C. `parsePackageSemver` / `comparePackageSemver` | `src/setup/update-check.ts` | `package.json` の version | 厳密な正規表現 (prefix・空白なし、先頭 0 なし、安全な整数、数字だけの prerelease は先頭 0 なし) | major・minor・patch、prerelease の有無 (有るほうが低い)、prerelease の識別子ごと。build は無視。返り値は差 (符号だけが使われる) |

利用箇所: A は `resolveClaudeCommand` (win32 の native binary 選び) だけ。B の `latestReleaseTag` と `parseSemver` は `checkForUpdate`、C は `checkForUpdate` と `src/setup/pack-publication-adapter.ts` (`parsePackageSemver` の真偽だけ)。

## 3. 置き換えの方式 (契約)

`semver` を**素通しで使わず、薄い adapter を介する**。理由は §5 の食い違いである。素通しにすると、観測できる挙動が変わる行がある。

1. **A (lenient)**: 入力から、`-` / `+` より前の核を取り、`.` で分け、各部を `parseInt` (`NaN` は 0)、先頭 3 部 (足りない部は 0) を `Number.MAX_SAFE_INTEGER` で頭打ちにして `major.minor.patch` の文字列を作り、`semver.compare` に渡す。4 部目以降は、3 部が同値のときだけ現在と同じ数値の順で比べる (§5 の D-A4。`semver` では表せない)。`semver.coerce` は使わない (§5 の D-A1〜A6 のとおり結果が違う)。`newestVersioned` の選び方 (存在するものだけ、先頭を基準に `> 0` のときだけ更新、空なら null) は変えない。
2. **B (release tag)**: 受け入れは現在の正規表現の関門を残す (`semver.valid` では prefix・prerelease・build・先頭 0 の扱いが違う。D-B1〜B5)。比較は、各数値を頭打ちにした `major.minor.patch` の文字列で `semver.compare` に渡す。`latestReleaseTag` の選び方 (厳密に大きいときだけ更新、trim した tag を返す、受け入れなければ読み飛ばす) は変えない。
3. **C (package)**: 受け入れは現在の厳密な規則を残す。`semver.valid` を関門にすると prefix・空白・改行を通してしまう (D-C1)。長さが 256 を超える入力は `semver` が受け付けないので、無効にする (D-C2、この 1 点だけ現在より狭くなる。理由は §5)。比較は、`PackageSemver` の各欄から `major.minor.patch[-prerelease]` を組み立てて `semver.compare` に渡し、**符号だけ**を返す (D-C3)。`PackageSemver` の型 (prerelease は文字列の配列) は変えない。`semver.parse` の返り値を公開しない (数字だけの prerelease が数値になり、型が変わる。D-C4)。

## 4. 現在の挙動の表 (入力から出力)

oracle は L7 の `CANDIDATE-U-SEMVER-001〜` に落とす (実装 PR の Red で正式 ID へ昇格する)。ここは入力と期待だけを列挙する。期待は**現在の実装の実測**であり、置き換え後も同じになる (D-C2 の 1 件を除く)。

### 4.1 A: lenient な版の比較 (`compareVersion` の符号)

| 入力 a | 入力 b | 期待 | 備考 |
|---|---|---|---|
| `1.10.0` | `1.9.0` | + | 辞書順でなく数値 |
| `1.10.0-win32-x64` | `1.9.0` | + | platform 接尾辞は無視 |
| `1.2.3-rc.1` | `1.2.3` | 0 | prerelease は順序に効かない (`semver.compare` は -1) |
| `1.2.3` | `1.2.3-win32-x64` | 0 | `semver.compare` は +1 |
| `1.2.3-rc.1-win32` | `1.2.3` | 0 | |
| `1.0.0+a` | `1.0.0+b` | 0 | build は無視 |
| `1.2` | `1.2.0` | 0 | 足りない部は 0 (`semver.compare` は例外) |
| `1` | `1.0.0` | 0 | 同上 |
| (空) | `0.0.0` | 0 | |
| `abc` | `0.0.0` | 0 | 数えられない入力は `[0]` |
| `abc` | `1.0.0` | − | 数えられない入力は最古に並ぶ (`semver.compare` は例外) |
| `win32-x64` | `0.0.0` | 0 | 核が空なので 0 (`semver.coerce` は `32.0.0`) |
| `-1.2.3` | `0.0.0` | 0 | 先頭の `-` で核が空 (`semver.coerce` は `1.2.3`) |
| `v1.2.3` | `1.2.3` | − | `v1` は数えられず 0 になり `0.2.3` (`semver.coerce` は 1.2.3 で 0) |
| `1.x.3` | `1.0.3` | 0 | `x` は 0 (`semver.coerce` は `1.0.0`) |
| `1.2abc.3` | `1.2.3` | 0 | `parseInt` は前方の数字を読む (`semver.coerce` は `1.2.0`) |
| `01.02.03` | `1.2.3` | 0 | 先頭 0 は読める (`semver.coerce` は null) |
| `.5` | `0.5.0` | 0 | |
| `1.2.` | `1.2.0` | 0 | |
| `1.2.3.4` | `1.2.3` | + | 4 部目も効く (`semver.coerce` は落とす) |
| `1.2.3.4` | `1.2.3.5` | − | 同上 |
| `99999999999999999999.0.0` | `1.0.0` | + | 桁あふれは大きい値のまま (`semver.coerce` は `0.0.0`、`semver.compare` は例外) |

### 4.2 A: `newestVersioned` (存在する候補だけを対象にする)

| 入力 (候補の version の並びと、存在するもの) | 期待 |
|---|---|
| 候補なし | `null` |
| 候補はあるが、どの path も存在しない | `null` |
| 1 件だけ存在 | その path |
| `1.9.0` と `1.10.0` が存在 | `1.10.0` の path |
| AppData の `1.0.0` と、VS Code の `1.0.0-win32-x64` (同値) | 先に渡したほう |
| 版が読めない (`abc`) と `0.0.0` が存在 | 先に渡したほう (同値) |
| 版が読めない (`abc`) と `1.0.0` が存在 | `1.0.0` |
| `1.10.0` は存在せず、`1.9.0` が存在 | `1.9.0` (存在しないものは比べない) |

### 4.3 B: release tag (`parseSemver` の受け入れと `latestReleaseTag`)

| 入力 | 期待 |
|---|---|
| `parseSemver("v0.1.4")` / `("0.1.4")` | `[0,1,4]` |
| `parseSemver("  v1.2.3\n")` | `[1,2,3]` (trim。`semver.valid` も通す) |
| `parseSemver("v0.2.0-rc.1")` / `("1.2.3+b")` / `("v1.0.0-beta")` | `null` (`semver.valid` は 3 件とも通す) |
| `parseSemver("v1.2")` / `("release-candidate")` / `("")` | `null` |
| `parseSemver("vv1.2.3")` / `("=1.2.3")` / `("V1.2.3")` / `("v 1.2.3")` | `null` |
| `parseSemver("v01.2.3")` | `[1,2,3]` (`semver.valid` は null) |
| `parseSemver("v99999999999999999999.0.0")` | 受け入れる (`semver.valid` は null) |
| `latestReleaseTag(["v0.1.9","v0.1.10","v0.1.2","nightly","v1.0.0-beta"])` | `"v0.1.10"` |
| `latestReleaseTag([])` / `(["nightly","poc"])` | `null` |
| `latestReleaseTag(["v1.0.0-beta","v0.9.0"])` | `"v0.9.0"` (prerelease は候補にならない) |
| `latestReleaseTag(["v1.2.3","1.2.3"])` / その逆順 | 先頭の tag (同値は先を残す) |
| `latestReleaseTag(["  v0.1.4  ","v0.1.3"])` | `"v0.1.4"` (trim した tag を返す) |
| `latestReleaseTag(["v01.2.3","v1.2.4"])` / `(["v1.2.3","v01.2.3"])` | `"v1.2.4"` / `"v1.2.3"` |
| `latestReleaseTag` の入力の順序 | 結果は順序に依らない (同値だけは先頭) |

### 4.4 C: package の version (`parsePackageSemver` と `comparePackageSemver`)

| 入力 | 期待 |
|---|---|
| `0.2.0-canary.1` と `0.2.0` | `canary` のほうが低い。`prerelease` は `["canary","1"]` (文字列) |
| `1.0.0+build.1` と `1.0.0+build.2` | 0 |
| `1.0.0-9007199254740993` と `1.0.0-9007199254740994` | 前者が低い (`semver.compare` も同じ) |
| `1.0.0-alpha` と `1.0.0-alpha.1` / `1.0.0-1` と `1.0.0-alpha` / `1.0.0-rc.2` と `1.0.0-rc.10` / `1.0.0-RC` と `1.0.0-rc` | 前者が低い (4 組とも `semver.compare` と同じ。順序は 20 万組のランダムな組で一致、§6) |
| 無効な入力 `v0.2.0-canary.1` / ` 0.2.0-canary.1` / `0.2.0-` / `0.2.0-01` / `9007199254740992.0.0` | `null` |
| 無効な入力 `1.0.0 ` / `1.0.0\n` / `=1.0.0` / `1.2` / `01.0.0` / `1.0.0-a..b` / `1.0.0+` / `1.0.0-1.01` | `null` (`semver.valid` は `1.0.0 ` と `1.0.0\n` を通す。D-C1) |
| 文字列でない入力 (`undefined`、数値) | `null` |
| 長さ 257 以上の version (`1.0.0-` + `a` を 251 個) | `null` (現在は受け入れる。D-C2) |
| 返り値の符号 | 負・0・正だけを約束する (値の大きさは約束しない。D-C3) |

## 5. `semver` と現在の挙動の食い違い (契約が決めること)

実測は `semver` 7.8.6 (`node_modules` の実物)。決定の既定は「現在の挙動を保つ」。例外は D-C2 の 1 件だけである。

| ID | 食い違い | `semver` の結果 | 決定 |
|---|---|---|---|
| D-A1 | prerelease と platform 接尾辞 | `semver.compare("1.2.3-rc.1","1.2.3")` は -1。現在は 0 (接尾辞を読まない) | 保つ。核だけで比べる。VS Code の `1.10.0-win32-x64` が prerelease 扱いになり、同じ 1.10.0 の素の版より低くなるのを避ける |
| D-A2 | 部が足りない入力 | `semver.compare("1.2","1.2.0")` は例外。`semver.valid` は null | 保つ。adapter が `major.minor.patch` を補う |
| D-A3 | 数えられない入力 | `semver.compare("abc","1.0.0")` は例外。`semver.coerce("abc")` は null | 保つ。0 として最古に並べる |
| D-A4 | 4 部目以降 | `semver.coerce("1.2.3.4")` は `1.2.3` (落とす)。`semver.compare` は例外 | 保つ。3 部が同値のときだけ、残りを数値で比べる (数行の補助。**`semver` だけで表せない唯一の点**。落とす案 (D-A4') は、実際の置き場の名前に 4 部の版が無いので害が見えないが、観測できる挙動は変わるので、置き換え PR のレビューで外すかを決める) |
| D-A5 | `parseInt` の寛容さ | `semver.coerce` は、`v1.2.3` を 1.2.3 (現在は 0.2.3)、`1.2abc.3` を 1.2.0 (現在は 1.2.3)、`01.02.03` を null、`win32-x64` を 32.0.0、`-1.2.3` を 1.2.3 と読む (現在はどれも別) | 保つ。`semver.coerce` は使わず `parseInt` を残す (§3 の 1) |
| D-A6 | 桁あふれ | `semver.coerce("99999999999999999999.0.0")` は `0.0.0`。`semver.compare` は例外 | 保つ。安全な整数で頭打ちにして、大きい値のまま並べる |
| D-B1 | prerelease の tag | `semver.valid("v1.0.0-beta")` は通す。現在は null | 保つ。正規表現の関門を残す (prerelease tag を更新の候補にしない。`U-RELVER-009` の趣旨) |
| D-B2 | build metadata | `semver.valid("1.2.3+b")` は通す。現在は null | 保つ (同上) |
| D-B3 | 先頭 0 | `semver.valid("v01.2.3")` は null。現在は `[1,2,3]` | 保つ。数値へ変えてから文字列にする |
| D-B4 | prefix と空白 | `semver.valid` は `  v1.2.3  ` を通す。`vv1.2.3` `=1.2.3` `V1.2.3` `v 1.2.3` は null | 保つ。関門は現在の正規表現。trim も現在のまま (どちらの入力も結果は現在と同じになるが、関門を `semver.valid` に任せると将来の版の挙動に引きずられる) |
| D-B5 | 桁あふれ | `semver.valid("v99999999999999999999.0.0")` は null | 保つ。関門を通し、頭打ちにして比べる |
| D-C1 | prefix と空白と改行 | `semver.valid("v1.0.0")`・`(" 1.0.0")`・`("1.0.0\n")` は通す。現在は null | 保つ。関門は現在の厳密な正規表現。`semver.valid` を関門にしない |
| D-C2 | 長さ | 256 文字を超えると null。現在は受け入れる | **狭める** (唯一の例外)。理由: 257 文字以上の version は npm の規則でも無効で、`package.json` の version や lockfile に入りうる値でなく、利用箇所は真偽の判定だけである。受け入れ続けるには比較を自前に戻すしかなく、置き換えの目的に反する。行を固定して、変えたことを残す |
| D-C3 | 返り値の大きさ | `semver.compare` は -1・0・1。現在は差 | 符号だけ約束する。利用箇所は `> 0` と `toBeLessThan(0)` だけで、符号で足りる |
| D-C4 | prerelease の型 | `semver.parse("0.2.0-canary.1").prerelease` は `["canary",1]` (数字は数値)。現在は `["canary","1"]` | 保つ。`PackageSemver` を自前の型のまま維持し、`semver.parse` の返り値を公開しない |

食い違わなかった点 (置き換え後も同じ): 数値の大小、`1.10.0` と `1.9.0`、同値の build metadata、prerelease の識別子の順 (数字は英字より低い、数字どうしは数値、識別子の数が多いほうが高い)、大きな数字だけの prerelease の順序 (`...993` < `...994`)、先頭 0 の prerelease の拒否 (`1.2.3-00`)、`>= 2^53` の major の拒否。

## 6. 検証した範囲と限界

- 実測は、scratch の node スクリプトで `semver` 7.8.6 と現在の実装 (写し) を並べて行った。リポジトリの中には何も作っていない。
- C の比較順序は、major・minor・patch (0/1/2/10 など)、prerelease の識別子 13 種 (`0`、`10`、`alpha`、`a-b`、`A`、桁あふれの数字、`1a` など)、build の有無を組み合わせた 20 万組のランダムな組で、現在の符号と `semver.compare` の符号が全て一致した。ランダムな組が覆うのは有効な入力だけで、無効な入力の違いは §5 の表で個別に確かめた。
- 「実際の置き場の名前に 4 部の版が無い」「257 文字の version が無い」は、実機の観察と `package.json` の値の性質からの推定であり、すべての利用者の環境で確かめたものではない。そのため D-A4 は保つ (広げる側) に倒し、D-C2 だけを、理由を添えて狭める。

## 7. 置き換えの PR の順序

1. 本書と L7 の契約 (本 PR)。
2. A の置き換え (adapter.ts) と、4.1・4.2 の表の Red → Green。
3. B の置き換え (update-check.ts の B) と、4.3 の表の Red → Green。
4. C の置き換え (update-check.ts の C) と、4.4 の表の Red → Green。

各 PR の Red は、契約の stub か `it.fails` で先に入れ、`CANDIDATE-U-SEMVER-*` を正式 ID へ昇格する。Refactor の commit は `tests/` の内容差分 0 とする。

## 8. 不変条件 (DbC)

- 比較は純粋関数で、I/O を持たない。`newestVersioned` の `existsSync` だけが I/O であり、置き換えでも変えない。
- adapter の出力は、同じ入力に対して現在の実装と同じ符号 (A、B)、同じ受け入れ (B、C) を返す。ただし D-C2 を除く。
- 例外を投げない。`semver.compare` に渡す文字列は adapter が必ず有効な `major.minor.patch[-prerelease]` に組む (無効な入力は事前に null か 0 に落とす)。
- 新しい依存を足さない (`semver` は既存)。

## 9. 範囲外

- `src/lint/toolchain-pin.ts` と `src/setup/distribution.ts` の既存の `semver` の利用。
- release の版の運用方針 (canary の出し方など)。
- 実装 (本 PR は `src/` と `tests/` を変えない)。
