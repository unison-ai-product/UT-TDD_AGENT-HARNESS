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

consumer 分岐の導入に伴う変更対象外である点は維持する。ただし A4 (#1168) では PLAN 専用の G1 検査を退役する。残す harness G1 契約は BR / UX / P0 FR と画面の trace だけであり、L3 PLAN の読み込みや `requires` の欠落検査は契約しない。L1→L3 の全件降下を証明する代替 lint は追加しない。

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
