---
title: "L7 consumer trace gates test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-13
---

# consumer trace gate テスト設計 (issue #971 / #972 / #880)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/consumer-trace-gates.md` である。
本書はその §3 分岐、§5 読む文書、§6 表の固定と抽出、§7 trace 規則と空集合、§8 出力、§10 不変条件に加え、§13 の L1 から L3 への降下検査 (issue #1196、CANDIDATE-U-CTRACE-027〜037) を検証する oracle を定義する。
共有の `docs/test-design/harness/L7-unit-test-design.md` には索引 (§consumer trace gate) だけを置き、本書が詳細の正本である。

この pair-freeze では候補 ID (`CANDIDATE-U-CTRACE-*`) を宣言した。本変更では旧候補 `CANDIDATE-U-CTRACE-001` だけを正式 ID `U-CTRACE-001` へ 1:1 で昇格し、対応する Red テスト (`it.fails`) を記録する。他の候補 ID は候補のまま維持する。実装 PR は `it.fails` を `it` に戻して Green にするだけで、本書には触れない。
U-RCDEV-027 (v)(vi) の改訂も同じ契約 PR + Red で行う (設計文書 §9.1)。

## 2. fixture

- consumer 分岐の行は temp directory に consumer layout (`docs/design/` と `docs/test-design/`、`docs/design/harness/` は作らない) を作り、`docs/templates/vmodel/` の 4 テンプレートを複製して表の行だけを書き足す。
- 書き足す ID の既定は `REQ-01`〜 (L1)、`SC-001`〜 (L2)、`F-01`〜 (L3)、`AT-01`〜 (L12)。prefix を変える行 (004) は別の ID 体系を使う。
- harness 分岐の行 (001、002) は実 repo を読む。002 だけは temp に `docs/design/harness/` を作る。
- reader を注入する行 (019) は、要求された path を記録する fake reader を使う。
- 入口の行 (020) は同じ fixture に `evaluateStaticGate` と `lintPlanWithGate(undefined, root, "G1-trace" | "G3-trace")` の両方をかける。
- 各行は設計文書の規則を 1 本だけ殺すように作る。

## 3. Candidate oracle matrix

| Candidate | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `U-CTRACE-001` | (a) 実 repo (harness layout) に G1-trace と G3-trace をかける。(b) temp の harness layout fixture で、harness 分岐の検査を 1 つずつだけ欠かせた 3 通りの入力を作る: (b1) L1 screen-requirements §5.1 に画面へ対応しない BR が 1 件ある、(b2) L3 functional-requirements に見出し `### FR-99:` の FR を 1 件足し、`AC-FR-99-*` をどの文書 (L3 functional-requirements / business-detail / nfr-grade) にも置かない (L1 に `FR-L1-99` は置かない)、(b3) L1 NFR のうち 1 件が L3 nfr-grade に無い。(c) 有効な G1 trace を保ったまま、L3 PLAN の requires が欠落 / 不完全な版と `docs/plans/` が無い版を作る | (a) G1 の結果は BR / UX 13 件、15 画面、P0 FR 19 件のまま pass し、PLAN 由来の `l3Plans` / `missingL3Requires` を API / message に含めない。G3 は既存の `ok` と messages を保つ。(b1)〜(b3) はそれぞれ `ok=false` で、対応する違反を 1 件だけ返す: orphan business、`orphanL3Fr = [FR-99]` (`src/lint/g3-trace.ts` の R2、FR→AC の検査)、orphan NFR。(c) requires 欠落 / 不完全でも G1 の trace 結果は PLAN あり / なしで同一 | 実 repo を consumer 分岐へ流す ((a) が変わる) / harness 分岐の残る検査を 1 つでも落とす (対応する (b1)〜(b3) が `ok=true`) / G1 が PLAN を読むか、PLAN の有無または requires 内容で G1 結果を変える ((c) が不一致)。正常な実 repo だけでは retired PLAN dependency の再導入を検出できないため (b)(c) を置く |
| `CANDIDATE-U-CTRACE-002` | temp に `docs/design/harness/` と consumer の 4 文書の両方を置く | harness 分岐になる (harness 専用文書が無いので現行どおり `required doc not created` で赤) | 分岐を consumer 文書の有無で決める (consumer 分岐で green になる) |
| `CANDIDATE-U-CTRACE-003` | consumer layout、L1 `REQ-01`〜`03`、L2 `SC-001`〜`003`、L3 `F-01`〜`03`、L12 `AT-01`〜`03`、全参照が実在 | G1 / G3 とも `ok=true`。G1 message は `requirements=3, screens=3, functions=3`、G3 は `requirements=3, functions=3, tests=3`、いずれも `consumer column trace` を含む | 画面 ID を `(?:PM\|HM\|GD)-\d{2}` で抽出する (#971、screens=0 で赤) |
| `CANDIDATE-U-CTRACE-004` | 003 と同じ形で ID を `要求A`、`画面-あ1`、`FUNC_x`、`受入9` にする | 003 と同じ `ok=true` と件数 | 抽出に prefix の正規表現を使う |
| `CANDIDATE-U-CTRACE-005` | 003 の各表にテンプレートの `<記入>` 行を残したまま実データ行を足す | 件数は実データ行だけ (3 / 3 / 3)、`ok=true` | `<` で始まる ID セルを除外しない (件数 4、`<記入>` が dangling) |
| `CANDIDATE-U-CTRACE-006` | L1 `REQ-01` の `展開先` を `F-01, <記入>` にする | `ok=true` (placeholder token は捨てる) | 参照セルの `<…>` token を dangling として数える |
| `CANDIDATE-U-CTRACE-007` | L2 `SC-001` の `関連機能` を `F-01〜03` と `F-01～03` (全角チルダ) の 2 通りにする | 両方とも `ok=true` | 範囲表記を展開しない (`F-01〜03` が dangling) / `～` を扱わない |
| `CANDIDATE-U-CTRACE-008` | L3 を `F-001`〜`F-012`、L1 `展開先` を `F-001〜012` にする | `ok=true` | 展開の 0 埋めを 2 桁に固定する (`F-01` などを作って dangling) |
| `CANDIDATE-U-CTRACE-009` | 範囲表記 `F-05〜02`、`F-01〜X-03`、`abc〜3` | それぞれ `invalid_range:<doc_type_id>:<token>` で `ok=false` | 不正な範囲を空集合として通す |
| `CANDIDATE-U-CTRACE-010` | L1 `REQ-02` の `展開先` を `F-99` (どこにも無い) | G1 `ok=false`、`dangling_reference:DOC-L1-REQUIREMENTS:REQ-02:展開先:F-99`。G3 は `ok=true` | T1 を省く |
| `CANDIDATE-U-CTRACE-011` | L1 `REQ-02` の `展開先` を `SC-002` (L2 にだけある) | G1 `ok=true` | T1 の参照先を `F` だけにする (設計文書 §7.1 の `S ∪ F`) |
| `CANDIDATE-U-CTRACE-012` | L1 `REQ-02` の `展開先` を空にする | G1 `ok=false`、`missing_reference:DOC-L1-REQUIREMENTS:REQ-02:展開先` | 参照 0 個の行を通す |
| `CANDIDATE-U-CTRACE-013` | L2 `SC-002` の `関連機能` を `X-1` | G1 `ok=false`、`dangling_reference:DOC-L2-SCREEN:SC-002:関連機能:X-1` | T2 を省く |
| `CANDIDATE-U-CTRACE-014` | L3 `F-02` の `トレース元` を `SC-001` (L2 にはあるが L1 に無い) | G3 `ok=false`、`dangling_reference:DOC-L3-FUNCTIONAL:F-02:トレース元:SC-001` | T3 の参照先を `R ∪ S ∪ F` に広げる |
| `CANDIDATE-U-CTRACE-015` | L12 `AT-02` の `トレース元` を `Z-9` | G3 `ok=false`、`dangling_reference:DOC-L12-ACCEPTANCE:AT-02:トレース元:Z-9` | T4 を省く |
| `CANDIDATE-U-CTRACE-016` | 003 から L1 の実データ行を全て消す (placeholder 行は残す) | G1 / G3 とも `ok=false`、理由に `empty_required_set:DOC-L1-REQUIREMENTS:要求ID` | 空集合を孤児 0 として PASS にする (#880) |
| `CANDIDATE-U-CTRACE-017` | 003 から L2 の実データ行を全て消す (L1 の `展開先` と L12 の `トレース元` は `F-*` だけにする) | G1 `ok=false`、`empty_required_set:DOC-L2-SCREEN:画面ID` | L2 の空集合を見ない |
| `CANDIDATE-U-CTRACE-018` | 003 から L3 の実データ行を全て消す (参照は `SC-*` / `REQ-*` だけにする) | G1 / G3 とも `ok=false`、`empty_required_set:DOC-L3-FUNCTIONAL:機能ID` | L3 の空集合を見ない |
| `CANDIDATE-U-CTRACE-019` | 003 の fixture を fake reader で読む。fake reader は harness 専用の path (`business-requirements.md`、`screen-requirements.md`、`nfr.md`、`business-detail.md`、`nfr-grade.md`、root を問わない) を要求されたら記録する | G1 / G3 とも `ok=true`、記録は 0 件 | consumer 分岐で `business-detail.md` の `readRequired` を残す (#972) |
| `CANDIDATE-U-CTRACE-020` | 003 の fixture と 010 の fixture に、`evaluateStaticGate({ gate: "G1" \| "G3" })` と `lintPlanWithGate(undefined, root, "G1-trace" \| "G3-trace")` をかける | 各 fixture で、gate の trace 部分の message と plan lint の messages が一致し、`ok` も一致する | 分岐を `src/gate/static.ts` にだけ置く (plan lint が旧挙動のまま) |
| `CANDIDATE-U-CTRACE-021` | 003 から core 文書を 1 本ずつ消す (L1、L2、L3、L12 の 4 通り) | G1 は L1 / L2 / L3 の欠落で、G3 は 4 本のどれの欠落でも `ok=false`、`missing_core_doc:<doc_type_id>`。G1 は L12 の欠落で `ok=true` | 欠落を `not_applicable` / skip にして green にする / 欠落を `required docs could not be read` に丸める |
| `CANDIDATE-U-CTRACE-022` | L2 文書の frontmatter `doc_type_id` を `DOC-L4-FUNCTION` にする | G1 `ok=false`、`doc_type_mismatch:DOC-L2-SCREEN` | path だけで文書を同定する |
| `CANDIDATE-U-CTRACE-023` | 実 repo の 4 テンプレートを読み、設計文書 §6.1 の章見出しと必須列が全てあることを確かめる。加えて、003 の fixture で (a) 各表の必須列を 1 つずつ改名 (例: `展開先` → `展開`)、(b) 各章見出しを 1 つずつ改名した版を作る | 実テンプレートでは全て見つかる。(a)(b) は全ての版で `ok=false`、`required_table_missing:<doc_type_id>:<章見出し>` | header を ID 列だけで判定する ((a) の参照列の改名が通る) / 見出しを部分一致で探す / テンプレート側の改名に定数が追随しないまま通る |
| `CANDIDATE-U-CTRACE-024` | 003 の L2 に、テンプレートの `diagrams.yaml` 節 (`SC-001 サインアップ` など) を残し、さらに第5章の下に同じ 5 列の表を置いて `SC-900` を書く | screens=3、`SC-900` を ID に数えない | 文書全体から表を探す / 章の範囲を次の同レベル見出しで切らない |
| `CANDIDATE-U-CTRACE-025` | 4 テンプレートを何も書き足さずに consumer layout に置く | G1 / G3 とも `ok=false`。理由は `empty_required_set` の 3 種 (G1) / 2 種 (G3) | placeholder だけの文書を green にする |
| `CANDIDATE-U-CTRACE-026` | 003 と同じ有効な consumer fixture で (a) `docs/plans/PLAN-L3-01-x.md` (`related_l1_screen` を含み `requires` を欠く) を置く版、(b) `docs/plans/` 自体が無い版を作る | 両方の consumer G1 trace が `ok=true` であり、messages も (a)(b) で同一。PLAN 由来の `l3Plans` / `missingL3Requires` を API / message に含めない | consumer G1 が PLAN directory / PLAN file を読む、または PLAN の有無 / `requires` 内容で結果を変える。両方を失敗させて同一とする実装も拒否する |
| `CANDIDATE-U-CTRACE-027` | 降下検査 (設計文書 §13) の正例。harness layout の fixture で、L1 に `BR-01` `BR-02` `UX-01`、画面 `PM-01` `HM-01` を置き、L3 の対象文書に各 ID を単独で 1 回ずつ書く。`analyzeL1L3Descent` をかける | `ok=true`、`violations` は 0 件、`totals` は `br=2, ux=1, screens=2`、message は `l1-l3-descent - OK` を含む | L3 を読まずに常に PASS にする / ID の抽出を `extractG1BusinessIds` / `extractG1ScreenIds` と別の形にして件数がずれる |
| `CANDIDATE-U-CTRACE-028` | 027 から、L3 のどの対象文書にも現れない BR を 1 件 (`BR-09`)、UX を 1 件 (`UX-09`)、画面を 1 件 (`HM-09`) 足す。ID は L1 の表にだけ置く | `ok=false`、`l3_descent_missing:br:BR-09`、`l3_descent_missing:ux:UX-09`、`l3_descent_missing:screen:HM-09` を辞書順で全件返す。最初の 1 件で打ち切らない | 種別の一部 (画面など) を検査しない / 最初の欠落で打ち切る |
| `CANDIDATE-U-CTRACE-029` | 027 から、`BR-01` を `BR-10` の中の部分文字列にだけ現れる形 (L3 には `BR-10` だけ) にし、L1 には `BR-01` と `BR-10` の両方を置く | `l3_descent_missing:br:BR-01` を返し、`BR-10` は降りた扱い | 部分文字列一致で数える (`BR-01` が `BR-10` の中身で降りたことになる) |
| `CANDIDATE-U-CTRACE-030` | 027 から、`BR-02` の引用を `BR-01〜03` と `BR-01～03` (全角チルダ) の範囲表記だけにする (L3 には `BR-02` の単独の引用が無い) | どちらも `l3_descent_missing:br:BR-02` を返す (harness は範囲を数えない、設計文書 §13.3)。未決事項 Q2 が数える側に決まったときは、本行の期待と §13.6 の欠落件数を同じ変更で改訂する | 範囲表記の途中の ID を降下に数える |
| `CANDIDATE-U-CTRACE-031` | 028 の 3 件の欠落に対し、設計文書 §13.5 の除外台帳に `BR-09` `UX-09` `HM-09` を 5 列とも埋めて書く (reader で台帳の表を注入する)。さらに (a) `BR-09` の `理由` を空にした版、(b) 台帳に L1 に無い `BR-99` を足した版、(c) 台帳の `UX-09` が L3 に降りてしまった版を作る | 台帳が正しい版は `ok=true`、`excluded=3`。(a) は `exclusion_invalid:BR-09:理由`、(b) は `exclusion_stale:BR-99`、(c) は `exclusion_stale:UX-09`。いずれも `ok=false` | 必須列が空の除外を通す / 腐った台帳の行を無視する / 除外を `src/` の許可リストや PLAN から読む (台帳が設計文書の表だけであることを、reader が要求した path で確かめる) |
| `CANDIDATE-U-CTRACE-032` | 退役 ID の扱い。L1 の画面要求に、旧 ID `SCR-01` を退役表 (§1 の外) に置き、L3 には書かない。`BR-NN` に似ない `XX-01` も L1 の別の節に置く | `SCR-01` と `XX-01` は検査対象にならず、`ok=true` | 文書全体から ID を拾って退役 ID まで必須にする / 抽出を §1 の表に限らない |
| `CANDIDATE-U-CTRACE-033` | 実 repo (harness layout) に `analyzeL1L3Descent` をかけ、結果を設計文書 §13.6 の測定値と照合する。加えて同じ実 repo に既存の `analyzeDescentObligations` をかけ、FR-L1 の L1 から L3 の欠落が 0 件であることを確かめる | Green 前の前提を満たした後で `ok=true`、BR 10 件・UX 3 件・画面 15 件が検査され、`excluded` は台帳の行数と一致する。FR-L1 は `analyzeL1L3Descent` の `totals` に含まれず、`descent-obligation` 側の欠落は 0 件。Green の前提 (§13.6 の 9 件の解消) が未了の間は `it.fails` で `BR-01`〜`BR-07` と `UX-02` `UX-03` の欠落を固定する | 実 repo の欠落を実装側の許可リストで消して通す / FR を二重に数える / 契約と実測の件数が食い違う |
| `CANDIDATE-U-CTRACE-034` | 空集合と読み取り。(a) L1 の business 文書から BR / UX が 0 件取れる fixture、(b) L3 の対象文書が 1 本も無い fixture、(c) `README.md` と `roadmap.md` にだけ `BR-01` が書かれた fixture | (a) は `empty_l1_set:br` と `empty_l1_set:ux`、(b) は `missing_l3_docs`、(c) は `l3_descent_missing:br:BR-01` (索引と工程表は降下先に数えない)。いずれも `ok=false` | 空集合を孤児 0 として PASS にする / L3 が読めない状態を PASS にする / `README.md` / `roadmap.md` を降下先に数える |
| `CANDIDATE-U-CTRACE-035` | consumer の降下 D1。003 の fixture で、L3 の各 `機能一覧` 行の `トレース元` を `REQ-01` `REQ-02` `REQ-03` と対応させた版 (正例) と、`REQ-03` をどの `トレース元` にも書かない版 (負例)。さらに `トレース元` を `REQ-01〜03` (範囲表記) にした版 | 正例は `ok=true`。負例は `l3_descent_missing:DOC-L1-REQUIREMENTS:REQ-03`。範囲表記の版は `REQ-01`〜`REQ-03` 全てが降りた扱いで `ok=true` (consumer は §6.3 で範囲を展開する) | D1 を省く / L1 の `展開先` だけを見て L3 の引用を確かめない / consumer で範囲を展開しない |
| `CANDIDATE-U-CTRACE-036` | consumer の降下 D2。003 の fixture で、L2 の各 `画面ID` の `関連機能` に `F-0n` を書いた版 (正例) と、`SC-003` の `関連機能` を `REQ-03` (要求だけ) にした版 (負例)。ID の体系を `要求A` `画面-あ1` `FUNC_x` に替えた版も作る | 正例は `ok=true`。負例は `l3_descent_missing:DOC-L2-SCREEN:SC-003`。ID を替えた版も正例と同じ結果 | D2 を省く / `関連機能` に要求 ID があるだけで降りた扱いにする / consumer の画面 ID を `(?:PM\|HM\|GD)-\d{2}` で拾う (#971) |
| `CANDIDATE-U-CTRACE-037` | consumer の読み取り (#972)。003 の fixture を fake reader で読み、`analyzeL1L3Descent` をかける。さらに 4 テンプレートを何も書き足さずに置いた版を作る | 003 の fixture は `ok=true` で、harness 専用の path (019 と同じ集合) の要求は 0 件。テンプレートのままの版は `ok=false` で、理由は 025 と同じ `empty_required_set` が先に出て、降下の理由を重ねて返さない | consumer で harness 専用文書を読む / 空集合に対して降下の理由を大量に出す |

001(c) の各版は、全て `ok=true` であり、PLAN 由来の `l3Plans` / `missingL3Requires` を API / message に含めず、同じ trace 結果と messages を返すことを要求する。全版を `ok=false` にして同一性だけを満たす実装は拒否する。

## 4. Gate and scope fence

- 本書の oracle は consumer 分岐の G1-trace / G3-trace と、harness 分岐の挙動不変だけを扱う。layer pair gate、doctor、projection-writer、L1 第5章 非機能要求、L3 の ZIP-DOC-043 節は対象外 (設計文書 §11)。 降下検査 (027〜037) の入口の配線は設計文書 §13.9 の Q1 が未決なので、`analyzeL1L3Descent` を直接呼ぶ。027〜037 の候補 ID は未昇格で、正式 ID への昇格と Red テストは後続の契約 PR + Red で行う。
- harness 分岐の保持対象は 001 と `tests/g1-trace.test.ts` / `tests/g3-trace.test.ts` で確かめる。A4 の PLAN 専用 G1 退役に伴い U-G1 の `missingL3Requires` 期待と `l3Plans` 出力期待は意図的に改訂する。G1 OK message は設計文書 §8 の3件形式に固定し、`tests/g1-trace.test.ts` の U-G1 と既存 oracle `tests/gate-static.test.ts:53` / `tests/pack-canary-acceptance.test.ts:2017` の期待を更新する。`scripts/pack-canary-acceptance.mjs:215` は business / screens / p0Fr の各件数を `>=1` とする既存ガードを保つ。一方、BR / screen / P0 FR trace の orphan fail-close と OT-45 R1〜R3 の件数条件は保持し、G3 の既存 oracle / expectation は変更しない。U-CTRACE-001 の (b2)(b3) を保持するため、既存 G3 test を変更せず通常の独立負例2件だけ `tests/g3-trace.test.ts` に追加する。これは後続の consumer trace 実装による変更と分けて扱う。
- consumer 分岐の PASS は、件数の下限を持たない列参照 trace の PASS である。OT-45 の PASS の証拠に流用しない (設計文書 §4)。
- 契約 PR + Red で `src/lint/consumer-trace.ts` がまだ無いために import が失敗して `it.fails` が成立しても、各規則の Red の証拠にならない。実装 PR は、候補ごとに規則を 1 本だけ殺す mutation を入れて Red になることを確かめ、そのログを §5 に残す。

## 5. Required evidence

実装 PR は次を残す。

- 各 candidate の Red→Green ログ (mutation を入れた Red の再現を含む)。
- A4 Red→Green 後の `tests/g1-trace.test.ts` で、PLAN なし / 不完全 PLAN によって有効な G1 trace が変わらず、BR / screen / P0 FR の orphan は引き続き fail-close すること。`tests/g3-trace.test.ts` の既存テストは変更せず green を保ち、U-CTRACE-001 の (b2)(b3) に対応する通常負例2件も green であること。改訂後の U-RCDEV-027 が green であること。これらは後続の consumer trace 実装 PR での挙動変更と混同しない。
- A4 Red→Green では、実 repo の非PLAN件数が13 / 15 / 19と表示され、canary parser の3件すべてが `>=1` のままであることを確認する。共有 gate serialization の形式・合否を保ち、退役対象の PLAN 専用判定を除いて G3 と BR / screen / P0 FR の orphan fail-close は変わらないことを確認する。
- typecheck / Biome、Linux / Windows / aggregate CI の run ID、exact HEAD、非著者 closing receipt digest。

### A4 の移行: PLAN 専用 G1 検査の退役

- 契約変更の対象は U-G1 の L3 PLAN `requires` 判定と `l3Plans` / `missingL3Requires` の API・message surface だけである。代替の L1→L3 全件 trace lint は追加しない。
- 契約 PR + Red で、PLAN が無い / 不完全でも有効な G1 trace が pass し、BR / screen / P0 FR の orphan は fail-close する期待を先行させる。OT-45 R1〜R3 の 13 / 15 / 19 件条件を保持する。
- G1 OK message から `l3Plans` を除き、非PLAN件数3値を設計文書 §8 の順序で残す。これ以外に G1 の退役範囲を広げない。共有テスト `gate-static.test.ts` の改訂は他 PR と直列にする。
- 本契約 PR は docs-only であり実装しない。Green ではじめて G1 の PLAN reader と retired fields / messages を除く。
