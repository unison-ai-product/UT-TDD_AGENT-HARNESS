---
title: "L7 pack sample product e2e test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/pack-sample-product-e2e.md
status: confirmed
issue: 1276
updated: 2026-10-23
---

# 見本 product 上で Pack の全 gate を流す E2E テスト設計 (issue #1276)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/pack-sample-product-e2e.md` である。本書はその §3 fixture、
§4 install phase、§5 / §6 verify phase と step の順序、§7 合否と失敗の出力、§9 DbC を検証する oracle を定義する。
ID は未実装の間 `CANDIDATE-U-PACKSAMPLE-NNN` とし、実装 PR で test が置かれた行を同番号の `U-PACKSAMPLE-NNN` へ
1:1 で昇格する。既存の `U-ST-PACKCANARY-*` / `U-RCDEV-*` / `CANDIDATE-U-PACKINV-*` (#1275) /
`CANDIDATE-U-CTRACE-*` (`consumer-trace-gates.md`) は再採番・再所有しない。共有の `L7-unit-test-design.md` には
索引を置かない (本書が正本)。

所有 test:

- source 側 (fixture と実 gate の in-process 実行): `tests/pack-sample-product-fixture.test.ts` (新規)
- runner 側 (`installSampleProduct` / `classifySampleProductRun` / step の順序): `tests/pack-canary-acceptance.test.ts`
  (既存。offline の fixture consumer と injected `run` で検証し、実 release は使わない)

## 2. 共通 fixture

- **実 fixture**: tracked の `tests/fixtures/sample-product/` (設計 §3) そのもの。source 側のテストは一時ディレクトリへ
  複写して使い、tracked の実体は書き換えない。
- **変異 fixture**: 実 fixture の複写を 1 軸だけ変えたもの。各行の「違反 / mutation」列が軸を指定する。
- **runner 側の stub**: `tar -tzf` / `tar -xOf` と `gate <G> --json` / lint の出力を injected `run` で返す。正常形は
  G1〜G14 が `applicable=true` / `passed=true`、G1 / G3 が `expected_totals` と同じ件数の
  `consumer column trace` 行を返し、lint 3 件が exit 0 を返す。

## 3. source 側の oracle

| ID | oracle | 違反 / mutation (Red になるべき変異) |
| --- | --- | --- |
| CANDIDATE-U-PACKSAMPLE-001 | 実 fixture に `validateSampleProductFixture` を掛けると `ok=true`、finding 0 件。manifest の `gates` のキーは `G1`〜`G14` のちょうど 14 個で、各 gate の `inputs` のキー集合は設計 §3.1 の入力クラスの表のその gate の行とちょうど一致し、各クラスの path 一覧は 1 件以上かつ全て fixture に実在する。fixture の `.ut-tdd/` 配下の file は全て設計 §4 の証跡 allowlist に一致し、G8〜G14 の各 `evidence` クラスは対応する証跡ディレクトリの file を指す | (m1) manifest から `G9` を消す → `fixture-manifest-invalid`。(m2) `G13.inputs.evidence` を空にする → `fixture-gate-input-missing:G13`。(m3) `G8.inputs.case-table` の path の file を消す → `fixture-gate-input-missing:G8:<path>`。(m4) `G7.inputs` から `impl-trace` を消す → `fixture-manifest-invalid`。(m5) fixture に `.ut-tdd/state/x.json` / `.ut-tdd/evidence/g8-integration/sub/x.json` を置く → それぞれ `fixture-path-invalid` |
| CANDIDATE-U-PACKSAMPLE-002 | 実 fixture の全 file が設計 §3.2 の検出表 7 行のどれにも一致せず、絶対 path を含まない。core 3 文書の ID 列は `RQ-` / `SC-` / `FN-` で始まる | 検出表の各行につき 1 変異: L2 画面一覧の `SC-001` を `PM-01` にする → `fixture-contaminated` (`harness-screen-id`)。参照セルに `docs/design/harness/L3-functional/business-detail.md` を書く → `fixture-contaminated` (`harness-design-root`)。他の 5 行も同様。fixture に `C:/work/x.md` を書く → `fixture-contaminated` (絶対 path)。L3 機能 ID を `F-001` にする → `fixture-namespace-violation` |
| CANDIDATE-U-PACKSAMPLE-003 | vmodel template のある fixture 文書は、見出し行の列と frontmatter のキー集合が `embeddedVModelTemplateAssets()` の対応 template と一致する | (m1) fixture の `#### 第4章 画面一覧` を `#### 第4章 画面` に変える → `fixture-template-drift`。(m2) template 側に見出しを 1 行足す (stub) → 同じ finding |
| CANDIDATE-U-PACKSAMPLE-004 | 実 fixture の複写を repo root として `evaluateStaticGate` を G1〜G14 に掛けると、全 gate が `applicable=true` / `passed=true` で、messages に設計 §7 の `throw-class` / `harness-value` の一致が 0 件。G1 / G3 の `consumer column trace` 行の件数が `expected_totals` と一致する (`classifySampleProductRun` に掛けて finding 0 件) | (m1) G1 の画面 ID 抽出を `(?:PM\|HM\|GD)-\d{2}` に固定する (Pack#10 / #971 の再現) → `gate-failed:G1` と `trace-total-mismatch:G1`。(m2) G3 が `docs/design/harness/L3-functional/business-detail.md` を必須で読む (Pack#11 / #972 の再現) → `throw-class:G3` と `harness-value:G3`。(m3) G1 の件数を出力から落とす → `trace-total-mismatch:G1` |
| CANDIDATE-U-PACKSAMPLE-005 | 入力感度 (入力クラス単位): 設計 §3.1 の表の (gate, 入力クラス) の組ごとに、実 fixture の複写から**そのクラスの入力だけ**を変えた版を作り、同じ gate を `evaluateStaticGate` で掛ける。他のクラスの入力は正常のまま残す (共有 path は file を消さず、そのクラスが読む部分だけを消す)。変異は 2 種: (a) 欠落 = そのクラスの file を消す、(b) 空集合 = file は残し、そのクラスが読む行を 0 件にする (core 表の data 行、case 表の行、証跡 JSON の行配列、`src/` の実装 file と test の citation)。file の有無だけで決まるクラス (`layer-pair` / `layer-pairs` / `coverage`) は (a) だけとする。`layer-pair` / `layer-pairs` の (a) は対の片側 (テスト設計) だけを消して作る (設計文書は `core-trace` / `impl-trace` の入力を兼ねるので残す)。`coverage` は (a) に加えて `total.lines.pct` の欠落を (b) とする。各版で次の全てを満たす: (1) `static_gate.passed=false`。(2) messages に、§3a の識別表でその入力クラスの検査に割り当てた失敗行が 1 件以上ある。(3) 同じ gate の他の入力クラスの失敗行が 0 件 (他クラスは正常のまま、という変異の前提の確認)。(4) 設計 §7 の `throw-class` の行が 0 件 (入力が無いことを throw で表すのも縮退の欠落とみなす) | (m1) G1 の trace 検査を「core 文書が無ければ成功」に変える → `core-trace` の (a) 版で layer pair は OK のため `passed=true` になり (1) で失敗。(m2) G7 の `analyzeImplPlanTrace` を「実装 file が 0 件なら ok」に変える → `impl-trace` の (b) 版で (1) か (2) で失敗。(m3) G3 の trace 検査が core 文書の欠落で throw する → (2) と (4) で失敗。(m4) 変異が他クラスも壊す (例: core 4 文書の file を消して L1 の layer pair も欠ける) → (3) で失敗 (検査自身の失敗理由を確かめていない変異を Green にしない) |
| CANDIDATE-U-PACKSAMPLE-006 | `git ls-files` から作った clean plan の `artifactPaths` に、fixture の全 tracked file がちょうど 1 回ずつ入る (tar で運ぶ前提の固定) | (m) `CLEAN_DENY_PATTERNS` に `^tests\/fixtures\/` を足す → fixture が artifact から落ち失敗 |
| CANDIDATE-U-PACKSAMPLE-007 | runner (`scripts/pack-canary-acceptance.mjs`) の検出表と throw-class の正規表現が、source 側テストの表と同じ値・同じ順序である。runner の証跡 allowlist のディレクトリ集合が、出荷する `docs/process/vmodel-contract.yaml` (clean Pack の `docs/process/` に入る版) の G8〜G14 の `evidence_manifest` の親ディレクトリ集合 (7 個) とちょうど一致する | (m1) runner の表から `harness-heading` を消す → `detector-table-drift`。(m2) runner の allowlist から `g14-operational` を消す → `evidence-dir-drift`。(m3) runner の allowlist に `state` を足す → `evidence-dir-drift` |

### 3a. 入力クラスの識別表 (005 が使う)

入力クラスの検査が出す失敗行を、messages の行の先頭 (または含む文字列) で識別する。表の値は所有 test の定数に置き、
実装 PR で `src/gate/static.ts` / `src/gate/right-arm-static.ts` / 各 lint の実際の文言と照合する (照合して文言が
違ったら、表を直すのではなく本書を改訂する)。

| gate | 入力クラス | 失敗行の識別 |
| --- | --- | --- |
| G1〜G6 | `layer-pair` | `g<n>-pair - violation` で始まる行 (`<n>` は gate 番号) |
| G1 | `core-trace` | `g1-trace - violation` で始まる行、または `consumer-trace-gates.md` §8 の G1 の失敗の形 |
| G3 | `core-trace` | `g3-trace - violation` で始まる行、または `consumer-trace-gates.md` §8 の G3 の失敗の形 |
| G7 | `layer-pairs` | `pair-freeze` の孤児・未 freeze の行、または `verification — G7 [L0-L7]` の未 freeze の行 |
| G7 | `impl-trace` | `impl-plan-trace` で始まる違反行 |
| G7 | `oracle-trace` | `oracle-test-trace` で始まる違反行 |
| G7 | `coverage` | `g7-coverage - violation` で始まる行 |
| G8〜G14 | `case-table` | `right-arm-static - violation:` の行で、`missing section` または `case rows` を含む |
| G8〜G14 | `evidence` | `right-arm-static - violation:` の行で、`evidence manifest missing under .ut-tdd/evidence/<dir>` または `missing row evidence` を含む |

## 4. runner 側の oracle

| ID | oracle | 違反 / mutation (Red になるべき変異) |
| --- | --- | --- |
| CANDIDATE-U-PACKSAMPLE-008 | install phase: tag が `AGENT_E2E_TAG` でないとき、検証済みの tar から `tests/fixtures/sample-product/` の file を取り出し、manifest 以外を consumer の同じ相対 path へ書き、その path だけを `git add` して commit する。commit は `ut-tdd.project.json` の commit の後、`createConsumerPlan` の前で、`consumer_head` に含まれる。evidence の `sample_product.files` は path 昇順で sha256 付き。`AGENT_E2E_TAG` では何もしない。**右腕証跡を含む正常 install**: tar に `tests/fixtures/sample-product/.ut-tdd/evidence/<dir>/sample-product.json` を G8〜G14 の 7 ディレクトリ分置くと、install は成功し、7 file が consumer の `.ut-tdd/evidence/<dir>/sample-product.json` に bytes 一致で書かれ、`git add` の argv に 7 path が明示で入り (`-f` なし)、`sample_product.files` に載る | (m1) tar に fixture が無い → `sample-product-unavailable`。(m2) tar 内に `tests/fixtures/sample-product/../x` / `tests/fixtures/sample-product/.git/config` / `tests/fixtures/sample-product/.ut-tdd/state/x.json` / `tests/fixtures/sample-product/.ut-tdd/evidence/g8-integration/sub/x.json` / `tests/fixtures/sample-product/.ut-tdd/evidence/unknown/x.json` の entry を置く → それぞれ `sample-product-path-invalid:<path>`。(m3) `git add -A` で commit する実装 → injected `run` の argv 検査で失敗。(m4) agent E2E tag でも複写する → 失敗。(m5) `.ut-tdd/` 始まりを一律に拒否する実装 → 正常 install の oracle で失敗 (右腕 gate の証跡を配置できない欠陥)。(m6) consumer に `.ut-tdd/evidence/g9-system/sample-product.json` を事前に置く → `sample-product-path-conflict:.ut-tdd/evidence/g9-system/sample-product.json` で失敗し、既存 file の bytes は変わらない。(m7) 証跡も文書と同じく上書きする実装 → (m6) で失敗 |
| CANDIDATE-U-PACKSAMPLE-009 | verify phase: fixture の file を 1 つ書き換えてから verify すると、gate を起動する前に `sample-product-drift:<path>` で失敗する | (m) drift 検査を外す → 書き換えた fixture で gate が起動し失敗 |
| CANDIDATE-U-PACKSAMPLE-010 | verify phase の transcript の label が `doctor-consumer-profile` → `delivery-inventory` → `sample-product-gate-G1` … `sample-product-gate-G14` → `sample-product-lint-g1-trace` → `sample-product-lint-g3-trace` → `sample-product-lint-vmodel` → `plan-authoring` の順に並ぶ。gate の label 集合は G1〜G14 とちょうど一致する。`delivery-inventory` の step を持たない版 (stub で外す) でも本 step は動き、`doctor-consumer-profile` の直後に来る | (m1) G13 の起動を消す → label 集合の不一致で失敗 (runner が gate を黙って飛ばす欠陥)。(m2) 本 step を `plan-authoring` の後に置く → 順序の assert で失敗。(m3) 本 step が `delivery_inventory_result` を読む実装 → 外した版で落ち失敗 |
| CANDIDATE-U-PACKSAMPLE-011 | `classifySampleProductRun` の単一軸変異: 正常形の出力から 1 軸だけ変えると、設計 §7 の code が対象の target でちょうど 1 種類出る。`output-invalid` (exit 2、JSON でない、`static_gate.passed` が文字列)、`gate-not-applicable` (`applicable=false`)、`gate-failed` (`passed=false`、lint exit 1)、`throw-class` (5 つの正規表現それぞれ)、`harness-value` (検出表 7 行それぞれ)、`trace-total-mismatch` (件数違い、行の欠落)。exit 1 で `static_gate.passed=true` (review tier だけの不合格) は finding 0 件。出力が 17 件でなければ `output-invalid` | (m1) `review.passed` を判定に使う → review だけの不合格で `gate-failed` が出て失敗。(m2) `applicable=false` を合格扱いにする → 失敗。(m3) 除外表を足して G7 を飛ばす → 17 件検査か G7 の変異で失敗 |
| CANDIDATE-U-PACKSAMPLE-012 | 失敗の出力: finding が 1 件以上なら evidence に `sample_product_result: { ok: false, findings }` を書いてから `sample-product-e2e:<件数>:<先頭 20 件の code:target>` で throw する。finding は `code`・`target`・`detail` の昇順。25 件の finding で message に 20 件だけ載り、件数は 25 | (m1) evidence を書く前に throw する → evidence の assert で失敗。(m2) 最初の 1 件で打ち切る → 件数 25 の assert で失敗 |

## 5. 実行手順と Red の扱い

1. 契約 PR (本書) の後、実装 PR は Red として `CANDIDATE-U-PACKSAMPLE-001〜012` を `it.fails` で先に置く。
2. 004 は、`consumer-trace-gates.md` の consumer 分岐の実装と、初回の実行で見つかる各 gate の欠陥の修正が
   main に入るまで Red のままでよい。004 / 005 の初回実行で `passed=false` になった gate は、gate ごとに Issue を
   起票し、除外表で Green にしない (設計 §7)。
3. 実 release での受入 (verify phase の本 step) は、fixture を含む新しい canary tag で行う。fixture を含まない既存の
   tag (`v0.2.0-canary.2` など) では `sample-product-unavailable` で失敗するのが正しい挙動である。

## 6. 完了条件

- [ ] `CANDIDATE-U-PACKSAMPLE-001〜012` が `U-PACKSAMPLE-001〜012` に 1:1 で昇格し、所有 test に置かれている
- [ ] 004 の 3 変異 (Pack#10 / #971、Pack#11 / #972、件数の欠落) と 005 の入力感度が、実 gate の上で Red を確認できる
- [ ] fixture を含む canary tag の verify phase で、`sample_product_result.ok=true` の evidence が残る
