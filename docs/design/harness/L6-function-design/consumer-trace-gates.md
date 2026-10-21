---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_consumer_trace_gates
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-971-consumer-trace-gates.md
---

> **L6 contract marker**: G1-trace / G3-trace の consumer 分岐 (`analyzeConsumerG1Trace(reader) => ConsumerTraceResult` / `analyzeConsumerG3Trace(reader) => ConsumerTraceResult`、出力の形は §8) は unit-test-granularity contract である。DbC pre/post/invariant は §10 にまとめる。oracle の索引は共有の `docs/test-design/harness/L7-unit-test-design.md` (§consumer trace gate) に置き、詳細 (CANDIDATE-U-CTRACE-001〜026) は専用の `docs/test-design/harness/L7-consumer-trace-gates-test-design.md` が固定する。

# consumer trace gate (G1-trace / G3-trace の consumer 分岐) — 関数設計 (issue #971 / #972 / #880)

## 1. 目的

consumer (clean Pack を入れた製品 repo) で `ut-tdd gate G1` / `G3` と `ut-tdd plan lint --gate G1-trace` / `G3-trace` を意味のある検査にする。
現状には次の 3 つの欠陥がある。

- #971: G1-trace は画面 ID を `(?:PM|HM|GD)-\d{2}` に固定して抽出する (`src/lint/g1-trace.ts` の `screenIds`)。consumer の画面 ID (例: `SC-001`) を読めない。
- #972: G3-trace は harness 専用の `docs/design/harness/L3-functional/business-detail.md` と `nfr-grade.md` を必須として読む (`src/lint/g3-trace.ts` の `loadDocs`)。consumer のテンプレートにはこの文書が無い。G1-trace も harness 専用の `business-requirements.md` / `screen-requirements.md` を必須として読む (`src/lint/g1-trace.ts` の `loadG1TraceDocs`)。
- #880: G1-trace は全集合が空でも `passed=true` を返す (`g1TraceOk` は孤児の件数しか見ない)。

本書は control が決定した方式 (advisor `claude-fable-5-1`、design。A1 / B2 / C1) を関数契約に落とすだけで、方式を変えない。実装は v4 工程 ③ で行う。本 PR は契約だけを freeze する。

## 2. 入口と契約の置き場所

契約は lint 層に置く。gate と plan lint の 2 つの入口が、同じ lint 関数に到達するからである。

| 入口 | 経路 |
|---|---|
| `ut-tdd gate G1` / `G1-TRACE` | `src/gate/static.ts:273` → `lintPlanWithGate(undefined, repoRoot, "G1-trace")` |
| `ut-tdd gate G3` / `G3-TRACE` | `src/gate/static.ts:283` → `lintPlanWithGate(undefined, repoRoot, "G3-trace")` |
| `ut-tdd plan lint --gate G1-trace` / `G3-trace` | `src/cli.ts` の `plan lint` → `lintPlanWithGate(path, cwd, gate)` |
| 共通の到達点 | `src/plan/lint.ts:1196-1218` (`lintPlanGate` 内) → `analyzeG3Trace(loadDocs(repoRoot))` / `analyzeG1Trace(loadG1TraceDocs(repoRoot))` |

- 分岐 (§3) は `src/plan/lint.ts` の上記 2 つの handler から呼ぶ lint 関数の中に置く。`src/gate/static.ts` には置かない。gate 側にだけ置くと plan lint 側が旧挙動のまま残るからである。
- gate の結果は、trace の結果と layer pair gate (`evaluateLayerPairGate(..., "L1" | "L3", ...)`) の結果を `combineStaticGates` で合わせたものである。本契約が「2 つの入口で同じ結果」と言うのは trace の部分 (ok と messages) についてであり、layer pair gate は本契約の範囲外である。

## 3. 分岐の規則 (A1)

分岐は design root の layout だけで決める。既存の G9 / G10 の分岐 (`src/gate/static.ts:316`、`:338` の `resolveDesignRoot(repoRoot) === "docs/design/harness"`) と同じ判定を使う。

- `resolveDesignRoot(repoRoot) === "docs/design/harness"` なら **harness 分岐**、それ以外なら **consumer 分岐**。`resolveDesignRoot` は `docs/design/harness` が存在すればそれを優先する (`src/shared/design-root.ts` の `DESIGN_ROOT_CANDIDATES` と `firstExistingRoot`)。
- 分岐は文書の中身・PLAN の有無・profile では決めない。

### 3.1 harness 分岐 (A4 G1 退役境界)

consumer 分岐の導入に伴う変更対象外である点は維持する。ただし A4 (#1168) では PLAN 専用の G1 検査を退役する。残す harness G1 契約は BR / UX / P0 FR と画面の trace だけであり、L3 PLAN の読み込みや `requires` の欠落検査は契約しない。L1→L3 の全件降下は、PLAN を使わない別の検査 (§13、issue #1196) が持つ。G1-trace の PLAN 専用判定を退役した代わりに降下の保証を G1 側へ戻すことはしない。

- G1-trace: screen-requirements §5.1 / §5.3 / §5.5 の BR / UX / P0 FR ↔ 画面 trace、`(?:PM|HM|GD)-\d{2}` の画面 ID。BR / UX 13 件・15 画面・P0 FR 19 件の全件条件は OT-45 R1〜R3 で保持する。PLAN を読み込まず、`l3Plans` / `missingL3Requires` を API または message に出さない。
- G3-trace: L1 FR-L1 → L3 FR (carry 宣言を含む)、L3 FR → AC (business-detail の `AC-FR-BR21-*` を含む)、AC → AT、AT-FR → AC の逆引き、L1 NFR 15 件 → L3 nfr-grade。
- harness G1 の件数・全件保証は OT-45 (`docs/test-design/harness/L14-operational-test-design.md:87`) の R1〜R3 が持つ。harness 分岐には §7 の空集合規則を足さない。
- 既存の抽出関数 (`extractL3FrIds` / `extractAcIds` / `extractAtIds` / `extractL3NfrIds`) は `src/gate/right-arm-static.ts:3` からも使われている。本契約はこれらの挙動を変えない。

### 3.2 consumer 分岐

consumer 分岐は consumer のテンプレート catalog が用意する core 文書 (§4) だけを読む。harness 専用の文書 (business-requirements / screen-requirements / nfr / business-detail / nfr-grade) は、存在しても読まない。

## 4. 同じ gate 名の 2 つの意味

consumer 分岐の G1 / G3 は、表の列の参照 trace である。harness の OT-45 (BR / UX 13 件、15 画面、P0 19 件の件数を伴う業務 ⇔ 画面の双方向 trace) とは別の保証である。同じ gate 名で 2 つの意味を隠さないため、次のように区別する。

| 分岐 | G1-trace の保証 | G3-trace の保証 |
|---|---|---|
| harness | OT-45 の R1〜R3 (BR / UX 13 件・15 画面・P0 FR 19 件の業務 ⇔ 画面 trace) | L1 FR-L1 → L3 FR → AC → AT と L1 NFR → L3 nfr-grade の孤児 0 |
| consumer | §6 の T1 / T2 (L1 要求の展開先と L2 画面の関連機能が実在する) と §7 の空集合拒否 | §6 の T3 / T4 (L3 機能のトレース元と L12 テストのトレース元が実在する) と §7 の空集合拒否 |

- 出力の 1 行目に分岐を書く (§8)。consumer の PASS を harness の OT-45 の PASS と読み違えないためである。
- consumer 分岐は件数の下限 (13 / 15 / 19) を持たない。持つのは「必須集合が空でない」ことだけである。

## 5. consumer 分岐で読む文書

読む文書は `docs/governance/vmodel-document-catalog.md` §1 の core 行に限る。4 行とも `requirement_class=core`、`default_status=required`、`profile_controlled=false` である。

| `doc_type_id` | catalog の `authoring_source_path` | consumer layout での path | テンプレート | 読む gate |
|---|---|---|---|---|
| `DOC-L1-REQUIREMENTS` | `docs/design/harness/L1-requirements/functional-requirements.md` | `docs/design/L1-requirements/functional-requirements.md` | `docs/templates/vmodel/L1-requirements.md` | G1、G3 |
| `DOC-L2-SCREEN` | `docs/design/harness/L2-screen/screen-list.md` | `docs/design/L2-screen/screen-list.md` | `docs/templates/vmodel/L2-screen-list.md` | G1、G3 |
| `DOC-L3-FUNCTIONAL` | `docs/design/harness/L3-functional/functional-requirements.md` | `docs/design/L3-functional/functional-requirements.md` | `docs/templates/vmodel/L3-functional-requirements.md` | G1、G3 |
| `DOC-L12-ACCEPTANCE` | `docs/test-design/harness/L12-acceptance-test-design.md` | `docs/test-design/L12-acceptance-test-design.md` | `docs/templates/vmodel/L12-acceptance-test-design.md` | G3 |

- path は catalog の `authoring_source_path` を `resolveAuthoringSourcePath(repoRoot, path)` で consumer layout へ写して得る。setup がテンプレートを置く先も同じ写像である (`src/setup/vmodel-template-writer.ts` の `loadTemplateSources`)。テンプレート file と `doc_type_id` の対応は `docs/templates/vmodel/README.md` §1 による。
- 読んだ文書の frontmatter `doc_type_id` が表の値と一致することを確かめる。一致しなければ `doc_type_mismatch:<doc_type_id>` とする。frontmatter で文書を同定する先例は G10 の `l2ScreenIds` (`src/gate/right-arm-static.ts:618`) である。
- 文書が無いときは fail-close にし、理由 `missing_core_doc:<doc_type_id>` を返す。`not_applicable` や skip で green に見える結果は返さない。4 文書とも `profile_controlled=false` で、profile で外せないからである。
- 文書の読み取りは注入可能な reader (`(relativePath) => string | undefined`) を通す。テストで、harness 専用の文書が一度も要求されないことを確かめるためである (テスト設計 CANDIDATE-U-CTRACE-019)。

## 6. 表の固定と ID の抽出 (B2)

ID は prefix を仮定せずに、表の列から取る。表は `doc_type_id` + 章見出し + 必須列名で同定する。G10 の `l2ScreenIds` と `REQUIRED_L2_SCREEN_COLUMNS` (`src/gate/right-arm-static.ts:192`、`:615-637`) と同じ方式である。

### 6.1 固定する見出しと列

| `doc_type_id` | 章見出し (行全体の完全一致) | 必須列 (全列) | ID 列 | 参照列 | テンプレートの行 |
|---|---|---|---|---|---|
| `DOC-L1-REQUIREMENTS` | `#### 第4章 機能要求一覧` | `要求ID` `要求名` `要求内容` `優先度` `展開先` | `要求ID` | `展開先` | `L1-requirements.md:50`、`:54` |
| `DOC-L2-SCREEN` | `#### 第4章 画面一覧` | `画面ID` `画面名称` `概要` `関連機能` `ロール` | `画面ID` | `関連機能` | `L2-screen-list.md:21`、`:23` |
| `DOC-L3-FUNCTIONAL` | `##### 3-1 機能一覧` | `機能ID` `機能名` `概要` `ロール` `トレース元` | `機能ID` | `トレース元` | `L3-functional-requirements.md:53`、`:55` |
| `DOC-L12-ACCEPTANCE` | `#### 第3章 テストケース一覧` | `テストID` `分類` `テスト項目` `検証内容/手順` `期待結果` `トレース元` | `テストID` | `トレース元` | `L12-acceptance-test-design.md:49`、`:53` |

- L2 の必須列は `REQUIRED_L2_SCREEN_COLUMNS` と同じ 5 列である。consumer trace はこの定数を共有して使い、別の定義を作らない。
- 必須列は全列とする。テンプレートの見出しか列名を 1 つでも変えると、表を同定できずに赤になる (§6.2)。これが列の freeze である。

### 6.2 表の読み取り規則

- 章の範囲は、見出し行 (前後の空白を除いて完全一致) の次の行から、同じかそれより浅い見出し (`#` の数が同じか少ない行) の直前までとする。範囲の外の表は読まない。L2 テンプレートの `diagrams.yaml` 節にある `SC-001 サインアップ` などのラベル (`L2-screen-list.md:47-55`) は範囲の外なので ID に数えない。
- 範囲の中で、必須列を全て含む最初の表の header 行を使う。列の順序は問わず、余分な列は許す (`l2ScreenIds` と同じ `every(column => cells.includes(column))`)。
- header 行の次の区切り行を飛ばし、`|` で始まらない行の直前までをデータ行とする。セルの分割は `tableCells` (`src/gate/right-arm-static.ts:201`) と同じ規則を使う。
- 見出しか header 行が見つからなければ、理由 `required_table_missing:<doc_type_id>:<章見出し>` を返す。空集合として扱わない。
- ID セルの値は前後の空白を除いた文字列そのものである。値が空か `<` で始まる行 (placeholder の `<記入>` など) は除外する。先例は `src/gate/right-arm-static.ts:633` (`if (id && !id.startsWith("<"))`) である。

### 6.3 参照セルの分解

- 参照セルは `,` `、` `/` `・` と空白で token に分ける。`<` で始まる token は placeholder として捨てる。
- 範囲表記 `X〜Y` / `X～Y` を展開する。先例は `src/lint/g3-trace.ts:116` の `extractL3CarryFrL1Ids` (`FR-L1-21〜35` を 21〜35 に展開) である。consumer では prefix を仮定しないので、次のように一般化する。
  - `X` を「末尾の数字列 `d` とそれより前の prefix `p`」に分ける。`Y` は数字列だけ、または同じ prefix `p` を持つ ID とする。
  - `d` から `Y` の数字までを展開し、各値を `d` の桁数で 0 埋めする (`SC-001〜012` は `SC-001`〜`SC-012`)。g3-trace の `padStart(2, "0")` (`src/lint/g3-trace.ts:124`) は harness の 2 桁 ID 専用であり、consumer 分岐では使わない。
  - `X` に数字列が無い、prefix が違う、終わりが始まりより小さい場合は、理由 `invalid_range:<doc_type_id>:<token>` を返す。

## 7. trace 規則と空集合 (B2 / C1)

### 7.1 trace 規則

集合の記号: `R` = L1 の `要求ID`、`S` = L2 の `画面ID`、`F` = L3 の `機能ID`、`T` = L12 の `テストID`。

| 規則 | gate | 内容 | 参照先 | テンプレートの根拠 |
|---|---|---|---|---|
| T1 | G1 | 各 L1 要求の `展開先` の token が全て参照先に実在する | `S ∪ F` | 第4章の注記「各要求は要件定義の機能要件(F-xxx)へ展開」(`L1-requirements.md:52`) |
| T2 | G1 | 各 L2 画面の `関連機能` の token が全て参照先に実在する | `R ∪ F` | 第4章 画面一覧の `関連機能` 列 (`L2-screen-list.md:23`) |
| T3 | G3 | 各 L3 機能の `トレース元` の token が全て参照先に実在する | `R` | 3-1 機能一覧の `トレース元` 列 (`L3-functional-requirements.md:55`) |
| T4 | G3 | 各 L12 テストの `トレース元` の token が全て参照先に実在する | `R ∪ S ∪ F` | 第3章の注記「トレース元列で設計工程まで追跡可能」(`L12-acceptance-test-design.md:51`) |

- 参照先に無い token は `dangling_reference:<doc_type_id>:<行の ID>:<列名>:<token>` とする。
- placeholder を捨てた後に token が 0 個の行は `missing_reference:<doc_type_id>:<行の ID>:<列名>` とする。参照の無い行を孤児として扱う harness の規則 (`g1-trace.ts` の `orphan*` は trace の件数 0 を孤児とする) と同じ扱いである。
- テンプレートに列が無い規則は作らない。たとえば「全 L3 機能が L12 テストで被覆される」は、L3 側に対応テストの列が 3-1 機能一覧に無いので本契約に含めない (§11)。

### 7.2 空集合 (C1、#880)

consumer 分岐では、必須集合が空なら違反とし、理由 `empty_required_set:<doc_type_id>:<列名>` を返す。

| 集合 | 理由 | gate |
|---|---|---|
| `R` (L1 要求) | `empty_required_set:DOC-L1-REQUIREMENTS:要求ID` | G1、G3 |
| `S` (L2 画面) | `empty_required_set:DOC-L2-SCREEN:画面ID` | G1 |
| `F` (L3 機能) | `empty_required_set:DOC-L3-FUNCTIONAL:機能ID` | G1、G3 |

- placeholder 行だけのテンプレートをそのまま置いた状態は、3 集合とも空なので赤になる。
- consumer 分岐は PLAN を読み込まず、PLAN 件数・`requires` を G1 の結果に含めない。harness 分岐でも A4 により G1 は PLAN を読み込まず、`l3Plans` / `missingL3Requires` を返さない (§3.1)。
- harness 分岐の非空の保証は OT-45 が持ち、本節は harness 分岐に適用しない。

## 8. 出力

consumer 分岐の lint 関数は次を返す。`src/plan/lint.ts` の handler は既存と同じく `{ ok, messages }` に変換する。

| field | 内容 |
|---|---|
| `branch` | `"consumer"` (harness G1 は §3.1 の PLAN 由来の項目だけを除き、その他の結果型は維持する。harness G3 の結果型は現行のまま) |
| `violations` | §5〜§7 の理由文字列の配列。辞書順で全件返し、最初の 1 件で打ち切らない |
| `totals` | `requirements` / `screens` / `functions` (G1)、`requirements` / `functions` / `tests` (G3) の件数 |

- `ok` は `violations` が 0 件のときだけ `true`。
- message は、OK なら `g1-trace - OK (consumer column trace: requirements=<n>, screens=<n>, functions=<n>)`、違反なら `g1-trace - violation (consumer column trace): <理由>; <理由>...`。G3 も同じ形で `g3-trace` とする。`consumer column trace` を必ず含め、harness の OT-45 と区別する (§4)。
- A4 後の harness G1 が OK の場合、message は `g1-trace - OK (business=<n>, screens=<n>, p0Fr=<n>)` とする。現 repo での実例は `g1-trace - OK (business=13, screens=15, p0Fr=19)`。PLAN 由来の件数は含めない。既存 oracle `tests/gate-static.test.ts:53` / `tests/pack-canary-acceptance.test.ts:2017` の期待と `scripts/pack-canary-acceptance.mjs:215` の parser はこの形式へ追従し、parser は business / screens / p0Fr の各件数を引き続き `>=1` とする。A4 で退役する PLAN 専用判定を除き、BR / UX・画面・P0 FR の orphan fail-close、G3、共有 gate serialization の形式と合否は変更しない。
- 読み取り例外を「required docs could not be read」に丸めない。core 文書の欠落は §5 の `missing_core_doc` で返す。

## 9. 実装方式

- 新規 `src/lint/consumer-trace.ts` に、表の抽出 (§6)、規則 (§7)、`analyzeConsumerG1Trace(reader)` / `analyzeConsumerG3Trace(reader)` を純粋関数として置く。
- `src/plan/lint.ts` の G1-trace / G3-trace の handler で §3 の分岐を行う。harness 分岐は現行の `analyzeG1Trace(loadG1TraceDocs(repoRoot))` / `analyzeG3Trace(loadDocs(repoRoot))` をそのまま呼ぶ。
- `REQUIRED_L2_SCREEN_COLUMNS` と `tableCells` は `src/gate/right-arm-static.ts` から export して共有する (挙動は変えない)。
- harness の抽出関数 (`extractG1*` / `extractFrL1Ids` など) は consumer 分岐で使わない。prefix 固定の正規表現を持つからである。

### 9.1 既存 oracle との衝突 (U-RCDEV-027)

`docs/test-design/harness/L7-release-consumer-dev-start-test-design.md:91` の U-RCDEV-027 と、その実装 `tests/release-consumer-gates.test.ts` の `writeConsumerGateFixture` は、consumer layout に harness 専用の文書 (business-requirements / screen-requirements / business-detail / nfr-grade) と harness 形式の ID (`**FR-L1-01**`、`PM-01`) を置いて G1 / G3 を green にしている。(vi) は `required doc not created: docs/design/harness/L1-requirements/business-requirements.md` を期待している。

本契約の consumer 分岐では、この fixture は §7.2 で赤になり、(vi) の message は出なくなる。U-RCDEV-027 の期待 (test-design の行) は本契約と同じ PR で改訂した (`L7-release-consumer-dev-start-test-design.md` の U-RCDEV-027 行)。`tests/release-consumer-gates.test.ts` の fixture の改訂は、設計書保護 diff gate の運用 (`design-protection-diff-gate.md` §10.2) に従い、工程 ③ の src を含まない契約 PR + Red で行う。実装 PR で test-design を書き換えない。

## 10. 不変条件 (DbC)

| contract point | 不変条件 |
|---|---|
| pre | `repoRoot` は directory である (既存 `evaluateStaticGate` の検査) |
| post (分岐) | 分岐は `resolveDesignRoot(repoRoot)` だけで決まる。A4後の harness G1 は PLAN を読み込まず、`l3Plans` / `missingL3Requires` を API / message に含めない。BR / UX / P0 FR ↔ 画面 trace は本契約どおり fail-close し、件数条件は OT-45 R1〜R3 が担う。harness G3 の結果と messages は変更しない |
| post (読み取り) | consumer 分岐は §5 の 4 文書 (G1 は L1 / L2 / L3、G3 は 4 つ全て) だけを要求する。harness 専用の文書を要求しない |
| post (fail-close) | core 文書の欠落、`doc_type_id` の不一致、表の欠落、範囲表記の不正、必須集合の空は、いずれも `ok=false` |
| post (trace) | §7.1 の各規則の違反 1 件 (token 1 個または参照 0 個の行 1 件) につき理由 1 件 |
| invariant (prefix 非依存) | ID の抽出と照合は prefix に依存しない。ID の文字列を変えても、列の位置関係が同じなら結果は変わらない |
| invariant (入口の一致) | 同じ repo に対して、gate と `plan lint --gate` の trace 部分の `ok` と messages は一致する |
| invariant (読み取り専用) | lint は文書を書き換えない |
| invariant (降下検査の読み取り) | 降下検査 (§13) は、consumer 分岐では §5 の文書だけを読む。harness 分岐では、§13.2 の L1 / L3 文書に加え、除外台帳を持つ本設計文書 (`docs/design/harness/L6-function-design/consumer-trace-gates.md`) を 1 path 読む。上の「harness 専用の文書を要求しない」は consumer 分岐に限る |

## 11. 範囲外と後続

- doctor の文書 lint。doctor の source 系 profile は source 専用であり (`src/doctor/profiles.ts:176-185` の `source-full` は `sourceOnly: true`)、consumer profile は toolchain と setup-smoke だけである (`:204-221`)。
- harness 固定 path を持つ他の箇所 (後続の issue で扱う):
  - `src/state-db/projection-writer.ts:2569` の画面 projection (`docs/design/harness/L2-screen/screen-list.md` 固定)。
  - `src/lint/l14-close-audit.ts:136`、`src/vmodel/lint.ts:278`、`src/task/proposal-document-packs-core.ts:24` の screen-list path。
- L1 第5章 非機能要求 (`L1-requirements.md:59-63`、`要求ID` と `展開先` を持つ) の trace。本契約は第4章 機能要求だけを扱う。
- L3 テンプレートの ZIP-DOC-043 節 (第2章 要求一覧の `展開先(要件)`、第3章 要件一覧の `トレース元` / `対応テスト`、`L3-functional-requirements.md:167-183`) の trace。
- ID の重複検査、L3 機能のテスト被覆 (逆方向)、L12 の空集合。
- consumer の setup guide の文言。

## 12. 根拠

- issue #971 / #972 / #880 と control の決定 (advisor `claude-fable-5-1`、design。A1 / B2 / C1)。
- `docs/governance/vmodel-document-catalog.md` §1 と `docs/templates/vmodel/` の 4 テンプレート。
- G9 / G10 の harness / consumer 分岐の先例 (`src/gate/static.ts:316`、`:338`、`src/gate/right-arm-static.ts:192`、`:615-637`)。

## 13. L1 から L3 への降下検査 (issue #1196)

### 13.1 目的と既存検査との境界

L1 の BR / UX / FR / 画面の ID が 1 件でも L3 の設計文書に現れなくても、G1 は通る。この穴は A4 (#1168) の前からあった。BR から L3 への降下は、PLAN の `requires` を見る `missingL3Requires` を通してしか確かめられておらず、L1 の ID が L3 の設計文書に降りることは一度も直接には確かめられていない。A4 が PLAN 専用の判定を退役しても保証は減らないが、この穴を埋める検査は `analyzeG1Trace` の側に無いままである。本節は降下を確かめる検査 (`analyzeL1L3Descent`) の契約である。方式は既存の検査を再利用し、新しい ID の抽出器を作らない (最小実装)。

| 検査対象 | 降下の検査 | 担当 |
|---|---|---|
| FR-L1 (51 件、P0 は 19 件) | L1 から L3 への active obligation | 既存の `descent-obligation` (doctor hard gate)。本節では再実装しない |
| BR / UX (13 件) | L3 の設計文書での引用 | 本節 (§13.2〜§13.7) |
| 画面 (PM / HM / GD、15 件) | L3 の設計文書での引用 | 本節 (§13.2〜§13.7) |
| consumer の要求 / 画面 | L3 機能表での引用 | 本節 (§13.8) |

- FR-L1 の降下は `src/lint/descent-obligation.ts` の `generateObligations` が `DEFAULT_DESCENT_ADJACENCY` の L1 から L3 の規則で持つ。本節の検査は FR を二重に数えない。実 repo で FR の降下が 0 件欠落であることは、テスト設計の `CANDIDATE-U-CTRACE-033` が実 repo に対して固定する。
- 本検査は `analyzeG1Trace` の結果型と message を変えない。G1 の OK message の 3 件形式 (§8) もそのままである。

### 13.2 入力 (harness 分岐)

- L1: `docs/design/harness/L1-requirements/business-requirements.md` から BR / UX、`docs/design/harness/L1-requirements/screen-requirements.md` から画面。抽出は `src/lint/g1-trace.ts` の `extractG1BusinessIds` と `extractG1ScreenIds` をそのまま呼ぶ。ID の形 (`BR-NN` / `UX-NN` / `PM|HM|GD-NN`) を本節で再定義しない。
- L3: `docs/design/harness/L3-functional/` の `*.md` のうち `README.md` と `roadmap.md` を除く 5 文書 (`functional-requirements.md` / `business-detail.md` / `nfr-grade.md` / `screen-functional.md` / `upstream-schedule-reconciliation.md`)。`README.md` は索引、`roadmap.md` は検証の工程表であり、設計の降下先ではない。
- 画面の ID 集合は harness 分岐では現行の `PM|HM|GD` 固定のままである。#971 の consumer の画面 ID は §13.8 で扱う。

### 13.3 降下したとみなす条件

- ID が L3 の対象文書のどれかに、単独の ID として 1 回以上現れること。照合は単語境界つきの完全一致で行い、`BR-1` と `BR-10` を取り違えない。単語境界だけでは `BR-01〜05` の `BR-01` に一致してしまう (`〜` は単語を構成しない文字) ので、次の照合規則を本節が持つ: ID の出現の直後が `〜` / `～` / `~` である場合 (範囲の先頭) と、範囲の末尾側の ID は、引用に数えない。
- `BR-01〜05` のような範囲表記は、範囲の端点も途中も降下に数えない。`descent-obligation` が範囲展開だけに由来する trace key を薄い被覆として扱う方針と揃える。範囲の裏にある ID は、単独の引用か除外台帳 (§13.5) で扱う。
- 現れる場所は問わない。表のセルか本文かは区別しない (§13.9 の決定 DEC-5)。
- 引用が現れる文書が `status: placeholder` / `park` の場合は数えない。

### 13.4 出力と fail-close

`analyzeL1L3Descent(reader)` は次を返す。`reader` は §5 と同じ注入可能な読み取り関数である。

| field | 内容 |
|---|---|
| `branch` | `"harness"` または `"consumer"` |
| `violations` | 理由文字列の配列。辞書順で全件を返し、最初の 1 件で打ち切らない |
| `totals` | 検査した件数 (`br` / `ux` / `screens`、consumer は `requirements` / `screens`) |

違反の理由は次のとおり。1 件の欠落につき 1 件を返す。

| 理由 | 条件 |
|---|---|
| `l3_descent_missing:<kind>:<id>` | L3 に降りていない ID (`kind` は `br` / `ux` / `screen`) |
| `empty_l1_set:<kind>` | L1 から取れた ID 集合が空 (空集合を PASS にしない。§7.2 と同じ考え方) |
| `missing_l3_docs` | L3 の対象文書が 1 本も読めない |
| `exclusion_invalid:<id>:<列名>` | 除外台帳の行に必須列が欠ける |
| `exclusion_stale:<id>` | 除外された ID が、L1 に存在しない、または L3 に既に降りている |

- `ok` は `violations` が 0 件のときだけ `true`。
- message は、OK なら `l1-l3-descent - OK (br=<n>, ux=<n>, screens=<n>, excluded=<n>)`、違反なら `l1-l3-descent - violation: <理由>; <理由>...`。
- 読み取り例外を丸めない。L1 文書が無いときは `missing_core_doc:<doc_type_id>` ではなく `required doc not created: <path>` を harness の既存形式のまま返す。

### 13.5 除外の宣言と退役 ID

- 退役した ID は、L1 の抽出対象から外れていれば検査対象にならない。例: `screen-requirements.md` の旧 `SCR-NN` は `extractG1ScreenIds` が拾わないので対象外である。
- 意図的に L3 へ降ろさない現役の ID は、下の除外台帳に 1 行ずつ書く。宣言先は本設計文書であり、PLAN・`src/` の許可リスト・テストの fixture に置かない。

| 除外 ID | 種別 | 理由 | 解除条件 | owner |
|---|---|---|---|---|
| (現在 0 件) | | | | |

- 検査は本節の台帳の表を `除外 ID` `種別` `理由` `解除条件` `owner` の見出しで同定して読む。5 列のどれかが空の行は `exclusion_invalid` とする。先例は `descent-obligation` の `validDefer` (解除条件と owner が空の defer を免責しない) である。
- 台帳の行が L1 に存在しない ID、または L3 に既に降りている ID を指すときは `exclusion_stale` とする。台帳が腐って除外の根拠が消えるのを止める。
- 台帳に行を足す変更は設計文書の変更であり、設計書保護 diff gate (`design-protection-diff-gate.md` §10.2) と非著者の review の対象になる。

### 13.6 現状の測定値と Green の前提

契約 PR の時点 (HEAD `a01d2d680`) で、L3 の対象 5 文書に対して測定した値。

| 集合 | 件数 | L3 に降りていない件数 | 降りていない ID |
|---|---|---|---|
| BR | 10 | 7 | `BR-01` `BR-02` `BR-03` `BR-04` `BR-05` `BR-06` `BR-07` |
| UX | 3 | 2 | `UX-02` `UX-03` |
| 画面 | 15 | 0 | なし |
| FR-L1 (参考、既存 `descent-obligation` の範囲) | 51 | 0 | なし |

- `BR-01` は `nfr-grade.md` の範囲表記 `BR-01〜05` にしか現れず、§13.3 では降下に数えない。範囲を数える場合の欠落は BR 2 件 (`BR-06` `BR-07`) と UX 2 件だが、範囲は数えないと決めた (§13.9 の決定 DEC-2)。
- 実装の Green より前に、この 9 件を (a) L3 の設計文書へ単独の ID で降ろす、または (b) §13.5 の台帳へ理由つきで除外する、のどちらかで 0 件にする。実装側に許可リストを置いて通さない。(a)(b) のどちらにするかは ID ごとの設計判断であり、本契約 PR では決めない。
- 測定は 1 回限りの使い捨て script で行った。lint 本体の出力と照合するのは `CANDIDATE-U-CTRACE-033` の実 repo テストである。

### 13.7 実装方式

- 新規 `src/lint/l1-l3-descent.ts` に、`analyzeL1L3Descent(reader)` を純粋関数として置く。L1 の ID 抽出は `extractG1BusinessIds` / `extractG1ScreenIds` を呼び、consumer の表の抽出は §9 の `src/lint/consumer-trace.ts` の関数を呼ぶ。新しい ID の抽出器は追加しない。範囲表記を引用に数えない照合規則 (§13.3) は本節が持つ。
- FR-L1 は呼ばない (§13.1)。
- 入口の配線は G1-trace の追加の規則とする (§13.9 の決定 DEC-1)。`src/plan/lint.ts` の G1-trace handler が `analyzeG1Trace` に続けて `analyzeL1L3Descent` を呼び、§13.4 の `l1-l3-descent - ...` の message を別の行として足す。`g1-trace - OK (...)` の行は変えない。doctor の full profile は `checkPlanTraceGate(root, "G1-trace")` で G1-trace を呼ぶので、harness では doctor からも同じ検査に届く。gate-static の基準となる message 配列は 1 行増える。その更新は実装 PR の範囲である。

### 13.8 consumer の ID 体系 (#971 / #972)

consumer 分岐は prefix を仮定せず、§5〜§6 の表の列から ID を取る。降下の規則は次の 2 つで、harness の BR / UX / 画面の規則に対応する。

| 規則 | 内容 | 理由の形 |
|---|---|---|
| DEC-1 | L1 の各 `要求ID` が、L3 `機能一覧` のいずれかの `トレース元` の token に現れる (§6.3 の分解と範囲展開を使う) | `l3_descent_missing:DOC-L1-REQUIREMENTS:<要求ID>` |
| DEC-2 | L2 の各 `画面ID` の `関連機能` に、L3 の `機能ID` の token が 1 つ以上ある | `l3_descent_missing:DOC-L2-SCREEN:<画面ID>` |

- consumer は §6.3 により範囲表記を展開する。参照セルは列で固定された表の中の宣言であり、範囲の裏の ID も意図した参照だからである。harness の本文照合 (§13.3) とは入力の性質が違うので、扱いが異なることを意図して残す。
- D2 は L3 が画面を引用する形ではなく、L2 が L3 機能を引く形で降下を見る。T3 の参照先が `R` だけであり (§7.1)、L3 の `トレース元` に画面 ID を書くと `dangling_reference` になるためである。この方向は決定 DEC-3 のとおりである。D2 は T2 に「`機能ID` の token が 1 つ以上ある」を足したもので、T2 の理由 (`dangling_reference` / `missing_reference`) と重なる理由を返さない。
- 必須集合が空のときは §7.2 の `empty_required_set` が先に赤になるので、本節の規則は空集合に対して追加の理由を返さない。
- consumer 分岐は除外台帳を持たない (consumer のテンプレートに宣言の表が無い)。欠落は全件違反とする (§13.9 の決定 DEC-4)。必要になれば後続の Issue で扱う。
- harness 専用の文書は読まない。§5 の reader で 4 文書だけを要求する不変条件 (§10) は保つ。
- 必須の列と見出しは §6.1 のままで、新しい列を要求しない。

### 13.9 決定 (control の決定、advisor claude-fable-5-1、2026-10-21)

| ID | 決定 | 理由 |
|---|---|---|
| DEC-1 | 入口は G1-trace の追加の規則にする | doctor の full profile は G1-trace を呼び、consumer は `ut-tdd gate G1` でしか届かないため。`g1-trace - OK (...)` の行と OT-45 の件数条件は変えない |
| DEC-2 | 範囲表記は降下に数えない (§13.3 の照合規則) | 範囲の裏の ID の降下が一度も確かめられなくなるのを避ける。`descent-obligation` の薄い被覆と揃う |
| DEC-3 | consumer の画面の降下は L2 の `関連機能` で見る | T3 の参照先を広げる契約改訂を避ける。降下規則 D2 は T2 の理由と重ならない |
| DEC-4 | consumer に除外台帳を認めない | テンプレートに宣言の表が無い。必要になれば後続の Issue |
| DEC-5 | 引用の場所は表のセルに限らない | 最小の実装。`status: placeholder` / `park` の文書を数えないことを最小の防御とする |
