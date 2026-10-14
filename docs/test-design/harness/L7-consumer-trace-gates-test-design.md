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
本書はその §3 分岐、§5 読む文書、§6 表の固定と抽出、§7 trace 規則と空集合、§8 出力、§10 不変条件を検証する oracle を定義する。
共有の `docs/test-design/harness/L7-unit-test-design.md` には索引 (§consumer trace gate) だけを置き、本書が詳細の正本である。

この pair-freeze では候補 ID (`CANDIDATE-U-CTRACE-*`) だけを宣言する。
正式 ID `U-CTRACE-*` への 1:1 の昇格と Red のテスト (`it.fails`) は、src/ も scripts/ も含まない契約 PR + Red で入れる (`design-protection-diff-gate.md` §10.2)。実装 PR は `it.fails` を `it` に戻して Green にするだけで、本書には触れない。
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
| `CANDIDATE-U-CTRACE-001` | (a) 実 repo (harness layout) に G1-trace と G3-trace をかける。(b) temp の harness layout fixture で、harness 分岐の検査を 1 つずつだけ欠かせた 4 通りの入力を作る: (b1) L3 PLAN が `PLAN-L1-01/02/03` の requires を欠く、(b2) L1 screen-requirements §5.1 に画面へ対応しない BR が 1 件ある、(b3) L3 functional-requirements に見出し `### FR-99:` の FR を 1 件足し、`AC-FR-99-*` をどの文書 (L3 functional-requirements / business-detail / nfr-grade) にも置かない (L1 に `FR-L1-99` は置かない)、(b4) L1 NFR のうち 1 件が L3 nfr-grade に無い | (a) 現行の `analyzeG1Trace` / `analyzeG3Trace` と同じ `ok` と messages (`g1-trace - OK (business=…, screens=…, p0Fr=…, l3Plans=…)` の形)。`consumer column trace` を含まない。(b1)〜(b4) はそれぞれ `ok=false` で、対応する違反を 1 件だけ返す: (b1) L3 PLAN requires の欠落、(b2) orphan business、(b3) `orphanL3Fr = [FR-99]` (`src/lint/g3-trace.ts` の R2、FR→AC の検査)、(b4) orphan NFR | 実 repo を consumer 分岐へ流す ((a) が変わる) / harness 分岐の検査を 1 つでも落とす (落とした検査に対応する (b1)〜(b4) の行が `ok=true` になる。実 repo の正常文書だけでは削除を検出できないため (b) を置く) |
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
| `CANDIDATE-U-CTRACE-026` | 003 の fixture に `docs/plans/PLAN-L3-01-x.md` (`related_l1_screen` を含み `requires` を欠く) を置く。別に `docs/plans/` 自体が無い版も作る | 両方とも consumer 分岐で `ok=true` (`l3Plans` の検査をしない) | consumer 分岐で `missingL3Requires` を評価する |

## 4. Gate and scope fence

- 本書の oracle は consumer 分岐の G1-trace / G3-trace と、harness 分岐の挙動不変だけを扱う。layer pair gate、doctor、projection-writer、L1 第5章 非機能要求、L3 の ZIP-DOC-043 節は対象外 (設計文書 §11)。
- harness 分岐の挙動不変は 001 と、既存の `tests/g1-trace.test.ts` / `tests/g3-trace.test.ts` が無変更で green であることで確かめる。既存 oracle を再定義しない。
- consumer 分岐の PASS は、件数の下限を持たない列参照 trace の PASS である。OT-45 の PASS の証拠に流用しない (設計文書 §4)。
- 契約 PR + Red で `src/lint/consumer-trace.ts` がまだ無いために import が失敗して `it.fails` が成立しても、各規則の Red の証拠にならない。実装 PR は、候補ごとに規則を 1 本だけ殺す mutation を入れて Red になることを確かめ、そのログを §5 に残す。

## 5. Required evidence

実装 PR は次を残す。

- 各 candidate の Red→Green ログ (mutation を入れた Red の再現を含む)。
- 既存の `tests/g1-trace.test.ts` / `tests/g3-trace.test.ts` が無変更で green であること。改訂後の U-RCDEV-027 が green であること。
- typecheck / Biome、Linux / Windows / aggregate CI の run ID、exact HEAD、非著者 closing receipt digest。
