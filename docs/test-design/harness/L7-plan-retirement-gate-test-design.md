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

この pair-freeze では候補 ID (`CANDIDATE-U-PLRET-*`) だけを宣言する。工程は設計保護 gate の L6 `design-protection-diff-gate.md` §10.3 の三段階に揃える。015・016 は開発 repo (処分 JSON と生成スクリプト) を読むので `test-repository-isolation` の登録行が要り、次の順になる。

1. **登録 + Red (src/ は登録行だけ)**: Red のテスト (`it.fails`) を候補 ID で引用して入れる。開発 repo を読むテストファイルには、同じ PR に `src/doctor/test-repository-isolation.ts` の `repositoryReadContracts` の登録行だけを足す。design / test-design は変えない。
2. **昇格 (src/ を含まない)**: 候補の正式 ID `U-PLRET-*` への昇格 (全件) と、テスト名の引用の書き換えを同じ PR で入れる。
3. **実装 PR (L6 §10 の 4)**: `it.fails` を `it` に戻して Green にする。実装 PR は `docs/test-design/` を変えない。

## 2. fixture

- 001〜014・017・020〜026 は `analyzePlanRetirement` / `planRetirementMessages` を直接呼ぶ純粋関数のテストで、ファイルシステムも環境変数も使わない。入力は `PlanRetirementInput` を手で組む (最小の完備 fixture を基準に 1 点だけ壊す)。
- 018・019 は temp directory に `git init` した最小 repo (base commit に `docs/plans/PLAN-*.md` と処分 JSON、head commit に削除 / rename / 追加) を作り `loadPlanRetirementInput` を呼ぶ。
- 015・016 は開発 repo の処分 JSON と生成スクリプトを読む static 検査で、`test-repository-isolation` の登録行が要る (§1 の段階 1)。

## 3. 候補 oracle

| ID | 入力 | 期待 | 殺す mutant |
|---|---|---|---|
| `CANDIDATE-U-PLRET-001` | 削除 1 件 + `disposition: null` (JSON 不在)、および `plans` が配列でない JSON | 両方とも violation は処分 JSON の path の `disposition_unreadable` 1 件だけで、他の規則は評価されない (L6 §6 post-2) | JSON が読めないとき pass にする / 他規則を続けて評価し大量の violation を返す |
| `CANDIDATE-U-PLRET-002` | `deletedPlanPaths` が空で、`disposition` が null、または全件 `not-finalized` | `ok: true`、violation 0 (L6 invariant-1)。追加・変更・`docs/plans/` 内 rename だけの PR を表す入力でも同じ | 削除の有無に関係なく常に発火する |
| `CANDIDATE-U-PLRET-003` | 削除 1 件 (PLAN B)。`disposition` の `plans[]` には削除されない PLAN A の記録が無く、B の記録も無い / B の完備した記録だけがある | 削除対象 B の記録が無いときだけ B に `plan_not_in_disposition`。削除されない A の欠落・未最終化は violation にならない (L6 §4 規則 1・post-3)。B が完備なら `ok: true` | 検査対象を base の全 PLAN に広げ、削除しない PLAN の欠落で落とす (案A への退行) / 削除対象の記録欠落を見逃す (現状 `PLAN-L6-971-consumer-trace-gates.md` の欠落を、削除するときに落とせない) |
| `CANDIDATE-U-PLRET-004` | 同じ `sourcePath` の記録が 2 件 | `duplicate_disposition` (その path に 1 件) | 先勝ち / 後勝ちで重複を黙って畳む |
| `CANDIDATE-U-PLRET-005` | `wholeSourceDisposition` が (a) `not-finalized`、(b) 未知値 `keep`、(c) 欠落 | (a) `not_finalized`、(b)(c) `invalid_disposition`。`transferred` / `merged` / `retired` は通る | `not-finalized` を通す / 未知値を通す / 列挙の一部 (例: `merged`) を拒否する |
| `CANDIDATE-U-PLRET-006` | `transferred` と `merged` で `destinations` が (a) 空配列、(b) 欠落、(c) `design` / `issue` 以外の kind だけ。`retired` で `destinations` が空 | (a)(b)(c) は `missing_destination`。`retired` は空でも行き先の規則では落ちない | `destinations` が空でも通す / `retired` にも行き先を要求する |
| `CANDIDATE-U-PLRET-007` | `design` の `path` が (a) 存在しない、(b) 同名 basename が別 directory にだけある、(c) `docs/design/` `docs/test-design/` 外の既存 file | (a)(b)(c) すべて `destination_path_missing` | basename 一致で存在とみなす (L6 §3.2 の path 規定違反を通す) / 配下制限を見ない |
| `CANDIDATE-U-PLRET-008` | 行き先文書が実在し、`section` が (a) どの見出しにも一致しない、(b) コードフェンス内の `# ...` 行にだけ一致、(c) 見出しの途中にだけ含まれる (前方一致でない) | (a)(b)(c) すべて `destination_section_missing` | 本文の全行を見る (フェンス内を見出し扱い) / 部分一致 (`includes`) にする |
| `CANDIDATE-U-PLRET-009` | `section: "§4"` が見出し `## §4 判定規則` に、`section: "判定規則"` が `### 判定規則 (DbC)` に当たる。見出しの前後空白と `#` の個数 (1〜6) が異なる | すべて violation 無し。7 個以上の `#` は見出しにならない | 前方一致を完全一致に厳格化し装飾付き見出しを拒否する / `#` の個数を 2 に固定する |
| `CANDIDATE-U-PLRET-010` | `issue` の `number` が `0`、`-1`、`1.5`、文字列 `"12"`、欠落 / 正の整数 `1078` | 不正 4 種 + 欠落は `invalid_issue_ref`、`1078` は通る | 型を見ず truthy 判定にする (`"12"` と `0` の扱いを誤る) |
| `CANDIDATE-U-PLRET-011` | `retired` で `retirementReason` が (a) 欠落、(b) 空文字、(c) 空白のみ / (d) 非空。`transferred` で `retirementReason` が空 | (a)(b)(c) は `missing_retirement_reason`、(d) は通る。`transferred` の空は落とさない | trim しない / `retired` 以外にも理由を要求する |
| `CANDIDATE-U-PLRET-012` | `reconciliation` が (a) 欠落、(b) `kind: "other"`、(c) `three-way` で `verdict` が `conflict` / `pending` / 欠落 | (a)(b) は `missing_reconciliation`、(c) は `reconciliation_unresolved`。`verdict` が `consistent` / `plan-stale` なら通る | 照合結果の中身を見ず存在だけで通す / `plan-stale` を拒否する |
| `CANDIDATE-U-PLRET-013` | (a) `three-way` で `evidencePath` が不在、(b) `evidencePath` は実在するが本文に `evidenceId` が無い、(c) `supersedes-two-sided` で `confirmedSupersededBy` が空 / 1 件以上 | (a)(b) は `reconciliation_evidence_missing`、(c) の空は `reconciliation_unresolved`、1 件以上は終端条件 (L6 §4 規則 4、024〜026) を満たすときだけ通る | 証跡 path の実在だけで通す (ID の本文照合を省く) / `supersedes-two-sided` を自己申告で通す |
| `CANDIDATE-U-PLRET-014` | 完備 fixture (A: `transferred` + design 行き先 + `three-way`、B: `retired` + 理由 + `supersedes-two-sided`、C: `merged` + issue 行き先 + `three-way`)、削除 1 件。同 fixture の `plans[]` と `deletedPlanPaths` の並びを入れ替えた入力、および violation が複数出る壊し方 | 完備は `ok: true`。並びを変えても結果が同一で、violation は `path` 辞書順・同一 path は規則番号順 (L6 §4 末尾、post-1) | 完備でも落ちる (規則の過剰適用) / 入力順で出力が変わる |
| `CANDIDATE-U-PLRET-015` | 開発 repo の処分 JSON を実際に読み、`deletedPlanPaths` を `git ls-files docs/plans` の 1 件にして analyzer を呼ぶ。期待は JSON の `plans[]` から**テスト内で独立に数えた**値 (その 1 件の記録の欠落・未最終化・行き先の不備の有無) | `violations.length` と `ok` がその独立集計と一致する。最終化が進んでも (件数が変わっても) 式が成り立つ。`deletedPlanPaths` が空なら必ず `ok: true` | 実 repo で規則 1・2 が機能していない (件数が合わない) / 時点依存の定数を期待値に埋めている |
| `CANDIDATE-U-PLRET-016` | 一次インベントリ生成スクリプト `06_PLAN_DISPOSITION_FIRST_PASS.mjs` の `--write-json` を、temp にコピーした処分 JSON の `plans[]` に `not-finalized` 以外が 1 件ある状態で実行 / すべて `not-finalized` の状態で実行 | 前者は非 0 で終了し、JSON の bytes が実行前と同一 (L6 §9)。後者は従来どおり書き込める | 最終化済みの記録を `--write-json` が黙って上書きする |
| `CANDIDATE-U-PLRET-017` | `number: 999999` (実在しない issue 番号) の `issue` 行き先を含む完備 fixture。`gh` / network / `Date` を呼ぶと失敗する stub 環境で analyzer を 2 回呼ぶ | `ok: true` で、2 回の結果が一致し、外部呼び出し 0 回 (L6 invariant-2) | issue の実在を `gh` で確認する / 現在時刻・環境に依存する |
| `CANDIDATE-U-PLRET-018` | temp repo で base→head の差分が (a) `docs/plans/PLAN-X.md` の削除、(b) `docs/plans/` 外への rename、(c) `docs/plans/` 内の rename、(d) 追加のみ、(e) 変更のみ、(f) `docs/plans/PLAN-*.md` 以外 (README 等) の削除 | `loadPlanRetirementInput` の `deletedPlanPaths` は (a)(b) だけを含み (b) は旧 path。`headPlanPaths` は head の tree に残る PLAN。(c)(d)(e)(f) は削除に数えない | rename を削除と扱わない / 追加・変更を削除と誤認する / `headPlanPaths` を base の tree から作る |
| `CANDIDATE-U-PLRET-019` | `loadPlanRetirementInput` を処分 JSON と行き先文書を含む temp repo で呼ぶ | 呼び出し前後で処分 JSON・文書の bytes が同一 (L6 invariant-3)。参照された全 path が `fileHeadings` / `fileTexts` に入る (不在は `null`) | loader が JSON を整形・正規化して書き戻す / 参照 path の先読みを漏らし analyzer が不在と誤判定する |
| `CANDIDATE-U-PLRET-020` | violation 3 件の結果 (うち 2 件は同一 path) | `planRetirementMessages` が `path:reason` の 3 行を決定的な順で返す。空結果は空配列 (L6 §7) | 出力形式の変更 (`reason:path` 等) / reason の欠落 |
| `CANDIDATE-U-PLRET-021` | 削除 1 件 (PLAN X、完備)。削除されない PLAN の frontmatter の (a) `requires`、(b) `parent`、(c) `supersedes`、(d) `references` のいずれか 1 欄だけが X の `plan_id` または `docs/plans/<file>.md` を指す。欄ごとに別 fixture | 4 欄とも、参照元の path で `dangling_plan_reference` (L6 §4 規則 5)。X を指さない参照は落とさない | `references` など一部の欄を検査対象から落とす / path 形式か `plan_id` 形式のどちらかしか照合しない |
| `CANDIDATE-U-PLRET-022` | 削除 1 件 (X、完備)。設計文書 frontmatter の `plan:` 欄が (a) X の path、(b) 別の存続 PLAN の path、(c) 欄なし | (a) は設計文書の path で `dangling_plan_reference`、(b)(c) は落とさない | owning-plan 欄を検査しない / 欄の値の形式違いで取りこぼす |
| `CANDIDATE-U-PLRET-023` | 削除 1 件 (X、完備)。(a) 削除されない PLAN の本文中だけに X の PLAN ID の言及がある、(b) 削除される PLAN X 自身の frontmatter が X を指す (自己参照)、(c) 削除対象どうしの参照 (X と Y が両方削除され互いを `references` に持つ) | (a)(b)(c) すべて violation 無し。本文の言及は履歴参照として止めない (L6 §4 規則 5、§8) | 本文の PLAN ID を grep して落とす / 削除される側の参照元まで検査する |
| `CANDIDATE-U-PLRET-024` | 削除 1 件 (X)。X は `supersedes-two-sided`、`confirmedSupersededBy` の後継 Z が (a) head の tree に存在し削除されない、(b) head に存在しないが Z の記録が `transferred` で `design` の行き先を持ち規則 2・3 を満たす | (a)(b) とも終端を満たし violation 無し (L6 §4 規則 4) | 後継の存在を `confirmedSupersededBy` の件数だけで判定する / 非 PLAN で最終化済みの後継を拒否する |
| `CANDIDATE-U-PLRET-025` | 削除 1 件 (X)。`confirmedSupersededBy` の後継 Z が (a) head に存在せず、Z の記録は `not-finalized`、(b) Z の記録が `supersedes-two-sided` だけで行き先を持たない (連鎖が PLAN のまま続く)、(c) Z の記録が `retired` | (a)(b)(c) すべて `supersedes_chain_open` | 連鎖を再帰的に辿って PLAN どうしの link で閉じたことにする / `retired` の後継を終端に数える |
| `CANDIDATE-U-PLRET-026` | 削除 2 件 (X と後継 Z を同じ PR で削除)。Z の記録が (a) `merged` で `issue` の行き先を持ち規則 2・3 を満たす、(b) `not-finalized` | (a) は X の終端を満たし violation 無し、(b) は Z に `not_finalized`、X に `supersedes_chain_open` (L6 §4 規則 4 の (ii)) | 後継が削除対象だと存在扱いにして通す / 後継の最終化を見ない |

## 4. 既存 oracle への影響

既存の oracle の改訂表は無い。本 gate は PLAN が削除されるときだけ発火する新規の gate で、`merged-plan-status` / `plan-supersession` / 設計保護 gate の既存 oracle の入力・出力を変えない (L6 §8)。
