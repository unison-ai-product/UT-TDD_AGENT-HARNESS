---
title: "L7 doc split gate test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/doc-split-gate.md
status: draft
updated: 2026-10-14
---

# 設計文書の肥大検査 (doc-split gate) テスト設計 (issue #1032)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/doc-split-gate.md` である (未実装の目標契約)。
本書はその §2 対象、§3 測る量、§4 閾値、§5 baseline、§6 判定規則と finding、§7 関数、§8.1 配線、§9 不変条件を検証する oracle を定義する。
共有の `docs/test-design/harness/L7-unit-test-design.md` は肥大の当事者なので、索引行を足さない。本書が詳細の正本である。

この pair-freeze では候補 ID (`CANDIDATE-U-DOCSPLIT-*`) だけを宣言する。正式 ID `U-DOCSPLIT-*` への 1:1 の昇格と Red のテスト (`it.fails`) は、src/ を含まない契約 PR + Red で入れる (`design-protection-diff-gate.md` §10.2)。実装 PR は `it.fails` を `it` に戻して Green にするだけで、本書には触れない。昇格を Red より先に入れると、未引用の正式 ID を `oracle-test-trace` が拒否する。

## 2. fixture

- `measureDoc` / `classifyDoc` / `analyzeDocSplit` の行は、path と内容の組、baseline、比較元 baseline を直接渡す純粋関数の入力で作る。実 repo のファイルは読まない (020 と 021 を除く)。
- 行数の境界は、`"x\n".repeat(n)` のような生成した内容で作る。1 行の差で結果が変わる境界値を各上限で使う。
- 1 つの行は規則を 1 本だけ殺すように、入力の書き方を 1 つだけ変える。
- 014 は temp directory に実 git repository を作り、比較元の取得 (`found` / `absent` / `unreadable`) だけを確かめる。
- 020 と 021 は実 repo の走査であり、開発 repo を読むテストとして `test-repository-isolation` の登録が要る。

## 3. Candidate oracle matrix

| Candidate | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-DOCSPLIT-001` | `measureDoc` に、(a) 空の内容、(b) `"a\nb\n"`、(c) `"a\nb"`、(d) `"a\r\nb\r\n"`、(e) `"\n"` を渡す | `lines` は (a) 0、(b) 2、(c) 2、(d) 2、(e) 1 | 末尾の改行の後ろの空要素を数える / CRLF を 2 行に数える / 空の内容を 1 行にする |
| `CANDIDATE-U-DOCSPLIT-002` | 3 個のバッククォートで開閉するフェンスの内側に `## 偽の節` と、`\| U-FAKE-001 \| x \|` の行を置いた `l6-topic` と `l7-topic` の内容 | フェンス内の行は `lines` に含まれるが、`responsibilities` と `names` には含まれない。閉じないフェンスは以降の全行をフェンス内とみなす | フェンスの内側の見出しや ID を責務に数える / フェンスの行を `lines` から除く |
| `CANDIDATE-U-DOCSPLIT-003` | `l6-topic` の内容に、`# 題`、`## A`、`### A-1`、`## B`、`#### 深い見出し` を置く | `responsibilities` は 2、`names` は `["A", "B"]` (出現順)。`###` 以下と `#` は数えない | レベル 1 / 3 以下の見出しを数える / 名前の順序が出現順でない |
| `CANDIDATE-U-DOCSPLIT-004` | `l7-topic` の内容に、先頭セルが (a) `U-HOVER-001`、(b) `` `CANDIDATE-U-WHIDE-004` ``、(c) `U-FR-L1-21-01`、(d) `U-RIGHT-ARM-ENGINE-002`、(e) 同 family の 2 行目 `U-HOVER-002`、(f) ヘッダ行 `U-ID (候補)`、(g) 先頭セルは普通の語で第 2 セルに `U-OTHER-001` を書いた行、(h) 末尾が数字でない `U-BAD-X` の行 | family は `HOVER`、`WHIDE`、`FR`、`RIGHT` の 4 種。`responsibilities` は 4。(e) は重複として数えず、(f)(g)(h) は数えない | 先頭セル以外の ID を数える / family を ID 全体で数える / 多セグメント ID の第 1 セグメントを取り違える / ヘッダ行を ID とみなす |
| `CANDIDATE-U-DOCSPLIT-005` | `classifyDoc` に、(a) `docs/design/harness/L6-function-design/x.md`、(b) `docs/design/harness/L6-function-design/sub/x.md`、(c) `docs/test-design/harness/L7-x-test-design.md`、(d) `docs/test-design/harness/L8-integration-test-design.md`、(e) `docs/design/harness/L5-detailed-design/internal-processing.md`、(f) `docs/plans/PLAN-1.md`、(g) `docs/design/harness/L6-function-design/x.txt`、(h) `docs\\design\\harness\\L6-function-design\\x.md` (バックスラッシュ区切り) を渡す | (a) `l6-topic`、(b) `layer-doc` (L6 直下ではない)、(c) `l7-topic`、(d) `layer-doc`、(e) `layer-doc`、(f)(g) `null`、(h) `l6-topic` (正規化後) | L6 の子ディレクトリを `l6-topic` にする / 対象外 path を走査する / バックスラッシュを正規化しない |
| `CANDIDATE-U-DOCSPLIT-006` | baseline が空で、新規の文書を行数の境界で試す: `l6-topic` の 400 行 / 401 行、`l7-topic` の 400 行 / 401 行、`layer-doc` の 1200 行 / 1201 行 | 400 行、400 行、1200 行は finding 0 件。401 行、401 行、1201 行は `doc-split-required` (`new-doc-over-limit`) で `ok=false` | 上限を未満判定にする (上限ちょうどが赤になる) / 上限を class 間で取り違える |
| `CANDIDATE-U-DOCSPLIT-007` | baseline が空で、新規の文書を責務の数の境界で試す: `l6-topic` の `##` が 16 個 / 17 個、`l7-topic` の family が 4 種 / 5 種、`layer-doc` の `##` が 100 個 (行数は 1200 以下) | 16 個、4 種、`layer-doc` の 100 個は finding 0 件。17 個、5 種は `new-doc-over-limit` で、メッセージが責務の数を `17/16`、`5/4` の形で含む。`layer-doc` は責務の数で赤にならない | 責務の数の上限を行数に使い回す / `layer-doc` に責務の上限を掛ける |
| `CANDIDATE-U-DOCSPLIT-008` | baseline に `{ lines: 500, responsibilities: 20 }` がある `l6-topic` (上限 400 行 / 16 責務を超えている) で、(a) 500 行 / 20 責務のまま、(b) 501 行 / 20 責務、(c) 500 行 / 21 責務 | (a) finding 0 件 (baseline の内側は上限を超えていても通る)。(b)(c) は `doc-split-required` (`exceeds-baseline`) で、どちらが増えたかがメッセージに出る | baseline がある文書にも class の上限を掛ける (a が赤になる) / 行数と責務の数の片方しか baseline と比べない |
| `CANDIDATE-U-DOCSPLIT-009` | 008 と同じ baseline で、(a) 499 行 / 20 責務、(b) 500 行 / 19 責務、(c) 499 行 / 19 責務 | (a)(b)(c) は `doc-split-stale-baseline` (`shrunk`) で `ok=false`。baseline の更新を求めるメッセージ | 縮んだのに更新を求めない / 片方だけが縮んだ場合を見逃す |
| `CANDIDATE-U-DOCSPLIT-010` | 008 と同じ baseline で、文書が (a) 400 行 / 16 責務 (上限ちょうど)、(b) 100 行 / 3 責務 | (a)(b) とも `doc-split-stale-baseline` (`within-limit`)。baseline の行を消すことを求める | 上限の内側に収まった baseline の行を残させる / 上限ちょうどを外側とみなす |
| `CANDIDATE-U-DOCSPLIT-011` | baseline に `docs/design/harness/L6-function-design/gone.md` があるが、`sources` にその文書が無い | `doc-split-stale-baseline` (`missing-file`) で `ok=false`。他の文書は評価を続ける | 消えた文書の baseline 行を黙って通す |
| `CANDIDATE-U-DOCSPLIT-012` | `layer-doc` が baseline `{ lines: 1385, responsibilities: null }` の下で、(a) 1385 行、(b) 1386 行、(c) 1384 行、(d) 責務の数 (`##`) だけを大きく増やして 1385 行のまま | (a) finding 0 件、(b) `exceeds-baseline`、(c) `shrunk`、(d) finding 0 件 (`layer-doc` の責務の数は比べない) | `layer-doc` の責務の数を比べる / `null` を 0 として比較して誤検出する |
| `CANDIDATE-U-DOCSPLIT-013` | 比較元 baseline を渡し、現在の baseline が (a) 同じ、(b) ある文書の `lines` を増やした、(c) ある文書の `responsibilities` を増やした、(d) 比較元に無い文書を足した、(e) 文書 A を減らし文書 B を同じだけ増やした、(f) 縮めた | (a)(f) は `doc-split-baseline-grown` なし。(b)(c)(d)(e) は `doc-split-baseline-grown` で `ok=false` (e は増えた B で検出する) | baseline そのものを増やして通せる / 件数の付け替えを見逃す |
| `CANDIDATE-U-DOCSPLIT-014` | temp の git repository で、(a) merge-base の commit に `src/lint/doc-split-baseline.ts` がある、(b) その commit には無い (初めて入れる PR)、(c) merge-base を解決できない (origin/main が無い)、(d) ファイルはあるが解釈できない内容 | `loadPreviousDocSplitBaseline` は (a) `found` (中身が解釈済み)、(b) `absent`、(c) `unreadable`、(d) `unreadable`。`checkDocSplit` は (b) で比較を省き、(c)(d) で `doc-split-baseline-base-unreadable` を返して `ok=false` | 読めない比較元を「比較なし」と取り違える / 初めて入れる PR を赤にする |
| `CANDIDATE-U-DOCSPLIT-015` | `analyzeDocSplit` に (a) `sources` が空、(b) `loadDocSplitSources` が読めない path を `unreadable` に返した状態の `checkDocSplit` | (a)(b) とも `doc-split-input-unreadable` で `ok=false`。違反なしの緑にならない | 入力が読めないことを違反 0 件とみなす |
| `CANDIDATE-U-DOCSPLIT-016` | 新規の `l6-topic` が 20 個の `##` (上限 16、超過 4 個) を持つ内容、同じく 401 行で `##` が 5 個、baseline `{ 500, 20 }` の文書が 501 行 / 20 責務、`l7-topic` の family が 6 種、`layer-doc` が 1201 行 | メッセージの責務名は出現順の**後ろから** k 個: 20 個の `##` は後ろの 4 個、401 行 / 5 責務は後ろの 1 個 (`max(1, 超過個数)`)、501 行 / 20 責務 (baseline 内の責務は超過 0) は後ろの 1 個。メッセージは `docs/design/harness/L6-function-design/<topic>.md` と `docs/test-design/harness/L7-<topic>-test-design.md` の形を含む。`l7-topic` は L7 側の形だけを指示する。`layer-doc` は分割先の path を含まず「責務ごとの文書に分ける」を含む | 分割先の形を指示しない / 責務名を先頭から選ぶ / 超過 0 のとき名前を 0 個にする |
| `CANDIDATE-U-DOCSPLIT-017` | 同じ内容の集合を、(a) 入力の順序、(b) baseline のキーの順序を入れ替えて 2 回 `analyzeDocSplit` に渡す。(c) 同じ入力を 2 回渡す | (a)(b)(c) とも `findings` と `summary` が一致する (finding は `path`、`kind`、`reason` の順で並ぶ)。入力は変更されない (純粋性) | 出力が入力の順序に依存する / 入力の baseline を破壊的に更新する |
| `CANDIDATE-U-DOCSPLIT-018` | `sources` に対象外の path (`docs/plans/PLAN-1.md`、`src/x.ts`) と、巨大な行数の対象外の文書を混ぜる | 対象外は `checked` に数えず、finding も出さない。対象の文書だけが評価される | 対象外の path を走査する / 対象外の肥大で赤になる |
| `CANDIDATE-U-DOCSPLIT-019` | `parseDocSplitBaseline` に、(a) 実装と同形の有効なソース (1 文書 1 行、`layer-doc` は `responsibilities: null`)、(b) 空の baseline `{}`、(c) 数値でない `lines`、(d) 途中で切れたソース | (a) 値を復元する、(b) 空の baseline、(c)(d) は `null` (読めない扱い) | 壊れたソースを空の baseline とみなす |
| `CANDIDATE-U-DOCSPLIT-020` | 実 repo (`origin/main` の内容) に `checkDocSplit` をかける。さらに、temp にコピーした実 repo の `docs/design/harness/L6-function-design/function-spec.md` の末尾に 1 行を足し、`docs/test-design/harness/L7-unit-test-design.md` の末尾にも 1 行を足す | 実 repo は `ok=true` で、baseline の文書数は 3 (`function-spec.md`、`L7-unit-test-design.md`、`internal-processing.md`)。コピーに足した各 1 行は、それぞれ `doc-split-required` (`exceeds-baseline`) で止まり、メッセージに分割先の形を含む | 実 repo に対して常に緑 (baseline が実測と無関係) / 実際の追記を止められない |
| `CANDIDATE-U-DOCSPLIT-021` | (a) doctor に `doc-split` の check が登録されている (hard gate)。(b) `ut-tdd doc-split check` を、緑の worktree と、違反を足した worktree で実行する。(c) 実行前後で `.ut-tdd/` と harness.db のファイルの更新時刻を比べる | (a) 登録されており、違反のとき doctor が fail する。(b) 緑は exit 0、違反は exit 1 でメッセージを標準出力に出す。(c) 書き込みなし | doctor に配線しない / CLI が常に exit 0 / CLI が state を書く |

## 4. 昇格と引用の方針

- 候補 ID は `CANDIDATE-U-DOCSPLIT-*` のまま Red のテストが引用する。正式 ID `U-DOCSPLIT-*` への昇格は、正式 ID を先頭セルに書き直す契約 PR で行い、そのときテストの引用を同じ PR で書き換える (§1)。
- 014 の `found` / `absent` / `unreadable` の 3 値は `loadPreviousDocSplitBaseline` の戻り値の型 (L6 §7) と 1:1 に対応する。
- 020 の「baseline の文書数は 3」は 2026-10-14 の実測であり、分割 PR で `function-spec.md` と `L7-unit-test-design.md` が上限の内側に入ったときは、baseline の行が消えるので、その PR が 020 の期待値を同時に改訂する。

## 5. 範囲外

- 責務の分け方の意味的な良し悪し (L6 §10)。
- 既存 2 本の分割そのものの検証 (中身が変わっていないことの多重集合の比較は、分割 PR の手順 3 であり、本書の oracle ではない)。
- `l6-completion` / `ddd-tdd-rules` の読み先の直し (L6 §8.3) の検証は、それぞれの既存の oracle と、分割 PR の実 repo 回帰で扱う。
