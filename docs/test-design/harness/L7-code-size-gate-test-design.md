---
title: "L7 code size gate test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/code-size-gate.md
status: confirmed
updated: 2026-10-26
issue: 1310
---

# コードとテストの量の検査 (code-size gate) テスト設計 (issue #1310)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/code-size-gate.md` である (未実装の目標契約)。
本書はその §2 対象と種別、§3 測る量、§4.2 閾値、§5 baseline、§6 判定規則と finding、§7 分割先の指示、§8 関数、§9 配線、§10 既存の値との整合、§11 不変条件を検証する oracle を定義する。
共有の `docs/test-design/harness/L7-unit-test-design.md` には索引行を足さない。本書が詳細の正本である。

この pair-freeze では候補 ID (`CANDIDATE-U-CODESIZE-*`) を宣言した。`U-CODESIZE-001`〜`019` は設計書保護 gate §10.3 の三段階の (2) の昇格 PR で 1:1 に正式昇格した (L6 §9)。
閾値の値を書いた oracle (003 の `functionExcess`、004、005、012 の (d)、018、019) は L6 §4.2 の **PO 確定値 (2026-10-26。ファイル 500 / 500、関数 120、分割候補 400)** で書いてある。値を変えるときは、L6 §4.2 と同じ改訂でこれらの値を書き換える。他の oracle は、L6 §4.2 で比べたどの上限 (500〜1200 行) でも結果が変わらない値 (1300 行の baseline、300 行の上限の内側) か、`CODE_SIZE_LIMITS` からの相対値 (上限 + 1 など) で書く。

## 2. fixture

- `classifyCodeFile` / `measureCodeFile` / `analyzeCodeSize` の行は、path と内容の組、baseline、比較元 baseline、merge-base の実測、rename の列を直接渡す純粋関数の入力で作る。実 repo のファイルは読まない (016 と 017 を除く)。
- 行数の境界は、`"const a = 1;\n".repeat(n)` のような生成した内容で作る。関数の行数の境界は、本体に `x++;` を n 行持つ関数を生成して作る。1 行の差で結果が変わる境界値を各上限で使う。
- 1 つの行は規則を 1 本だけ殺すように、入力の書き方を 1 つだけ変える。
- 015 は temp directory に実 git repository を作り、比較元の取得・merge-base の実測・rename の検出だけを確かめる。
- 016 と 017 は実 repo を読むので、`test-repository-isolation` の登録が要る (L6 §9 の (1))。

## 3. oracle 宣言の一覧

| ID | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `U-CODESIZE-001` | `measureCodeFile` に `src/x.ts` として、(a) 空の内容、(b) `"a;\n\n  \nb;\n"`、(c) `"a;\r\n\r\nb;"`、(d) `"// c\n/* d */\na;\n"` を渡す | `lines` は (a) 0、(b) 2 (空行と空白だけの行を数えない)、(c) 2、(d) 3 (コメント行は数える) | 空行を数える / 空白だけの行を数える / CRLF で行を取り違える / コメント行を除く |
| `U-CODESIZE-002` | `classifyCodeFile` に、(a) `src/x.ts`、(b) `src/a/b.tsx`、(c) `src/a/c.mts`、(d) `tests/x.test.ts`、(e) `tests/support/h.ts`、(f) `tests/fixtures/f.ts`、(g) `src/types.d.ts`、(h) `scripts/x.ts`、(i) `src/x.js`、(j) `src\a\b.ts` (バックスラッシュ区切り)、(k) `src/node_modules/m.ts`、(l) `src/dist/d.ts` を渡す | (a)(b)(c)(j) `src`、(d)(e) `tests`、(f)(g)(h)(i)(k)(l) `null` | fixture や `.d.ts` を走査する / `scripts/` を走査する / バックスラッシュを正規化しない / `tests/support/` を外す |
| `U-CODESIZE-003` | `measureCodeFile` に `src/x.ts` として、(a) ブロック本体に `x++;` を 130 行と空行 5 行とコメント行 5 行を持つ関数宣言、(b) 本体 125 行の method を持つ class、(c) 本体 120 行の arrow function、(d) 式本体が 3 行の arrow function、(e) 本体に `x++;` 100 行と、本体 30 行の callback (`const cb = () => {` と `};` の 2 行を含めて 32 行) を持つ関数、(f) 本体 121 行の constructor と本体 10 行の getter を持つ class、(g) 同じ内容を `tests/x.test.ts` として渡す | `functions` (全関数、出現順) の `lines` が (a) [130] (括弧の行・空行・コメントだけの行を数えない)、(b) [125]、(c) [120]、(d) [3]、(e) [132 (外側、入れ子を含む), 30 (内側)]、(f) [121 (constructor), 10 (getter)]。`functions` の `name` と `line` は宣言の名前・開始行 (名前の無いものは `<anon@行番号>`)。`overFunctions` は `functions` から 120 を超えるものを行数の降順で抜き出した値で、(a) [130]、(b) [125]、(c) [] 、(d) []、(e) [132]、(f) [121]。`functionExcess` は 120 を上限として、(a) 10、(b) 5、(c) 0、(e) 12、(f) 1 で、ファイル内の合計になる。超えている関数の個数は判定に使わない。(g) は `functionExcess` が `null`、`functions` と `overFunctions` が空配列で関数を測らない | 括弧の行や空行・コメント行を数える / 入れ子の関数を外側から除く / method・constructor を測らない / 上限ちょうどを超過にする / `tests` の関数を測る / 関数の個数で判定する |
| `U-CODESIZE-004` | baseline が空で、新規ファイルを行数の境界で試す (PO 確定値): `src` の 500 行 / 501 行、`tests` の 500 行 / 501 行 | 500 行は `src`・`tests` とも finding 0 件。501 行は両方とも `code-size-required` (`new-file-over-limit`) で `ok=false`、メッセージは `lines=501/500` の形 | 上限を未満判定にする / 上限を class 間で取り違える / 物理行で数える |
| `U-CODESIZE-005` | baseline が空で、関数の境界を試す (PO 確定値): (a) 本体 120 行の関数を持つ新規 `src` ファイル、(b) 121 行、(c) 本体 300 行の `it` callback を持つ新規 `tests` ファイル (ファイルは 500 行以内) | (a) finding 0 件、(b) `new-file-over-limit` で `functionExcess=1/0` を含む、(c) finding 0 件 | 関数の上限を `tests` に掛ける / 関数超過量を判定に使わない |
| `U-CODESIZE-006` | baseline `{ "src/big.ts": { lines: 1300, functionExcess: null } }` で、(a) 1300 行、(b) 1301 行、(c) 1299 行、(d) 300 行 (上限の内側)、(e) 1300 行のまま本体 121 行の関数を足す | (a) finding 0 件、(b) `exceeds-baseline`、(c) `code-size-stale-baseline` (`shrunk`)、(d) `within-limit` (行を消すよう求める)、(e) `exceeds-baseline` (`functionExcess` の `null` は 0 が上限) | baseline の行に class の上限を掛ける / 縮んだのに更新を求めない / `null` を「無制限」とみなす |
| `U-CODESIZE-007` | baseline `{ "src/mid.ts": { lines: null, functionExcess: 30 } }` で、(a) 300 行から上限ちょうど (`CODE_SIZE_LIMITS` の `src` の値) へ育ち `functionExcess` は 30、(b) 上限 + 1 行、(c) `functionExcess` 31、(d) 29、(e) 0 | (a) finding 0 件 (`lines` の `null` は class の上限が掛かる)、(b)(c) `exceeds-baseline`、(d) `shrunk`、(e) `within-limit` | 関数だけの超過でファイルの行数まで凍結する / `lines` の `null` で上限を外す |
| `U-CODESIZE-008` | baseline に `src/gone.ts` の行があるが `sources` に無い。他に違反のあるファイルも混ぜる | `code-size-stale-baseline` (`missing-file`) で `ok=false`。他のファイルの評価は続く | 消えたファイルの行を黙って通す |
| `U-CODESIZE-009` | `previousBaseline` を渡し、現在の baseline (各行は実測と一致させる) が、(a) 同じ、(b) ある path の `lines` を増やした、(c) 比較元に無い path に非 `null` の `lines` を足した、(d) A の `functionExcess` 30 を消し、新しい path B に 30 を足した (移動)、(e) A を 30 から 10 に減らし B に 25 を足した (合計 35)、(f) A を 30 から 40 に増やし C を 20 から 10 に減らした (合計同じ)、(g) 縮めた | (a)(d)(f)(g) は `code-size-baseline-grown` なし。(b)(c)(e) は `code-size-baseline-grown` で `ok=false` | `lines` を合計で比べる / `functionExcess` を path ごとに比べて移動を拒む / 合計の増加を見逃す / baseline に行を足して通せる |
| `U-CODESIZE-010` | rename の列を渡す。baseline と比較元に `src/big.ts` が `{ 1300, null }`。(a) `src/sub/big.ts` へ rename し行を付け替える (値は同じ、旧 path の行は消す)、(b) (a) で `lines` を 1301 にする、(c) (a) で旧 path の行を残す、(d) `src/big.ts` を `tests/big.ts` へ、(e) `scripts/big.ts` へ、(f) `tests/a.test.ts` を `tests/fixtures/a.ts` へ rename、(g) `scripts/x.ts` (300 行) を `src/x.ts` へ rename (取り込み) | (a) finding 0 件、(b) `code-size-baseline-grown`、(c) `missing-file`、(d)(e)(f) `code-size-class-changed` (path は `to`)、(g) finding 0 件 | 子ディレクトリへの移動で baseline を失う / 走査対象の外へ移して上限を逃れる / 引き継ぎで値を増やせる |
| `U-CODESIZE-011` | `previousBaseline = null` (初回記録) で `mergeBaseMeasures` を渡す。(a) merge-base で 1300 行の `src` ファイルを Green が 1350 行に育て 1350 を記録、(b) merge-base に無い新規ファイルを記録、(c) merge-base で 300 行 (上限の内側) のファイルを記録、(d) merge-base で 1300 行・記録 1300・head も 1300、(e) merge-base で `functionExcess` 20 のファイルを 25 と記録、(g) merge-base で 300 行・`functionExcess` 20 のファイルを Green が 1300 行に育て `{ lines: 1300, functionExcess: 20 }` と記録、(h) 同じファイルを `{ lines: null, functionExcess: 20 }` と記録 (head も 300 行)、(f) `mergeBaseMeasures` が `null` (merge-base を解決できない) | (a) `code-size-initial-baseline-grown`、(b)(c) `code-size-initial-baseline-new-entry`、(d) finding 0 件、(e)(g) `code-size-initial-baseline-grown` (g は merge-base の記録形の `lines` が `null` で、上限より大きい値を記録した)、(h) finding 0 件、(f) `code-size-baseline-base-unreadable` で `ok=false` | 初回記録で Green 自身の成長や新規登録を head の実測との一致だけで通す / 照合できないことを照合なしで通す |
| `U-CODESIZE-012` | 分割先の指示を試す。(a) 新規 `src/feature/x.ts` が上限 + 20 行で、トップレベルの文が出現順に `alpha`、`beta` (残りの行の大半)、`gamma` (15 行)、(b) 同じく上限 + 1 行で末尾の文が 5 行、(c) 新規 `tests/x.test.ts` が上限 + 10 行で末尾が `describe("末尾の題", ...)` (30 行)、(d) 関数が本体 150 行の `big` と 130 行の名前の無い arrow を持つ新規 `src` ファイル | (a) 超過 20 行に対し後ろから `gamma` (15) と `beta` を選び (`alpha` は選ばない)、`src/feature/<topic>.ts` と `tests/<topic>.test.ts` の対を指示する。(b) 末尾の 1 個 (最低 1 個)。(c) `describe: 末尾の題` を選び、`tests/<topic>.test.ts` だけを指示する (src の path を含まない)。(d) `big` (150/120) と `<anon@行番号>` (130/120) を行数の降順で挙げる | 分割先を指示しない / 先頭から選ぶ / 超過行数に届く前に止める / 0 個を選ぶ / `tests` に src の path を指示する / 名前の無い関数を落とす |
| `U-CODESIZE-013` | (a) `sources` が空、(b) `loadCodeSizeSources` が読めない path を `unreadable` に返した状態の `checkCodeSize`。(c) 同じ内容を入力の順序と baseline のキーの順序を入れ替えて 2 回、(d) 同じ入力を 2 回渡す。(e) 対象外の path (`docs/x.md`、`scripts/x.ts`) に巨大な内容を混ぜる | (a)(b) `code-size-input-unreadable` で `ok=false`。(c)(d) `findings` と `summary` が一致し、finding は `path`、`kind`、`reason` の順。入力は変更されない。(e) 対象外は `checked` に数えず finding も出さない。末尾の行は `checked=` `over=` `stale=` `baseline=` を持つ | 入力が読めないことを違反 0 件とみなす / 出力が入力の順序に依存する / 入力を破壊的に更新する / 対象外の肥大で赤になる |
| `U-CODESIZE-014` | `parseCodeSizeBaseline` に、(a) 有効な JSON (1 ファイル 1 行、`{ lines: 900, functionExcess: null }` と `{ lines: null, functionExcess: 30 }`)、(b) `{}`、(c) 数値でも `null` でもない `lines`、(d) 負の値、(e) 途中で切れた JSON | (a) 値を復元する、(b) 空の baseline、(c)(d)(e) `null` (読めない扱い) | 壊れた入力を空の baseline とみなす / 負の値を受け付ける |
| `U-CODESIZE-015` | temp の git repository で、(a) merge-base の commit に `docs/governance/code-size-baseline.json` がある、(b) 無い、(c) `origin/main` が無く merge-base を解決できない、(d) JSON として解釈できない。続けて、(e) merge-base で 900 行の `src/big.ts` を作業木で 950 行に育てた状態の `loadCodeSizeMergeBaseMeasures`、(f) `src/big.ts` を `git mv` で `src/sub/big.ts` へ移した状態の `loadRenamedCodeFiles`、(g) git を起動できない状態の `loadRenamedCodeFiles` | `loadPreviousCodeSizeBaseline` は (a) `found`、(b) `absent`、(c)(d) `unreadable`。`checkCodeSize` は (b) で比較を省き、(c)(d) で `code-size-baseline-base-unreadable`。(e) は `found` で 900 (作業木の 950 ではない)。(f) は R 行を `found` で返す。(g) は `unreadable` | 読めない比較元を比較なしと取り違える / 初めて入れる PR を赤にする / merge-base ではなく作業木を測る / 読めない git を rename なしとみなす |
| `U-CODESIZE-016` | 実 repo (`origin/main` の内容) に `checkCodeSize` をかける。temp にコピーした実 repo で、(a) baseline に行のある `src` ファイルのうち `lines` が最大の 1 本と、`tests` ファイルのうち最大の 1 本の末尾に、それぞれ 1 行を足す、(b) 新しい `src` ファイルに本体 121 行の関数を足す (具体的なファイル名は固定せず baseline の行から選ぶ) | 実 repo は `ok=true` で、`docs/governance/code-size-baseline.json` の各行は、その時点の実測から作った記録形 (L6 §5) と一致する (行数や値は本書に固定しない)。(a) の各 1 行は `exceeds-baseline` で止まりメッセージに分割先の指示を含む。(b) は `new-file-over-limit`。baseline は `docs/governance/` から読む (`src/` の定数ではない) | 実 repo に対して常に緑 (baseline が実測と無関係) / 実際の追記を止められない |
| `U-CODESIZE-017` | (a) doctor に `code-size` の check が登録されている。(b) `ut-tdd code-size check` を、緑の worktree と違反を足した worktree で実行する。(c) 実行前後で `.ut-tdd/` と harness.db のファイルの更新時刻を比べる | (a) 登録されており、違反のとき doctor が fail する。(b) 緑は exit 0、違反は exit 1 でメッセージを標準出力に出す。(c) 書き込みなし | doctor に配線しない / CLI が常に exit 0 / CLI が state を書く |
| `U-CODESIZE-018` | `CODE_SIZE_LIMITS` と `REFACTOR_CANDIDATE_THRESHOLDS` (`src/state-db/refactor-candidate-policy.ts`) を import して比べる | (a) `CODE_SIZE_LIMITS` の `src` のファイルの行数 ≥ `splitModuleLines`、関数の行数 ≥ `extractHelperLines` (候補 ≤ 上限、L6 §10)。(b) 等値: `splitModuleLines` === 400、`extractHelperLines` === 120、`src` の上限 === 500。(c) 境界: 空白以外を含む行が 399 / 400 / 401 行の `src` ファイル (export は 1 個) を `analyzeRefactorCandidates` と `analyzeCodeSize` (baseline は空) の両方に渡す。399 行は `split-module` の候補なし、400 行と 401 行は候補あり (候補は値以上で出す)。3 つとも gate の finding は 0 件 (gate は 501 行から) | 上限を候補より小さくして、候補が上限より遅く出る / `splitModuleLines` を 500 など 400 以外にする (大小比較だけなら通る) / 候補を値を超えたときだけ出す (400 行で出ない) |
| `U-CODESIZE-019` | 同じ `src` ファイルを `analyzeRefactorCandidates` (候補側) と `measureCodeFile` (gate) の両方に渡す。(a) 関数本体に `x++; /* c` と `*/ x++;` の 2 行の組を 60 組置く、(b) 61 組、(c) 本体 125 行の method、constructor、getter、(d) 本体が 125 行の式の arrow function、(e) 本体 100 行と本体 30 行の callback を持つ関数 (003 の (e) と同じ形) | 両側で関数の行数と拾った関数が一致する (gate 側は `functions` の `lines` で比べる)。(a) は両側 120 行で、`extract-helper` の候補が出て (候補は 120 以上)、gate の `functions` は [120] で `overFunctions` は空。(b) は両側 122 行で、`extract-helper` の候補が出て、gate の `functions` は [122]、`functionExcess` は 2。(c)(d) は両側が同じ関数を拾い、候補が出て、gate の `functions` と `overFunctions` に入る。(e) は外側 132 行で両側が一致し、gate の `functions` は [132, 30] | 候補側がコメントを改行ごと除いて行数を少なく数える (b で候補側が 61 行になり、gate だけが止める) / 候補側が method・constructor・getter・式本体の arrow を拾わない / 入れ子の扱いが両側で違う |

## 4. 昇格と引用の方針

- `U-CODESIZE-001`〜`019` は、src/ を含まない昇格 PR で候補 ID から正式 ID へ 1:1 に昇格し、先頭セルの書き直しと Red のテスト名の引用の書き換えを同時に入れた (§1、L6 §9 の (2))。
- 015 の `found` / `absent` / `unreadable` は `loadPreviousCodeSizeBaseline` の戻り値の型 (L6 §8) と 1:1 に対応する。
- 016 は baseline の行数や特定の値を期待値に持たない (L6 §5: 初期値は Green の base commit で実測して記録する)。分割 PR で baseline の行が減っても 016 は改訂不要である。

## 5. 範囲外

- 循環的複雑度・制御のネストの測り方 (L6 §3 で測らない。PO が gate にする案を選んだときに本書へ oracle を足す)。
- 責務の分け方の意味的な良し悪し (L6 §12)。トップレベルの文を 1 つにまとめて名前を減らす、といった書式の変更は行数を減らさないので、上限の回避にならない。
- 既存の baseline のファイルの分割そのもの。
