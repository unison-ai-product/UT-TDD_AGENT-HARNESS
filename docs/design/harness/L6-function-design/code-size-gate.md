---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_code_size_gate
pair_artifact: docs/test-design/harness/L7-code-size-gate-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1310
---

> **L6 contract marker**: `analyzeCodeSize(input: CodeSizeInput) => CodeSizeResult` は unit-test-granularity contract である (未実装の目標契約。実装は本書の凍結後)。DbC pre/post/invariant は §11 にまとめる。oracle の詳細 (CANDIDATE-U-CODESIZE-001〜) は専用の `docs/test-design/harness/L7-code-size-gate-test-design.md` が固定する。閾値 (§4.2) は **PO 確定値 (2026-10-26)** である。値を変えるときは本書と L7 を同時に改訂する。

# コードとテストの量の検査 (code-size gate) — 関数設計 (issue #1310)

## 1. 目的

設計文書には量の上限の契約がある (`docs/design/harness/L6-function-design/doc-split-gate.md`、PO 確定 2026-10-14)。コードとテストには、関数単位の目安 (`docs/governance/coding-rules.md` の `max-function-lines` 80 / `max-nesting-depth` 3 / `max-cyclomatic-complexity` 12、どれも「概ね」) しかなく、ファイル単位の上限は無い。`src/lint/coding-rules.ts` はこれらを検査していない。その結果、`src/cli.ts` は 4549 行 (空行を除く) まで育っている (§4.1)。

本設計は、doc-split gate と同じ型 (種別ごとの上限・縮小しか許さない baseline・分割先の指示) で、src と tests のファイルの量と、src の関数の量を測り、新しい超過を fail-close する検査 (code-size gate) を定める。既存の超過は baseline に記録し、縮小しか許さない。

## 2. 対象と種別

- **走査対象**: `src/` と `tests/` 配下 (再帰) の、拡張子が `.ts` / `.tsx` / `.mts` / `.cts` のファイル。`.d.ts`、`node_modules/`、`dist/`、`tests/fixtures/` 配下は除く (fixture は検査対象の入力であり、形は検査対象が決める)。`scripts/` は薄い入口だけを置く規約なので対象外。
- **種別 (class)** は path だけで決める。`src` (`src/` 配下) と `tests` (`tests/` 配下、`tests/support/` を含む)。対象外は `null`。path は `/` 区切りに正規化する。
- **path の変更で種別を変えさせない**: doc-split gate §2 と同じ規則を適用する。種別が変わる rename・移動 (`src/` から `tests/` へ、`src/` から `scripts/` へ、`tests/x.test.ts` を `tests/fixtures/` へ、など) は `code-size-class-changed` で fail-close する。同じ種別の中の rename・移動は許し、baseline の行を旧 path から新 path へ引き継ぐ (§5)。rename の検出は `git diff -M --name-status` による。

## 3. 測る量

内容は CRLF を LF に直してから数える。

- **ファイルの行数 (`lines`)**: 空白文字以外を 1 文字以上含む行の数 (空行を数えない、コメント行は数える)。`grep -c '[^[:space:]]' <file>` と同じ値になる。既存の `src/state-db/refactor-candidate-policy.ts` の `splitModuleLines` (現行 700、§10 で 400 に下げる) と同じ単位 (nonblank) に揃える。doc-split gate の物理行 (`wc -l`) は文書の単位であり、コードには合わせない。
- **関数の行数** (`src` だけ): TypeScript の構文木 (`typescript` の `createSourceFile`) で、関数宣言・関数式・arrow function・method・constructor・getter・setter の本体を対象とする。本体がブロックなら開き括弧と閉じ括弧の間、式なら式の範囲で、**トークンを 1 個以上含む行の数**を数える (空行とコメントだけの行を数えない)。入れ子の関数の行も外側の関数に含める (`refactor-candidate-policy.ts` の `extractHelperLines` と同じ数え方)。入れ子の callback を名前付きの関数へ出せば外側の値は減る。
- **関数超過量 (`functionExcess`)** (`src` だけ): ファイル内の全関数について `max(0, 関数の行数 - 関数の行数の上限)` を足した値。超えている関数の個数は表示だけに使い、判定には使わない (200 行の関数を 90 行 2 本に分ける正当な分割で個数が増えるため)。
- `tests` の関数は測らない (`describe` / `it` の callback を関数の上限に掛ける意味が無い)。`tests` の `functionExcess` は `null`。
- **循環的複雑度と制御のネスト**は測らない (§4.2 の PO 確定 = 案 1。gate にするときは、本節に測り方を足す改訂を行う)。
- 各 `CodeMeasure` は、分割先の指示 (§7) のために、トップレベルの文の名前と行数を出現順に持つ。名前は宣言の名前 (`function` / `class` / `const` / `interface` / `type` / `enum`)、`export default` は `default`、トップレベルの `describe(` 呼び出しは第 1 引数の文字列 (`describe: <題>`)、それ以外は `<statement@行番号>` とする。

## 4. 閾値 (PO 確定 2026-10-26)

閾値は 2026-10-26 の `origin/main` (`909b26c7792c1c22adeaea58030917fe3b265285`) の実測をもとに、PO が 2026-10-26 に確定した。値を変えるときは、本書 §4.2 と L7 の閾値に依存する oracle を同時に改訂する。

### 4.1 実測の分布

ファイルの行数は次のコマンドで測った (Git Bash、worktree の root で実行)。

```bash
git ls-files src tests | grep -E '\.(ts|tsx|mts|cts)$' | grep -v '\.d\.ts$' \
  | while read f; do echo "$(grep -c '[^[:space:]]' "$f") $f"; done | sort -n
git ls-files src tests | grep -E '\.(ts|tsx|mts|cts)$' | grep -v '\.d\.ts$' | xargs wc -l   # 物理行 (参考)
```

| class | 本数 | 中央値 | p90 | p95 | p99 | 最大 |
|---|---|---|---|---|---|---|
| `src` (空行を除く) | 440 | 173 | 564 | 710 | 1546 | 4549 (`src/cli.ts`) |
| `tests` (空行を除く) | 343 | 231 | 825 | 1055 | 2167 | 2958 (`tests/release-consumer-gates.test.ts`) |

| 上限 (空行を除く) | 500 | 600 | 700 | 800 | 900 | 1000 | 1200 | 1500 |
|---|---|---|---|---|---|---|---|---|
| `src` で超える本数 | 59 | 39 | 25 | 16 | 14 | 14 | 10 | 6 |
| `tests` で超える本数 | 82 | 67 | 46 | 39 | 29 | 21 | 18 | 12 |

物理行で数えると issue の記載と同じ値になる (src 440 本のうち 1000 行超 14 本・2000 行超 4 本、tests 343 本 (`tests/fixtures/` を除く) のうち 1000 行超 24 本・2000 行超 6 本)。`src` の物理行は 890 行 (`src/plan-admission/node-atomic-draft-publisher.ts`) の次が 1220 行で切れ目があるが、1 本育てば消える切れ目なので閾値の根拠にしない。`tests` の分布は連続している。

関数の行数は、§3 の測り方を実装した使い捨ての script (repo に置いていない。Green の実装が再現可能な測り方の正本になる) で `src` の関数 7181 個を測った。中央値 3、p90 28、p95 46、p99 112、最大 480 (`src/cli/distribution.ts` の `registerDistributionCommands`)。

| 関数の行数の上限 | 80 | 100 | 120 | 150 |
|---|---|---|---|---|
| 超える関数 / ファイル | 148 / 96 | 91 / 67 | 61 / 49 | 34 / 29 |
| 超過量の合計 | 7743 | 5420 | 3905 | 2582 |

参考 (gate にしない量): ESLint の `complexity` / `max-depth` 相当の数え方では、循環的複雑度 12 超の関数が 410 個 (15 超 273 個)、ネスト 3 超が 71 個 (4 超 21 個) あり、`coding-rules.md` の 3 つの目安 (80 / 12 / 3) のいずれかを超える関数は 460 個・205 ファイル (src の約 47%) である。

### 4.2 確定値と選択肢

| 量 | PO 確定値 (2026-10-26) | baseline の見積もり | 決め方 |
|---|---|---|---|
| `src` のファイルの行数 | 500 | 59 本 | PO 確定 (「500 以下にしてほしい」)。中央値 173 の約 3 倍で、p75 (330) より外側を止める。分割候補 400 (§10) を先に出し、500 で止める |
| `tests` のファイルの行数 | 500 | 82 本 | PO 確定。`src` と同じ値に揃える |
| `src` の関数の行数 | 120 | 61 関数 / 49 ファイル | PO 確定 (案 1)。`extractHelperLines` (120) と同じ値にし、候補と上限を一致させる |
| 循環的複雑度・制御のネスト | gate にしない | ― | 目安のまま。80 / 12 / 3 を gate にすると src の約半分が baseline に入り、gate ではなく凍結になる |

ファイルの行数で比べた選択肢は、案 A `src` 1000 / `tests` 1200 (baseline 14 + 18 本)、案 B `src` 800 / `tests` 1000 (最初の推奨、16 + 21 本)、案 C `src` 600 / `tests` 800 (39 + 39 本)、**確定 `src` 500 / `tests` 500 (59 + 82 本 = 141 本)** である。PO は案 B を選んだ直後に「500 以下」を求め、500 / 500 に確定した (2026-10-26)。baseline の行は、この 141 本に、行数が上限の内側で関数だけが超えるファイルを足したものになる (本数は Green の base commit で決まる、§5)。baseline に入るファイルの直近 30 日 (2026-09-26〜10-26、`main` への merge 360 本) の変更頻度は、案 A 32 本中 22 本が変更され 59 本の merge が触れた、案 B 37 本中 24 本・62 本、案 C 78 本中 49 本・102 本である (`git log --since=2026-09-26 --first-parent --merges` の各 merge の第 1 親との差分で数えた)。確定の 500 / 500 は測っていないが、baseline に入るファイルは案 C の集合を含むので、触れる merge は 102 本以上になる。baseline のファイルは縮小しか許されないので、触れる merge の数が、分割を先に求められうる作業の数の上限の目安になる (行を足さない変更は止まらない)。選択肢 (関数): 案 1 行数 120 だけを gate (PO 確定)、案 2 `coding-rules.md` の 80 / 12 / 3 を全て gate、案 3 関数は gate にしない。閾値は `src/lint/code-size.ts` の定数 `CODE_SIZE_LIMITS` に置く。値の変更は設計の改訂であり、baseline への追記では通さない (§5)。

## 5. baseline

- 既存の超過は **`docs/governance/code-size-baseline.json`** に、path ごとに `{ "lines": n | null, "functionExcess": m | null }` として 1 ファイル 1 行、path の昇順で記録する (doc-split gate §5 と同じ置き場・同じ形に揃える。複数の分割 PR が別々の行を縮めても行単位で衝突なく merge できる)。
- **記録形**: 実測から作る値は、`lines` は上限を超えていれば実測値、超えていなければ `null`。`functionExcess` は `src` で 0 より大きければ実測値、0 または `tests` なら `null`。両方が `null` のファイルは行を持たない。`null` の値は「class の上限 (関数超過量は 0) が掛かる」ことを意味する。行数が上限の内側で関数だけが超えているファイルは `{ "lines": null, "functionExcess": m }` になり、ファイルの行数は上限まで育ってよい。
- **初期値**: doc-split gate §5 と同じく、本文に数値を固定しない。実装 PR (Green) の base commit で §3 の測り方により実測し、記録形が行を持つファイルだけを同じ Green PR で入れる。初回記録 (`previousBaseline = null`) の merge-base 実測との照合 (doc-split gate §5 の「初回記録の照合」) も同じ規則で行う。読み替えは、文書を対象ファイルに、`responsibilities` を `functionExcess` に、finding の prefix `doc-split-` を `code-size-` にする。「merge-base の実測が上限を超えていない」は「merge-base の記録形が行を持たない」と読み (→ `initial-baseline-new-entry`)、記録値と merge-base の記録形の比較では `null` を class の上限 (関数超過量は 0) とみなす (記録値が大きければ → `initial-baseline-grown`)。
- **縮小のみの比較元**: doc-split gate §5 と同じく、`git merge-base HEAD origin/main` の commit にある baseline を比較元 (`previousBaseline`) とする。ファイルが無ければ初回とみなして比較を省き、merge-base を解決できない・読めない・解釈できないときは `code-size-baseline-base-unreadable` で fail-close する。git の起動には `windowsHide: true` を付ける (issue #693)。
  - `lines`: path ごとに縮小のみ。比較元より大きい値、比較元に無い path への非 `null` の値は `code-size-baseline-grown`。
  - `functionExcess`: **合計で縮小のみ**。全行の合計が比較元の合計より大きければ `code-size-baseline-grown`。合計が増えない限り、path ごとの値が増えること・比較元に無い path に値を足すことは許す (**移動**)。肥大したファイルを分ける PR が、120 行を超える関数を新しい module へそのまま移すと、新しい path に関数超過量が現れる。移動を拒むと、gate が分割そのものを止めるためである。代償として、同じ PR の中で別の関数を同じだけ縮めれば新しい超過を足せる。これは負債の総量を増やさない交換として許容する。
- **rename の引き継ぎ**: doc-split gate §5 と同じ。同じ種別の rename (`from` → `to`) で、`to` の行を `from` の値以下で置き、同じ変更で `from` の行を消す。

## 6. 判定規則と finding

ファイルごとに `measureCodeFile` で測り、記録形 (§5) と baseline の行を比べる。finding は `path` と `kind` と `reason` を持つ。

1. **`code-size-required`** (fail-close)。
   - `exceeds-baseline`: baseline に行があり、`lines` か `functionExcess` が行の値 (`null` なら class の上限、関数超過量は 0) より大きい。
   - `new-file-over-limit`: baseline に行が無く、`lines` が上限を超えるか `functionExcess` が 0 より大きい。
2. **`code-size-stale-baseline`** (fail-close)。`required` に当たらず、baseline の行が記録形と一致しない。`shrunk` (値が縮んだ。同じ PR で行を減らす)、`within-limit` (記録形が行を持たない。行を消す)、`missing-file` (path が走査対象に無い。行を消す)。
3. **`code-size-class-changed`** (fail-close)。doc-split gate §6 の 3 と同じ。
4. **`code-size-baseline-grown`**、**`code-size-initial-baseline-new-entry`**、**`code-size-initial-baseline-grown`**、**`code-size-baseline-base-unreadable`** (fail-close)。§5。
5. **`code-size-input-unreadable`** (fail-close)。走査対象が 1 本も無い、または adapter が対象を読めなかった。入力が読めないことを違反なしと取り違えない。

`ok` は上の finding が 0 件のときだけ true。finding は `path`、`kind`、`reason` の順で一意に並べる。出力は finding ごとのメッセージ (§7) と、末尾に `checked=<走査したファイル数> over=<required の件数> stale=<stale-baseline の件数> baseline=<baseline の行数>` を出す。

## 7. 分割先の指示

`code-size-required` のメッセージは、何をどこへ分けるかを指示する。

```
<path>:code-size-required:<reason> lines=<n>/<上限> functionExcess=<m>/<上限>
  ファイル: 宣言 <名前1> (<k1> 行), <名前2> (<k2> 行) を src/<module>/<topic>.ts へ移し、
            対のテストを tests/<topic>.test.ts へ分ける
  関数: <名前> (<行番号> 行目、<n>/120 行) を helper へ分ける
```

- **ファイルの行数**が超えたとき: トップレベルの文 (§3) を出現順の**後ろから**選び、選んだ文の行数の合計が超過行数 (`lines` - 上限、baseline に行があれば `lines` - 行の値) 以上になるまで足す (最低 1 個)。後ろから選ぶのは doc-split gate §6 と同じく、追記が末尾に集まる実態に合わせるためである。`src` の行は `src/<module>/<topic>.ts` と `tests/<topic>.test.ts` の対を、`tests` の行は `tests/<topic>.test.ts` だけを指示する。`<module>` は元のファイルの `src/` 直下のディレクトリ、`<topic>` は選んだ文の名前の kebab-case で、例にすぎない。
- **関数超過量**が超えたとき: 上限を超える関数を行数の降順に全て挙げ、名前と行番号と行数を出す。名前の無い関数は `<anon@行番号>` とする。分け方 (helper 抽出・policy table への外部化) は担当が決める。
- 1 PR = 1 論点 (`CLAUDE.md` §PR スコープ規律 3) を保つため、分割先の新しい module は 1 PR に 1 個までとし、必要なら分割を複数の PR に分ける。

## 8. 関数のシグネチャ (純粋関数と I/O の adapter)

純粋関数は `src/lint/code-size.ts`、I/O は `src/lint/code-size-inputs.ts` に分ける。純粋関数はファイルも git も読まない (構文木は渡された文字列から作る)。merge-base の解決・`git show`・rename の検出は doc-split gate の adapter (#1307〜#1309) と同じ処理であり、共有するかは実装 PR が決める (本書は振る舞いだけを決める)。

| Function | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `classifyCodeFile` | `classifyCodeFile(path: string) => CodeClass \| null` | path は repo 相対 | `"src"` / `"tests"` / `null` (§2) | path だけで決まる | `CANDIDATE-U-CODESIZE-002` |
| `measureCodeFile` | `measureCodeFile(source: CodeSizeSource) => CodeMeasure` | `source.path` が対象 | `{ path, codeClass, lines, functionExcess, overFunctions, topLevel }` | 同じ文字列から同じ値 | `CANDIDATE-U-CODESIZE-001`, `CANDIDATE-U-CODESIZE-003` |
| `analyzeCodeSize` | `analyzeCodeSize(input: CodeSizeInput) => CodeSizeResult` | 入力は §11 の Pre | `{ ok, findings, summary }` (§6) | 純粋。入力順に依存しない | `CANDIDATE-U-CODESIZE-004`〜`013` |
| `parseCodeSizeBaseline` | `parseCodeSizeBaseline(sourceText: string) => CodeSizeBaseline \| null` | 文字列 | 解釈できなければ `null` | 壊れた入力を空とみなさない | `CANDIDATE-U-CODESIZE-014` |
| `loadCodeSizeSources` | `loadCodeSizeSources(repoRoot: string) => { sources: CodeSizeSource[]; unreadable: string[] }` | repo root | 対象ファイルの内容と読めない path | 書き込まない | `CANDIDATE-U-CODESIZE-015` |
| `loadPreviousCodeSizeBaseline` | `loadPreviousCodeSizeBaseline(repoRoot: string) => { kind: "found"; baseline: CodeSizeBaseline } \| { kind: "absent" } \| { kind: "unreadable" }` | repo root | §5 の比較元 | 読めない比較元を `absent` にしない | `CANDIDATE-U-CODESIZE-015` |
| `loadCodeSizeMergeBaseMeasures` | `loadCodeSizeMergeBaseMeasures(repoRoot: string, paths: readonly string[]) => { kind: "found"; measures: CodeSizeBaseline } \| { kind: "unreadable" }` | repo root と baseline の path | merge-base の内容を §3 で測った記録形 | 作業木を読まない | `CANDIDATE-U-CODESIZE-015` |
| `loadRenamedCodeFiles` | `loadRenamedCodeFiles(repoRoot: string) => { kind: "found"; renames: CodeRename[] } \| { kind: "unreadable" }` | repo root | 対象に関係する rename の列 | 読めない git を rename なしにしない | `CANDIDATE-U-CODESIZE-015` |
| `checkCodeSize` | `checkCodeSize(repoRoot: string) => { messages: string[]; ok: boolean }` | repo root | adapter を合成し `analyzeCodeSize` を呼ぶ | 例外を握りつぶさない | `CANDIDATE-U-CODESIZE-016`, `CANDIDATE-U-CODESIZE-017` |

`CodeSizeInput` は `{ sources: readonly CodeSizeSource[]; baseline: CodeSizeBaseline; previousBaseline: CodeSizeBaseline | null; mergeBaseMeasures: CodeSizeBaseline | null; renames: readonly CodeRename[] }` (`max-source-params` に合わせて 1 つの object にまとめる)。`CodeSizeSource` は `{ path: string; text: string }`、`CodeRename` は `{ from: string; to: string }`、`CodeSizeBaseline` は `Readonly<Record<string, { lines: number | null; functionExcess: number | null }>>`。

## 9. 配線と PR の順序

- doctor: check 名 `code-size`、CI の doctor (governance hard gates) で fail-close する。`checkCodeSize` の `{ messages, ok }` を返す。
- PR 前に流す軽い CLI: `ut-tdd code-size check`。`ok` なら exit 0、そうでなければ exit 1。読み取りだけで、harness.db にも `.ut-tdd/` にも書かない。doctor の singleton には入らない。
- PR の順序は doc-split gate §8.2 と同じ (設計書保護 gate §10.3 の三段階): (0) 本書と L7 の契約 PR、(1) 登録 + Red PR (実 repo を読む 016 と 017 は `src/doctor/test-repository-isolation.ts` の `repositoryReadContracts` へ登録行を足す。テスト名は候補 ID を引用する)、(2) src を含まない昇格 PR (`CANDIDATE-U-CODESIZE-*` を `U-CODESIZE-*` へ 1:1 で昇格)、(3) 実装 PR (Green。`src/lint/code-size*.ts`、doctor と CLI の配線、`docs/governance/code-size-baseline.json` の初期値、`refactor-candidate-policy.ts` の `splitModuleLines` を 400 へ下げる変更 (§10))。分割 PR は src と tests と baseline を同じ PR で変える (設計文書に触れないので設計書保護 gate に当たらない)。

## 10. 既存の値との整合

- `src/state-db/refactor-candidate-policy.ts` の値は、Refactor の候補を出す値として残す (超えても違反ではない)。gate と同じ単位 (空行を除く行数) なので、大小関係を「候補 ≤ 上限」と定める。確定値では `src` の上限 500 が現行の `splitModuleLines` 700 を下回り「候補 ≤ 上限」が崩れるので、**`splitModuleLines` を 400 に下げる** (実装 PR の Green で `refactor-candidate-policy.ts` を変える)。理由: 上限 500 に届く前の 100 行の幅で分割候補を出し、gate で止まる前に分割を計画できるようにするため。`splitModuleLines` は `src` だけを走査する (`REFACTOR_SCAN_ROOTS`) ので、`tests` には候補の段を置かない。`extractHelperLines` 120 = 関数の行数の上限 120 で、候補と上限が一致する (候補は 120 以上、上限は 120 を超えたら違反)。`splitModuleExports` 24 と `dedupeFunctionMinLines` 10 は gate にしない。「候補 ≤ 上限」は L7 の `CANDIDATE-U-CODESIZE-018` が定数どうしの比較で固定する。
- 今後上限を下げるときも、候補の値を上限以下へ下げる変更を同じ実装 PR に含める (候補が上限より遅く出ると、候補の意味が無くなるため)。
- **module の責務の数え方**: `coding-rules.md` は「1 module の責務の数え方とファイル単位の上限は #1310 で決める」としている。本書はファイル単位の上限を行数だけで決め、module の責務の数 (export の数など) は gate にしない。export の数は宣言の粒度 (型の export、catalog module) で大きく揺れ、責務の数を表さないためである。`splitModuleExports` は候補のまま残す。
- `coding-rules.md` の 80 / 12 / 3 は目安のまま残す (案 1、PO 確定)。

## 11. 不変条件 (DbC)

- Pre: 入力は走査対象のファイルの path と内容の列、baseline、比較元 (`previousBaseline`、無ければ `null`)、rename の列、初回記録のときの merge-base の実測 (`mergeBaseMeasures`、それ以外は `null`)。読み取りだけを行い、ファイルを書かない。
- Post: `ok` は §6 の finding が 0 件のときだけ true。finding は入力の順序に依存せず一意に並ぶ。同じ入力から同じ出力を返す (純粋性)。
- Invariant: 値は §3 の定義だけで測り、git の履歴や更新日を推測に使わない。path の変更 (種別の変更、走査対象の外への移動) では上限が緩まない。閾値の変更は設計の改訂であり、baseline の追記では通らない。関数超過量の移動 (§5) は合計を増やさない。

## 12. 範囲外

- 循環的複雑度・制御のネストの gate (案 1 の確定により目安のまま。gate にするときは §3 と §4.2 を改訂する)。
- **後続 (未解決)**: `docs/governance/coding-rules.md` の「量の上限」表 (src・tests のファイルの行数 = 未定、関数の行数の扱い) と「Refactor の候補を出す値」表 (module の行数 700) は本書の PR では変えない。本書の merge 後に、別の PR で確定値 (500 / 500、関数 120、候補 400) と揃える。
- 責務の分け方の意味的な良し悪し、名前の付け方 (review が見る)。
- `scripts/`、`docs/`、生成物の量。設計文書の量は doc-split gate が持つ。
- 既存の baseline のファイルの分割そのもの (実装後に Refactor Issue で 1 本ずつ行う)。

## 13. 根拠

- issue #1310 (親 #968)。背景の実測 (src 439 本・tests 343 本の 1000 / 2000 行超) は 2026-10-23 の `origin/main`。本書 §4.1 は 2026-10-26 の `origin/main` (`909b26c77`) で測り直した。
- 型の手本: `docs/design/harness/L6-function-design/doc-split-gate.md` (§2 / §5 / §6 / §8.2)。
- 関数の目安: `docs/governance/coding-rules.md`「クラス・メソッド構造」と「量・分割・Refactor の目安」。候補の値: `src/state-db/refactor-candidate-policy.ts`。
- 設計判断の相談: `ut-tdd advisor --decision design` (claude-fable-5-1、2026-10-26)。単位を空行を除く行数に揃えること、関数は行数 120 だけを gate にすること、関数超過量を合計で縮小のみとし移動を許すことは、この相談の反証を repo の実測で確かめて採った。
