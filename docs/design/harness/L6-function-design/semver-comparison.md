---
layer: L6
artifact_type: design_doc
status: confirmed
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

`semver` を**素通しで使わず、薄い adapter を介する**。理由は §5 の食い違いである。素通しにすると、観測できる挙動が変わる行がある。**契約の原則は、現在受け入れる入力と現在の比較結果を、1 件も変えないこと**である (Refactor の behaviour-invariant)。`semver` が扱えない入力 (範囲外の数、長すぎる文字列) には、現在と同じ比較を補助として残す。

1. **A (lenient)**: 入力から、`-` / `+` より前の核を取り、`.` で分け、各部を `parseInt` (`NaN` は 0) する。先頭 3 部 (足りない部は 0) がすべて `Number.isSafeInteger` を満たすなら、`major.minor.patch` の文字列を作って `semver.compare` に渡し、0 のときだけ 4 部目以降を現在と同じ数値の順 (`<` / `>`) で比べる (D-A4)。先頭 3 部のどれかが安全な整数の範囲外のときは `semver` を使わず、全ての部を現在と同じ数値 (`Number`) の `<` / `>` で先頭から比べる (D-A6。頭打ちにはしない。頭打ちは順序を壊す)。どちらの経路でも、同じ `Infinity` (310 桁以上の部) に当たったら、そこで比較を打ち切り 0 とする (D-A7。現在は `NaN` を返して打ち切り、呼び出し側は `> 0` しか見ないので 0 と同じ)。`semver.coerce` は使わない (D-A1〜A5)。`newestVersioned` の選び方 (存在するものだけ、先頭を基準に `> 0` のときだけ更新、空なら null) は変えない。
2. **B (release tag)**: 受け入れは現在の正規表現の関門を残す (`semver.valid` では prefix・prerelease・build・先頭 0 の扱いが違う。D-B1〜B4)。3 つの数がすべて安全な整数なら `major.minor.patch` の文字列で `semver.compare` に渡す。どれかが範囲外なら `semver` を使わず、現在と同じ数値の比較 (最初に `!==` になる部の差) を使う (D-B5。頭打ちにしない)。`latestReleaseTag` の選び方 (厳密に大きいときだけ更新、trim した tag を返す、受け入れなければ読み飛ばす) は変えない。
3. **C (package)**: 受け入れは現在の厳密な規則を**そのまま**残す (正規表現、先頭 0 の拒否、安全な整数。長さの上限は設けない。D-C2)。`semver.valid` を関門にしない (D-C1)。比較は、次のいずれにも当たらないときだけ、`PackageSemver` の各欄から `major.minor.patch[-prerelease]` を組み立てて `semver.compare` に渡し、**符号だけ**を返す (D-C3)。(a) 組み立てた文字列の長さが 256 を超える (`semver.compare` が例外を投げる。D-C2)。(b) prerelease に 16 桁以上の数字だけの識別子がある (`semver` は数値に丸めて順序を壊す。D-C5)。(a) か (b) に当たる入力は、現在の `comparePackageSemver` と同じ比較 (識別子ごとに、数字どうしは桁数、次に辞書順) を補助として使う。`PackageSemver` の型 (prerelease は文字列の配列) は変えない。`semver.parse` の返り値を公開しない (D-C4)。

### 3.1 関数のシグネチャと DbC

| 関数 | signature | 前提 | 事後 | invariant | oracle |
|---|---|---|---|---|---|
| `compareLenientVersion` (A の adapter) | compareLenientVersion(a: string, b: string) => number | 任意の文字列を受ける (受け入れない入力は無い) | 符号が現在の `compareVersion` と一致する (`NaN` は 0 とみなす) | 例外を投げない。範囲外の数も現在と同じ順に並ぶ | `CANDIDATE-U-SEMVER-001〜010`、`029`、`030` |
| `newestVersioned` | newestVersioned(candidates: VersionedCandidate[]) => string \| null | 候補は path と version を持つ | 存在する候補だけから最新の path、無ければ null | 同値は先の候補を残す (変えない) | `CANDIDATE-U-SEMVER-011〜014` |
| `latestReleaseTag` | latestReleaseTag(tags: string[]) => string \| null | 任意の文字列の配列 | 受け入れた tag の最大 (trim 済) か null | prerelease・build は候補にならない。範囲外の数も現在と同じ順 | `CANDIDATE-U-SEMVER-015〜021`、`031` |
| `comparePackageSemver` | comparePackageSemver(a: PackageSemver, b: PackageSemver) => number | 2 つとも `parsePackageSemver` が返した値 | 符号だけが現在と一致する | 例外を投げない。長さ 257 以上の入力も受け入れ、現在と同じ順に並べる | `CANDIDATE-U-SEMVER-022〜028`、`032`、`033` |

DbC: pre は上表の前提、post は事後、invariant は不変条件の欄とする。置き換え後の oracle は同表の ID で固定する。

## 4. 現在の挙動の表 (入力から出力)

oracle は L7 の `CANDIDATE-U-SEMVER-001〜` に落とす (実装 PR の Red で正式 ID へ昇格する)。ここは入力と期待だけを列挙する。期待は**現在の実装の実測**であり、置き換え後も全件で同じになる (例外は無い)。

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
| `9007199254740992.0.0` | `9007199254740994.0.0` | − (差 -2) | 範囲外の数どうしも順序を保つ。**頭打ちにすると 0 になり、順序が壊れる** (反例) |
| `9007199254740992.0.0` | `9007199254740993.0.0` | 0 | `parseInt` が `Number` に丸めるので両方 `9007199254740992`。桁の文字列で比べると − になり、現在と変わる |
| `1` + 0 を 400 個 (310 桁以上 = `Infinity`) の `.9` | 同じ `Infinity` の `.0` | 0 | `Infinity` どうしで打ち切る (現在は `NaN` で打ち切り、後ろの部は見ない。D-A7) |

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
| `latestReleaseTag(["v9007199254740992.0.0","v9007199254740994.0.0"])` | `"v9007199254740994.0.0"` (**頭打ちにすると同値になり、先頭の tag が残る**。反例) |
| `latestReleaseTag(["v9007199254740992.0.0","v9007199254740993.0.0"])` | `"v9007199254740992.0.0"` (`Number` が同値に丸めるので先頭を残す) |
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
| `1.0.0-alpha` と `1.0.0-alpha.1` / `1.0.0-1` と `1.0.0-alpha` / `1.0.0-rc.2` と `1.0.0-rc.10` / `1.0.0-RC` と `1.0.0-rc` | 前者が低い (4 組とも `semver.compare` と同じ) |
| `1.0.0-9007199254740992` と `1.0.0-9007199254740993` | 前者が低い (現在は桁数の次に辞書順で -1。**`semver.compare` は 0**。反例。D-C5) |
| `1.0.0-99999999999999999998` と `1.0.0-99999999999999999999` | 前者が低い (`semver.compare` は 0。反例。D-C5) |
| 無効な入力 `v0.2.0-canary.1` / ` 0.2.0-canary.1` / `0.2.0-` / `0.2.0-01` / `9007199254740992.0.0` | `null` |
| 無効な入力 `1.0.0 ` / `1.0.0\n` / `=1.0.0` / `1.2` / `01.0.0` / `1.0.0-a..b` / `1.0.0+` / `1.0.0-1.01` | `null` (`semver.valid` は `1.0.0 ` と `1.0.0\n` を通す。D-C1) |
| 文字列でない入力 (`undefined`、数値) | `null` |
| 長さ 257 以上の version (`1.0.0-` + `a` を 251 個) | **受け入れる** (現在と同じ)。`1.0.0-` + `a` を 251 個と `1.0.0-` + `b` を 251 個は、前者が低い (`semver.compare` は例外を投げるので、補助の比較で並べる。D-C2) |
| 返り値の符号 | 負・0・正だけを約束する (値の大きさは約束しない。D-C3) |

## 5. `semver` と現在の挙動の食い違い (契約が決めること)

実測は `semver` 7.8.6 (`node_modules` の実物)。決定は全件「現在の挙動を保つ」である (D-C3 の返り値の大きさは、利用箇所が符号しか見ないので符号だけを約束する)。挙動を変える決定は無い。

| ID | 食い違い | `semver` の結果 | 決定 |
|---|---|---|---|
| D-A1 | prerelease と platform 接尾辞 | `semver.compare("1.2.3-rc.1","1.2.3")` は -1。現在は 0 (接尾辞を読まない) | 保つ。核だけで比べる。VS Code の `1.10.0-win32-x64` が prerelease 扱いになり、同じ 1.10.0 の素の版より低くなるのを避ける |
| D-A2 | 部が足りない入力 | `semver.compare("1.2","1.2.0")` は例外。`semver.valid` は null | 保つ。adapter が `major.minor.patch` を補う |
| D-A3 | 数えられない入力 | `semver.compare("abc","1.0.0")` は例外。`semver.coerce("abc")` は null | 保つ。0 として最古に並べる |
| D-A4 | 4 部目以降 | `semver.coerce("1.2.3.4")` は `1.2.3` (落とす)。`semver.compare` は例外 | 保つ。3 部が同値のときだけ、残りを数値で比べる (数行の補助。**`semver` だけで表せない唯一の点**。落とす案 (D-A4') は、実際の置き場の名前に 4 部の版が無いので害が見えないが、観測できる挙動は変わるので、置き換え PR のレビューで外すかを決める) |
| D-A5 | `parseInt` の寛容さ | `semver.coerce` は、`v1.2.3` を 1.2.3 (現在は 0.2.3)、`1.2abc.3` を 1.2.0 (現在は 1.2.3)、`01.02.03` を null、`win32-x64` を 32.0.0、`-1.2.3` を 1.2.3 と読む (現在はどれも別) | 保つ。`semver.coerce` は使わず `parseInt` を残す (§3 の 1) |
| D-A6 | 桁あふれ (範囲外の数) | `semver.coerce("99999999999999999999.0.0")` は `0.0.0`。`semver.compare` は `9007199254740992.0.0` を例外にする。**頭打ち (`MAX_SAFE_INTEGER`) は順序を壊す**: `9007199254740992.0.0` と `9007199254740994.0.0` は現在 -2 だが、頭打ちでは両方 `9007199254740991.0.0` になり 0 になる | 保つ。範囲外の部が 1 つでもあれば、`semver` を使わず現在と同じ `Number` の比較を使う (§3 の 1)。桁の文字列の比較や BigInt は採らない: 現在の順序は `Number` の丸め後の値で決まり (`...992` と `...993` は同値)、桁の文字列は別の順序になる |
| D-A7 | `Infinity` の打ち切り | 310 桁以上の部は `parseInt` が `Infinity` になる。現在は `Infinity - Infinity` が `NaN` で、`!== 0` なので比較をそこで打ち切って `NaN` を返す (呼び出し側の `> 0` では 0 と同じ) | 保つ。同じ `Infinity` に当たったら 0 で打ち切る (後ろの部は見ない) |
| D-B1 | prerelease の tag | `semver.valid("v1.0.0-beta")` は通す。現在は null | 保つ。正規表現の関門を残す (prerelease tag を更新の候補にしない。`U-RELVER-009` の趣旨) |
| D-B2 | build metadata | `semver.valid("1.2.3+b")` は通す。現在は null | 保つ (同上) |
| D-B3 | 先頭 0 | `semver.valid("v01.2.3")` は null。現在は `[1,2,3]` | 保つ。数値へ変えてから文字列にする |
| D-B4 | prefix と空白 | `semver.valid` は `  v1.2.3  ` を通す。`vv1.2.3` `=1.2.3` `V1.2.3` `v 1.2.3` は null | 保つ。関門は現在の正規表現。trim も現在のまま (どちらの入力も結果は現在と同じになるが、関門を `semver.valid` に任せると将来の版の挙動に引きずられる) |
| D-B5 | 桁あふれ (範囲外の数) | `semver.valid("v99999999999999999999.0.0")` は null。頭打ちは順序を壊す (`latestReleaseTag` が `v9007199254740992.0.0` と `v9007199254740994.0.0` で、現在は後者、頭打ちでは先頭を残す) | 保つ。関門を通し、範囲外の数があれば現在と同じ `Number` の比較を使う (頭打ちにしない) |
| D-C1 | prefix と空白と改行 | `semver.valid("v1.0.0")`・`(" 1.0.0")`・`("1.0.0\n")` は通す。現在は null | 保つ。関門は現在の厳密な正規表現。`semver.valid` を関門にしない |
| D-C2 | 長さ | `semver` は 256 文字を超える version を無効にし、`semver.compare` は例外を投げる。現在は受け入れ、比較できる | **保つ** (長さ 257 以上も受け入れ、現在と同じ順に比べる)。`checkForUpdate` の `localVersion` と `checked`、`pack-publication-adapter` の manifest の受け入れが、この結果に依存するため、受け入れの範囲を変えない。長さで拒否するのは、別の将来の挙動変更として扱い、本契約の範囲外とする。補助の比較で並べる (§3 の 3) |
| D-C3 | 返り値の大きさ | `semver.compare` は -1・0・1。現在は差 | 符号だけ約束する。利用箇所は `> 0` と `toBeLessThan(0)` だけで、符号で足りる |
| D-C5 | 数字だけの prerelease の識別子が長い | `semver` は数字の識別子を `Number` に丸める。`1.0.0-9007199254740992` と `1.0.0-9007199254740993` は現在 -1、`semver.compare` は 0。`1.0.0-99999999999999999998` と `...99` も現在 -1、`semver` は 0 | 保つ。16 桁以上の数字だけの識別子があれば、現在の比較 (桁数、次に辞書順) を補助として使う (§3 の 3) |
| D-C4 | prerelease の型 | `semver.parse("0.2.0-canary.1").prerelease` は `["canary",1]` (数字は数値)。現在は `["canary","1"]` | 保つ。`PackageSemver` を自前の型のまま維持し、`semver.parse` の返り値を公開しない |

食い違わなかった点 (置き換え後も同じ): 数値の大小、`1.10.0` と `1.9.0`、同値の build metadata、prerelease の識別子の順 (数字は英字より低い、識別子の数が多いほうが高い。数字どうしは 15 桁以下に限る)、先頭 0 の prerelease の拒否 (`1.2.3-00`)、`>= 2^53` の major の拒否。

## 6. 検証した範囲と限界

- 実測は、scratch の node スクリプトで `semver` 7.8.6 と現在の実装 (写し) を並べて行った。リポジトリの中には何も作っていない。
- 提案した adapter (§3) と現在の実装の符号を突き合わせた。A は 300,000 組 (部の値に範囲外の数・310 桁以上の `Infinity`・4 部以上・接尾辞・空の部を混ぜる)、B は 300,000 組 (範囲外の数・`Infinity` を混ぜる)、C は 300,000 組 (16 桁以上の数字の識別子を混ぜる) で、不一致は 0 件だった。補助の比較を外して素の `semver.compare` だけで C を比べると、同じ識別子の集合で 1,000 件以上が不一致になる (補助が必要な根拠)。この一致は、**混ぜた種類の入力についての確認**であり、あらゆる有効な入力が互換であることの証明ではない。互換性の根拠は、食い違いを 1 件ずつ列挙した §5 の表と、`CANDIDATE-U-SEMVER-*` の固定した入力である。
- 「実際の置き場の名前に 4 部の版が無い」は推定であり、確かめていない。そのため D-A4 は、4 部目も現在と同じに比べる (保つ側) に倒した。

## 7. 置き換えの PR の順序

1. 本書と L7 の契約 (本 PR)。
2. A の置き換え (adapter.ts) と、4.1・4.2 の表の Red → Green。
3. B の置き換え (update-check.ts の B) と、4.3 の表の Red → Green。
4. C の置き換え (update-check.ts の C) と、4.4 の表の Red → Green。

各 PR の Red は、契約の stub か `it.fails` で先に入れ、`CANDIDATE-U-SEMVER-*` を正式 ID へ昇格する。Refactor の commit は `tests/` の内容差分 0 とする。

## 8. 不変条件 (DbC)

- 比較は純粋関数で、I/O を持たない。`newestVersioned` の `existsSync` だけが I/O であり、置き換えでも変えない。
- adapter の出力は、同じ入力に対して現在の実装と同じ符号 (A、B、C)、同じ受け入れ (B、C) を返す。例外は無い (長さ 257 以上の C の入力も受け入れる)。
- 例外を投げない。`semver.compare` に渡す文字列は、adapter が安全な整数だけで組み、長さが 256 以下のときに限る。範囲外の数、長すぎる文字列、16 桁以上の数字の識別子は `semver` に渡さない。
- 新しい依存を足さない (`semver` は既存)。

## 9. 範囲外

- `src/lint/toolchain-pin.ts` と `src/setup/distribution.ts` の既存の `semver` の利用。
- release の版の運用方針 (canary の出し方など)。
- 実装 (本 PR は `src/` と `tests/` を変えない)。
