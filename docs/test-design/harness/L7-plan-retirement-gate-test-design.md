---
title: "L7 PLAN retirement gate test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-19
pair_artifact: docs/design/harness/L6-function-design/plan-retirement-gate.md
---

# PLAN 退役 gate テスト設計 (issue #1078)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/plan-retirement-gate.md` である (**未実装の目標契約**)。
本書はその §3 入力形式、§4 判定規則、§5 発火条件、§6 関数の DbC、§7 出力形式、§9 処分 JSON の凍結を検証する oracle を定める。
共有の `docs/test-design/harness/L7-unit-test-design.md` には索引 (§PLAN 退役 gate) だけを置き、本書が詳細の正本である。

この pair-freeze では候補 ID (`CANDIDATE-U-PLRET-*`) だけを宣言する。工程は設計保護 gate の L6 `design-protection-diff-gate.md` §10.3 の三段階に揃える。015・016・027 は開発 repo (処分 JSON と生成スクリプト) を読むので `test-repository-isolation` の登録行が要り、次の順になる。

1. **登録 + Red (src/ は登録行だけ)**: Red のテスト (`it.fails`) を候補 ID で引用して入れる。開発 repo を読むテストファイルには、同じ PR に `src/doctor/test-repository-isolation.ts` の `repositoryReadContracts` の登録行だけを足す。design / test-design は変えない。
2. **昇格 (src/ を含まない)**: 候補の正式 ID `U-PLRET-*` への昇格 (全件) と、テスト名の引用の書き換えを同じ PR で入れる。
3. **実装 PR (L6 §10 の 4)**: `it.fails` を `it` に戻して Green にする。実装 PR は `docs/test-design/` を変えない。

## 2. fixture

- 001〜014・017・020〜026・028〜030・032〜037 は `analyzePlanRetirement` / `planRetirementMessages` を直接呼ぶ純粋関数のテストで、ファイルシステムも環境変数も使わない。入力は `PlanRetirementInput` を手で組む (最小の完備 fixture を基準に 1 点だけ壊す)。
- 031 と 018・019 は temp directory に `git init` した最小 repo (base commit に `docs/plans/PLAN-*.md` と処分 JSON、head commit に削除 / rename / 追加) を作り `loadPlanRetirementInput` を呼ぶ。
- 015・016・027 は開発 repo を読む実 repo の検査で、純粋関数テストではない。015 と 027 は実 JSON (`06_PLAN_DISPOSITION_FIRST_PASS.json`) の読み取りを同じテストファイルの 1 つの helper で共有し、016 は生成スクリプトの source を読んで temp 複製の JSON に実行する。`test-repository-isolation` の `repositoryReadContracts` には、この 3 件を含むテストファイルを 1 行で登録する (§1 の段階 1。実 JSON の読み取り (015・027) と生成スクリプトの読み取り (016) の両方を登録の範囲に含め、登録漏れは段階 1 の Red で検出する)。他の oracle は開発 repo を読まない (018・019・031 は temp repo だけを読む)。

## 3. 候補 oracle

| ID | 入力 | 期待 | 殺す mutant |
|---|---|---|---|
| `CANDIDATE-U-PLRET-001` | 削除 1 件 + `disposition: null` (base に JSON 不在)、および `plans` が配列でない JSON | 両方とも violation は処分 JSON の path の `disposition_unreadable` 1 件だけで、他の規則は評価されない (L6 §6 post-2) | JSON が読めないとき pass にする / 他規則を続けて評価し大量の violation を返す |
| `CANDIDATE-U-PLRET-002` | `deletedPlanPaths` が空で、`disposition` が null、または全件 `not-finalized` | `ok: true`、violation 0 (L6 invariant-1)。追加・変更・`docs/plans/` 内 rename だけの PR を表す入力でも同じ | 削除の有無に関係なく常に発火する |
| `CANDIDATE-U-PLRET-003` | 削除 1 件 (PLAN B)。`disposition` の `plans[]` には削除されない PLAN A の記録が無く、B の記録も無い / B の完備した記録だけがある | 削除対象 B の記録が無いときだけ B に `plan_not_in_disposition`。削除されない A の欠落・未最終化は violation にならない (L6 §4 規則 1・post-3)。B が完備なら `ok: true` | 検査対象を base の全 PLAN に広げ、削除しない PLAN の欠落で落とす (案A への退行) / 削除対象の記録欠落を見逃す (現状 `PLAN-L6-971-consumer-trace-gates.md` の欠落を、削除するときに落とせない) |
| `CANDIDATE-U-PLRET-004` | 同じ `sourcePath` の記録が 2 件 | `duplicate_disposition` (その path に 1 件) | 先勝ち / 後勝ちで重複を黙って畳む |
| `CANDIDATE-U-PLRET-005` | `wholeSourceDisposition` が (a) `not-finalized`、(b) 未知値 `keep`、(c) 欠落 | (a) `not_finalized`、(b)(c) `invalid_disposition`。`transferred` / `merged` / `retired` は通る | `not-finalized` を通す / 未知値を通す / 列挙の一部 (例: `merged`) を拒否する |
| `CANDIDATE-U-PLRET-006` | `transferred` と `merged` で `destinations` が (a) 空配列、(b) 欠落、(c) `design` / `issue` 以外の kind だけ。`retired` で `destinations` が空 | (a)(b)(c) は `missing_destination`。`retired` は空でも行き先の規則では落ちない | `destinations` が空でも通す / `retired` にも行き先を要求する |
| `CANDIDATE-U-PLRET-007` | `design` の `path` が (a) 存在しない、(b) 同名 basename が別 directory にだけある、(c) `docs/design/` `docs/test-design/` 外の既存 file | (a)(b)(c) すべて `destination_path_missing` | basename 一致で存在とみなす (L6 §3.2 の path 規定違反を通す) / 配下制限を見ない |
| `CANDIDATE-U-PLRET-008` | 行き先文書が実在し、`section` が (a) どの見出しにも一致しない、(b) コードフェンス内の `# ...` 行にだけ一致、(c) 見出しの途中にだけ含まれる (前方一致でない)、(d) `section` が空文字・空白のみ・string でない | (a)〜(d) すべて `destination_section_missing` (空・空白のみは任意の見出しに前方一致するので非空を要する、L6 §4) | 本文の全行を見る (フェンス内を見出し扱い) / 部分一致 (`includes`) にする |
| `CANDIDATE-U-PLRET-009` | `section: "§4"` が見出し `## §4 判定規則` に、`section: "判定規則"` が `### 判定規則 (DbC)` に当たる。見出しの前後空白と `#` の個数 (1〜6) が異なる | すべて violation 無し。7 個以上の `#` は見出しにならない | 前方一致を完全一致に厳格化し装飾付き見出しを拒否する / `#` の個数を 2 に固定する |
| `CANDIDATE-U-PLRET-010` | `issue` の `number` が `0`、`-1`、`1.5`、文字列 `"12"`、欠落 / 正の整数 `1078` | 不正 4 種 + 欠落は `invalid_issue_ref`、`1078` は通る | 型を見ず truthy 判定にする (`"12"` と `0` の扱いを誤る) |
| `CANDIDATE-U-PLRET-011` | `retired` で `retirementReason` が (a) 欠落、(b) 空文字、(c) 空白のみ / (d) 非空。`transferred` で `retirementReason` が空 | (a)(b)(c) は `missing_retirement_reason`、(d) は通る。`transferred` の空は落とさない | trim しない / `retired` 以外にも理由を要求する |
| `CANDIDATE-U-PLRET-012` | `reconciliation` が (a) 欠落、(b) `kind: "other"`、(c) `three-way` で `verdict` が `conflict` / `pending` / 欠落 | (a)(b) は `missing_reconciliation`、(c) は `reconciliation_unresolved`。`verdict` が `consistent` / `plan-stale` なら通る | 照合結果の中身を見ず存在だけで通す / `plan-stale` を拒否する |
| `CANDIDATE-U-PLRET-013` | (a) `three-way` で `evidencePath` が不在、(b) `evidencePath` は実在するが本文に `evidenceId` が無い、(b2) `evidenceId` が空文字・空白のみ・string でない (本文には含まれうる)、(c) `supersedes-two-sided` で `confirmedSupersededBy` が空 / 1 件以上 | (a)(b)(b2) は `reconciliation_evidence_missing`、(c) の空は `reconciliation_unresolved`、1 件以上は終端条件 (L6 §4 規則 4、024〜026) を満たすときだけ通る | 証跡 path の実在だけで通す (ID の本文照合を省く) / `supersedes-two-sided` を自己申告で通す |
| `CANDIDATE-U-PLRET-014` | 完備 fixture (A: `transferred` + design 行き先 + `three-way`、B: `retired` + 理由 + `supersedes-two-sided`、C: `merged` + issue 行き先 + `three-way`)、削除 1 件。同 fixture の `plans[]` と `deletedPlanPaths` の並びを入れ替えた入力、および violation が複数出る壊し方 | 完備は `ok: true`。並びを変えても結果が同一で、violation は `path` 辞書順・同一 path は規則番号順 (L6 §4 末尾、post-1) | 完備でも落ちる (規則の過剰適用) / 入力順で出力が変わる |
| `CANDIDATE-U-PLRET-015` | 開発 repo の処分 JSON を実際に読み、`deletedPlanPaths` を `git ls-files docs/plans` の 1 件にして analyzer を呼ぶ。期待は JSON の `plans[]` から**テスト内で独立に数えた**値 (その 1 件の記録の欠落・未最終化・行き先の不備の有無) | `violations.length` と `ok` がその独立集計と一致する。最終化が進んでも (件数が変わっても) 式が成り立つ。`deletedPlanPaths` が空なら必ず `ok: true` | 実 repo で規則 1・2 が機能していない (件数が合わない) / 時点依存の定数を期待値に埋めている |
| `CANDIDATE-U-PLRET-016` | 一次インベントリ生成スクリプト `06_PLAN_DISPOSITION_FIRST_PASS.mjs` の `--write-json` を、temp にコピーした処分 JSON の `plans[]` に `not-finalized` 以外が 1 件ある状態で実行 / すべて `not-finalized` の状態で実行 | 前者は非 0 で終了し、JSON の bytes が実行前と同一 (L6 §9)。後者は従来どおり書き込める | 最終化済みの記録を `--write-json` が黙って上書きする |
| `CANDIDATE-U-PLRET-017` | `number: 999999` (実在しない issue 番号) の `issue` 行き先を含む完備 fixture。`gh` / network / `Date` を呼ぶと失敗する stub 環境で analyzer を 2 回呼ぶ | `ok: true` で、2 回の結果が一致し、外部呼び出し 0 回 (L6 invariant-2) | issue の実在を `gh` で確認する / 現在時刻・環境に依存する |
| `CANDIDATE-U-PLRET-018` | temp repo で base→head の差分が (a) `docs/plans/PLAN-X.md` の削除、(b) `docs/plans/` 外への rename、(c) `docs/plans/` 内で新 path も PLAN パターンに一致する rename (`PLAN-X.md` → `PLAN-Y.md`)、(c2) 同じ directory 内でパターン外へ rename (`PLAN-X.md` → `retired-X.txt`、`PLAN-X.md` → `PLAN-X.md.bak`)、(d) 追加のみ、(e) 変更のみ、(f) `docs/plans/PLAN-*.md` 以外 (README 等) の削除 | `loadPlanRetirementInput` の `deletedPlanPaths` は (a)(b)(c2) だけを含み (b)(c2) は旧 path。`headPlanPaths` は head の tree に残る PLAN。(c)(d)(e)(f) は削除に数えない。`dispositionChangedInPr` は JSON を変更した差分のときだけ true | rename を一律に削除と扱わない、または一律に除外して c2 を取りこぼす / 追加・変更を削除と誤認する / `headPlanPaths` を base の tree から作る |
| `CANDIDATE-U-PLRET-019` | `loadPlanRetirementInput` を処分 JSON と行き先文書を含む temp repo で呼ぶ | 呼び出し前後で処分 JSON・文書の bytes が同一 (L6 invariant-3)。参照された全 path が `fileHeadings` / `fileTexts` に入る (不在は `null`) | loader が JSON を整形・正規化して書き戻す / 参照 path の先読みを漏らし analyzer が不在と誤判定する |
| `CANDIDATE-U-PLRET-020` | violation 3 件の結果 (うち 2 件は同一 path) | `planRetirementMessages` が `path:reason` の 3 行を決定的な順で返す。空結果は空配列 (L6 §7) | 出力形式の変更 (`reason:path` 等) / reason の欠落 |
| `CANDIDATE-U-PLRET-021` | 削除 1 件 (PLAN X、完備)。削除されない PLAN の frontmatter の (a) `requires`、(b) `parent`、(c) `supersedes`、(d) `references` のいずれか 1 欄だけが X の `plan_id` または `docs/plans/<file>.md` を指す。欄ごとに別 fixture | 4 欄とも、参照元の path で `dangling_plan_reference` (L6 §4 規則 5)。X を指さない参照は落とさない | `references` など一部の欄を検査対象から落とす / path 形式か `plan_id` 形式のどちらかしか照合しない |
| `CANDIDATE-U-PLRET-022` | 削除 1 件 (X、完備)。設計文書 frontmatter の `plan:` 欄が (a) X の path、(b) 別の存続 PLAN の path、(c) 欄なし | (a) は設計文書の path で `dangling_plan_reference`、(b)(c) は落とさない | owning-plan 欄を検査しない / 欄の値の形式違いで取りこぼす |
| `CANDIDATE-U-PLRET-023` | 削除 1 件 (X、完備)。(a) 削除されない PLAN の本文中だけに X の PLAN ID の言及がある、(b) 削除される PLAN X 自身の frontmatter が X を指す (自己参照)、(c) 削除対象どうしの参照 (X と Y が両方削除され互いを `references` に持つ) | (a)(b)(c) すべて violation 無し。本文の言及は履歴参照として止めない (L6 §4 規則 5、§8) | 本文の PLAN ID を grep して落とす / 削除される側の参照元まで検査する |
| `CANDIDATE-U-PLRET-024` | 削除 1 件 (X)。X は `supersedes-two-sided`、`confirmedSupersededBy` の後継 Z が (a) head の tree に存在し削除されない、(b) head に存在しないが Z の記録が `transferred` で `design` の行き先を持ち規則 2・3 を満たす | (a)(b) とも終端を満たし violation 無し (L6 §4 規則 4) | 後継の存在を `confirmedSupersededBy` の件数だけで判定する / 非 PLAN で最終化済みの後継を拒否する |
| `CANDIDATE-U-PLRET-025` | 削除 1 件 (X)。`confirmedSupersededBy` の後継 Z が (a) head に存在せず、Z の記録は `not-finalized`、(b) Z の記録が `supersedes-two-sided` だけで行き先を持たない (連鎖が PLAN のまま続く)、(c) Z の記録が `retired` | (a)(b)(c) すべて `supersedes_chain_open` | 連鎖を再帰的に辿って PLAN どうしの link で閉じたことにする / `retired` の後継を終端に数える |
| `CANDIDATE-U-PLRET-026` | 削除 2 件 (X と後継 Z を同じ PR で削除)。Z の記録が (a) `merged` で `issue` の行き先を持ち規則 2・3 を満たす、(b) `not-finalized` | (a) は X の終端を満たし violation 無し、(b) は Z に `not_finalized`、X に `supersedes_chain_open` (L6 §4 規則 4 の (ii)) | 後継が削除対象だと存在扱いにして通す / 後継の最終化を見ない |
| `CANDIDATE-U-PLRET-027` (実 repo の検査。純粋 fixture では代替しない) | 開発 repo の**実 JSON** から `confirmedSupersededBy` が非空の記録を全件 (12 件) 取り出し、各要素を L6 §3.4 の抽出規則に通す。さらにその 1 件を analyzer へ `supersedes-two-sided` の記録として渡す (`supersessionFacts` は両方 true、後継は存続) | 全要素がオブジェクトで、`successorPlanId` が非空 string、`supersedesTarget` が記録の `planId` と一致、`confirmedTwoSidedLink === true`。analyzer は後継 ID を要素から取り出して受理する。要素を ID 文字列として扱う実装は後継を解決できず Red | `confirmedSupersededBy` を planId 配列と仮定する (実 schema との不一致。任意の 1 PLAN でなく、非空の実データで検出する) |
| `CANDIDATE-U-PLRET-028` | 偽造した link: 削除 X の記録を `retired`・理由あり・`supersedes-two-sided` とし、無関係な存続 PLAN Z を有効形の `confirmedSupersededBy` 要素 (`confirmedTwoSidedLink: true`) で指す。`supersessionFacts` は `successorDeclaresTarget: false` または `targetBodyBackref: false`、あるいは key 自体が無い | `reconciliation_unresolved` (JSON の自己申告ではなく blob 由来の facts が正。L6 invariant-2) | JSON の `confirmedTwoSidedLink` を信用して通す |
| `CANDIDATE-U-PLRET-029` | 同時編集: (a) `dispositionChangedInPr: true` で削除 1 件、(b) 渡した `disposition` (base 値) は `not-finalized`、head では finalized 済みに編集されている状況を表す入力 | (a) は処分 JSON の path で `disposition_changed_with_deletion` 1 件 (L6 規則 0)、(b) は X に `not_finalized` (head の編集は判定に使われない) | 削除と最終化の記録を同じ PR で通す / head の JSON を読む |
| `CANDIDATE-U-PLRET-030` | 不正な link 要素: (a) 要素が文字列、(b) `successorPlanId` 欠落・空白、(c) `supersedesTarget` が記録の `planId` と不一致、(d) `confirmedTwoSidedLink: false`、(e) `selfSupersedesExcluded: true` | (a)〜(e) すべて有効な要素が 0 件で `reconciliation_unresolved` | 要素の形・target 一致・boolean を検査しない |
| `CANDIDATE-U-PLRET-031` | temp repo で (a) base の blob に後継 Z の `supersedes: [X]` があり X の本文に Z の core ID がある、(b) Z の宣言が同じ PR で追加された (base に無い)、(c) Z は宣言するが X の本文に back-reference が無い。`loadPlanRetirementInput` を呼ぶ | `supersessionFacts` は (a) が両方 true、(b) は両方 false、(c) は `successorDeclaresTarget: true` かつ `targetBodyBackref: false`。facts は head ではなく base の blob から算出される | head の作業ツリーから facts を読む (同じ PR で追加した宣言が通る) / back-reference を検査しない |

| `CANDIDATE-U-PLRET-032` | `supersedes-two-sided` の記録の `coverage` が欠落・null・`"all"`・`"FULL"`・数値 / `"full"` の完備 fixture | 不正・欠落は `coverage_missing` (既定で full とみなさない)。完備は通る (L6 §3.3・§4 規則 4 (C)) | coverage が無い記録を full として通す / 値の列挙を検査しない |
| `CANDIDATE-U-PLRET-033` | (a) `full` なのに `transferred` + design 行き先、(b) `partial` なのに `retired` + 行き先なし / `partial` + `transferred` または `merged` + design 行き先 | (a)(b) は `coverage_disposition_mismatch`。後者は通る (L6 §4 規則 4 (C)) | partial を retired で通し、残った契約の行き先なしに削除する (A 区分 11 件の抜け穴) |
| `CANDIDATE-U-PLRET-034` | `full` で (a) `planHeadings` に `coverageBasis` が覆わない見出しがある、(b) `planHeadings` が null / キー無し / **空配列** (見出し level 2〜3 が無く H4 以下にだけ契約がある PLAN)、(c) `successorLocation` が空白・欠落、`coverageBasis` が配列でない・欠落 / 前後空白付きの見出しが一致する完備 | (a)〜(c) は `coverage_basis_incomplete`。完備は通る (見出し集合の trim 後の包含。L6 §4 規則 4 (C)) | full を自己申告で通す (見出し 1 つの抜けを見逃す) / trim しない |
| `CANDIDATE-U-PLRET-036` | `full` の `successorLocation` が (a) string、(b) `plan` の節が後継 PLAN の見出しに無い、(c1) `plan` の `planId` が link に無い別 PLAN (その PLAN の見出しは `successorPlanHeadings` に実在する)、(c2) `planId` が自己参照先 X (X の見出しも実在する。どちらも Z の有効な link と実体 facts は維持し、拒否理由は「実在するが有効な後継ではない」ことだけ)、(d) `design` の path 不在、(e) `design` の節が不一致、(f) `governance` が `candidates/` 配下、(g) kind 不正、(h) 後継 PLAN の見出しが読めない (null) / `plan` / `design` / `governance` の実在する構造化参照 | (a)〜(h) は `coverage_basis_incomplete`、実在する 3 種は通る (L6 §3.3・§4 規則 4 (C)。意味の照合は gate の外で review の責務、§1・§11) | 置換先を非空 string で通し、存在しない置換先で部分 supersede を full として削除する |
| `CANDIDATE-U-PLRET-037` | 後継 Z が head に無く、(a) `governance` へ `transferred` 済み、(b) Z が同じ PR で削除され `governance` へ `merged` 済み / (c) governance の行き先の節が無い | (a)(b) は X の終端を満たし violation 無し、(c) は `supersedes_chain_open` (L6 §4 規則 4 (B)(ii) が規則 3 と同じ行き先の集合を認める) | 終端を design / issue に限り、有効な governance 最終化の後継を open 扱いにする |
| `CANDIDATE-U-PLRET-035` | `governance` 行き先が (a) `docs/governance/` 配下の実在 file、(b) `docs/governance/candidates/` 配下、(c) `docs/design/` 配下、(d) 不在の path、(e) 節が不一致 | (a) は通る。(b)(c)(d) は `destination_path_missing`、(e) は `destination_section_missing` (L6 §3.2・§4 規則 3) | governance を行き先として認めない / candidates や他配下を通す / 節の一致を見ない |

## 4. 既存 oracle への影響

既存の候補 oracle 001〜031 の**期待値は変えない** (reason 集合も ok も同じ)。ただし `supersedes-two-sided` の記録形式が変わる (coverage / coverageBasis / `planHeadings` 入力、L6 §3.3・§6) ので、test の fixture を追従させる: `twoSidedRec` helper に全面 supersede の coverage を、`input()` helper に `planHeadings` と `successorPlanHeadings` の既定値を足し、027 の本体は記録に coverage の 2 欄 (後継 PLAN 自身の節を指す構造化参照) と両 headings の入力を足す。これは記録形式への追従だけで、判定の期待を変えない (Red の `it.fails` のまま)。

本 gate は PLAN が削除されるときだけ発火する新規の gate で、`merged-plan-status` / `plan-supersession` / 設計保護 gate の既存 oracle の入力・出力を変えない (L6 §8)。
