---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_consumer_definition_of_ready
pair_artifact: docs/test-design/harness/L7-consumer-definition-of-ready-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
issue: 1928
---

> **L6 contract marker**: `evaluateDefinitionOfReady(input) => DorResult` (consumer の L0〜L3 の前提文書と署名の記録を、形だけ読んで finding の一覧を返す純関数。`src/lint/consumer-dor.ts` に置く) と、doctor profile `consumer-dor` は unit-test-granularity contract である (未実装の目標契約。関数名は実装で変えてよいが、契約の意味は変えない)。pre: `input` は読み取り関数 `read` / `exists` / `list` の 3 つで、文書を書き換えない。post: 結果の状態は `pass` / `warn` / `fail` / `not-applicable` の 4 つで、機械の検査が全て通っても「着手してよい」とは表示しない。invariant: 意味の判定はしない。oracle は `docs/test-design/harness/L7-consumer-definition-of-ready-test-design.md` の `CANDIDATE-U-DOR-001`〜`026` が固定する (正式 ID `U-DOR-*` への昇格は、src を含まない昇格 PR で行う)。

# consumer の Definition of Ready (DoR) — 関数設計 (Issue #1928、親 #1927)

## 1. 目的と位置付け

#1927 は、要件と UI が確定したあと、consumer の開発が人の判断待ちで止まらずに受入まで進むことを目標にする。段 1 (Definition of Ready の検査と非著者 review、PO の署名) は、その入口の門である。
この門を通った後は、高影響境界と受入 (段 4) を除いて、人の判断を待たずに進める。そのため、**門の前で「人が決めるべきこと」を全て決め終えていること**を確かめる。
本書は、門の入力 (前提文書の集合)、各入力の完了条件 (機械で確かめる形の部分と、人が見る部分)、署名と UI 確定の記録の形、段 0 へ戻る経路、警告から fail-close へ移る条件を freeze する。

品質は、次の 3 つで守る (優先順、#1927)。**意味を判定する lint は作らない**。

1. 非著者 review (人が見る部分)
2. 例文の残りの検出 (既存の #894 の純関数を使う)
3. trace の検査 (既存の consumer trace の関数を使う)

## 2. 再利用する既存の仕組み (新しい仕組みを作らない)

| 既存 | 場所 | 本書での使い方 |
| --- | --- | --- |
| 記入欄の残りの検出 `findUnfilledTemplatePlaceholders(path, status, content)` | `docs/design/harness/L6-function-design/confirmed-document-placeholder-detection.md` §3 (契約のみで、`src/` に未実装。実測: `grep -rn findUnfilled src tests` は 0 件) | §4.1 で呼ぶ。実装 PR は #894 の Green の後に出す (§9) |
| consumer の trace: `analyzeConsumerG1Trace(reader)` / `analyzeConsumerG3Trace(reader)` | `src/lint/consumer-trace.ts:187`、`:221` (契約: `consumer-trace-gates.md`) | §4.5 で違反を取り込む。core 文書の path は `consumer-trace.ts` の `L1` / `L2` / `L3` の定義 (`docs/design/L1-requirements/functional-requirements.md` など) に従う |
| 表の読み取り (章の範囲、header 行の同定、範囲表記の展開) | `consumer-trace-gates.md` §6.2 / §6.3、`src/lint/consumer-trace.ts:121` の `readCoreDoc`、`tableCells` (`src/lint/shared.ts:74`) | 本書の表も同じ規則で読む。実装は `readCoreDoc` の読み取り部分を挙動を変えずに export して共有する |
| doctor profile の登録 (`DoctorRunProfileId`、`DOCTOR_RUN_PROFILES`、`--profile`、`--profiles`) | `src/doctor/profiles.ts:3-8`、`:190-214`。`consumer-design-phase-doctor.md` §3 | profile `consumer-dor` を同じ仕組みで足す (§7) |
| 段の名前 `baseline` / `advisory` / `ratchet` / `enforce` | `consumer-operations-controls.md` §3.1 / §6、`consumer-design-system.md` §7 | 本書は `advisory` と `enforce` だけを使う (§8) |
| 段 0 へ戻る経路 (confirmed → fullback、`kind=reverse` + `forward_routing`) | `docs/governance/gate-design.md:61` | §6 で使う |
| 方式の決定の置き場と判定 (L3 第9章の `DEC-NNN`、DoR が読む範囲) | `method-decision-placement.md` §3、§4、§7 (#1923) | §4.4 で読む。用語・判定の定義は再掲せず、そこへ従う |
| PO 承認の置き場 = consumer の ADR | `consumer-operations-controls.md` §7 | §5 の署名の記録に使う |

## 3. 入力の集合と読み方

DoR が読む文書は 4 つの core 文書だけである (L0、L1、L2、L3)。いずれも `docs/governance/vmodel-document-catalog.md` §1 の core 行で、profile で外せない。

| 入力 | `doc_type_id` | consumer layout の path |
| --- | --- | --- |
| L0 charter | `DOC-L0-CHARTER` | `docs/design/L0-planning/charter.md` |
| L1 requirements | `DOC-L1-REQUIREMENTS` | `docs/design/L1-requirements/functional-requirements.md` |
| L2 screen list | `DOC-L2-SCREEN` | `docs/design/L2-screen/screen-list.md` |
| L3 functional requirements | `DOC-L3-FUNCTIONAL` | `docs/design/L3-functional/functional-requirements.md` |

- path は catalog の `authoring_source_path` (`docs/design/harness/...`) を consumer layout へ写したものである (`src/shared/design-root.ts:53` の `resolveAuthoringSourcePath`)。L1〜L3 は `consumer-trace.ts` の定義と同じである。
- 入力 `input` は注入された 3 つの関数だけを使う。`read(relativePath) => string | undefined` (文書の本文。`ConsumerTraceReader` と同じ型)、`exists(relativePath) => boolean`、`list(relativeDir) => string[]` (直下の file 名)。ネットワークも git も使わない。
- 4 つの文書が**全て無い**ときだけ、結果は `not-applicable` (理由 `前提文書なし`) とする。1 つでもあれば評価し、無い文書は §4.0 の finding にする。

## 4. 入力ごとの完了条件

各 finding は文字列 1 つで、`dor.<種別>:<引数>` の形にする。結果は辞書順に並べ、同じ finding は 1 回だけ返す。**最初の 1 件で打ち切らず、全件返す**。
各項目は「機械で確かめる形」と「人が見るもの」に分ける。人が見るものは §5.3 の checklist に出し、機械は合否を判定しない。

### 4.0 全文書に共通

| finding | 条件 |
| --- | --- |
| `dor.missing_doc:<doc_type_id>` | `read` が `undefined` を返した |
| `dor.doc_type_mismatch:<doc_type_id>` | frontmatter の `doc_type_id` が §3 の値と違う (frontmatter の読み方は `consumer-trace.ts:128` と同じ) |
| `dor.placeholder:<doc_type_id>:<行>:<列>` | `findUnfilledTemplatePlaceholders(path, "confirmed", content)` が返した一致 1 件につき 1 件 |

- `dor.placeholder` では、**実際の status に関わらず `"confirmed"` を渡す**。DoR は凍結の前に走るので、文書は `draft` のままである。「凍結したらどうなるか」を見るために固定値を使う。これは #894 の契約を変えない。#894 の gate は文書の実 status を渡し、DoR は別の呼び出し元である。
- 記入欄の字句と HTML comment の除外は #894 §2 が正本で、本書は複製しない。除外は照合の前に行われる (説明用の HTML comment が一致に数えられないため、この順序が必要である)。
- `dor.missing_doc` / `dor.doc_type_mismatch` が出た文書は、以降の節の検査を飛ばす (読めない文書の表を読まない)。

### 4.1 L0 企画書

| 機械で確かめる形 | finding |
| --- | --- |
| テンプレートの例文が残っていない。残りの一覧 `TEMPLATE_EXAMPLE_RESIDUES` は 1 件で、「総合評価により案C（自社SaaS開発）を採用する」の文字列 (全角の括弧) を本文に含むこと | `dor.l0_example_residue:C-adoption` |
| `#### 第10章 代替案の比較` の範囲に、行頭が `- 採用案:` と `- 理由:` の 2 行があり、どちらの値も空でなく placeholder (`<` で始まる) でない | `dor.l0_adoption_missing` (どちらかが無い、または値が空) |
| 採用案の値が、同じ範囲の表 (header に `案` を持つ最初の表) の `案` 列のいずれかのセルと完全に一致する | `dor.l0_adoption_unknown_option` |

人が見るもの: 採用した案とその理由が妥当か。**PO の署名** (§5)。

### 4.2 L1 要求定義

| 機械で確かめる形 | finding |
| --- | --- |
| `#### 第4章 機能要求一覧` の表に、列 `受入条件` がある。無ければ 1 回だけ返し、行ごとの検査はしない | `dor.required_column_missing:DOC-L1-REQUIREMENTS:受入条件` |
| 各要求の行は `要求ID` が空でも placeholder でもない。ID が空か placeholder で、`要求名` か `要求内容` が空でも placeholder でもない行は、ID が付いていない要求である (読み取りが静かに飛ばす行を拾う) | `dor.l1_row_without_id:<データ行の番号 (1 始まり)>` |
| 各要求の `受入条件` のセルが空でなく placeholder でない | `dor.l1_no_acceptance:<要求ID>` |
| `#### 第5章 非機能要求(SaaS)` の表に、記入済みの行が 1 行以上ある (`要求ID` が空でも placeholder でもない行) | `dor.l1_nfr_table_empty` |
| 非機能の各行の `要求内容` が空でなく placeholder でない | `dor.l1_nfr_empty:<要求ID>` |
| `要求内容` が `該当なし` で始まるとき、その直後に `+` / `:` / `：` のいずれかと、空白以外の文字 1 つ以上が続く (「該当なし + 理由」の形) | `dor.l1_nfr_na_without_reason:<要求ID>` |

- 「値か該当なしか」の**中身が妥当かは判定しない**。値の形 (数値と単位) も見ない (意味の判定だから)。空でないこと、`該当なし` に理由の形があることだけを見る。
- `受入条件` の列は、現行のテンプレートの第4章 (`要求ID` `要求名` `要求内容` `優先度` `展開先`) には無い。足す変更は #1923 の系列のテンプレート変更が持つ (§10 の O1)。列が足されるまで、このテンプレートを使う consumer は `required_column_missing` の警告を受ける。consumer trace は余分な列を許すので (`consumer-trace-gates.md` §6.2)、列を足しても G1 / G3 は変わらない。

人が見るもの: 要求と受入条件の妥当性。非著者 review。

### 4.3 L2 画面一覧

| 機械で確かめる形 | finding |
| --- | --- |
| `#### 第4章 画面一覧` の表に、列 `状態` がある。無ければ 1 回だけ返し、画面ごとの `状態` の検査はしない | `dor.required_column_missing:DOC-L2-SCREEN:状態` |
| 各画面の `状態` のセルが空でなく placeholder でない | `dor.l2_no_state:<画面ID>` |
| 各画面の `関連機能` に token が 1 つ以上ある (要件 ID を含む) | §4.5 の `dor.trace:missing_reference:DOC-L2-SCREEN:<画面ID>:関連機能` で報告する (重複した finding を作らない) |
| 画面が 2 つ以上あるとき、各画面の ID が `##### 5-2 主要遷移` の表 (header に `遷移元` `遷移先` を持つ表) の `遷移元` か `遷移先` のセルに、token として 1 回以上現れる (token の分け方は `consumer-trace.ts:69` の `REF_SEPARATOR`)。画面が 1 つだけのときは検査しない | `dor.l2_no_transition:<画面ID>` |

- `状態` 列は現行のテンプレートに無い。足す変更の扱いは `受入条件` と同じ (§10 の O1)。

人が見るもの: **UI 確定の証拠** (§5.2)。画面の状態と遷移の妥当性。

### 4.4 L3 機能要件

L1 との trace は §4.5 が持つ。ここでは L3 に足す 2 つの節を扱う。

**方式の決定** (L3 の第9章「方式の決定」。置き場・用語・判定の正本は `method-decision-placement.md` §3 / §4 / §7 で、本書は再定義しない)。DoR が方式の決定について読むのは、**L3 第9章の決定記録 (`DEC-NNN`) と、それが参照する ADR の存在・status だけ**であり、L4 / L5 は読まない (placement §7。段 1 では L4 / L5 はまだ書かれていない)。

| 機械で確かめる形 | finding |
| --- | --- |
| 必須論点 (`data-store` / `tenant-isolation` / `authn`、placement §4.2) のそれぞれが、`superseded` でない決定記録をちょうど 1 件持つ。欄がそろい (placement §4.1)、状態が `approved` で、承認の 4 項目 (placement §5.1) と有効な ADR 参照 (ADR が存在し status が `accepted`) を持つ | `dor.decision_not_ready:<論点 ID>` (満たさない論点ごとに 1 件。第9章が無いときも 3 論点それぞれに 1 件を返し、記録ごとの検査は重ねない) |

- 「選んである」は、決定記録が `approved` で形がそろっていることだけを意味する。選んだ方式の妥当性と、AI の推奨との違いの理由 (placement §4.1 の欄 5) の妥当性は判定しない (人が見る)。選んだ方式の値は限定しない (`none-single-org` のような「要らない」という選択も適合、placement §4.2)。
- 比較基準との照合 (承認後の欄 2〜4 の書き換え、placement §4.3) は Git 履歴を読むので、本書の `read` / `exists` / `list` だけの入力では行えない。扱いは §10 の O4 で決める。
- 必須論点以外に consumer が足した論点の決定記録は、本書では検査しない (placement §7 が DoR の読む範囲を必須論点に限るため)。

**省略した optional 文書** (`##### 2-4 省略した optional 文書` の節。仮置き)。表は列 `番号` `文書名` `理由` を持つ。対象は optional のうち 3 つだけである (`DOR_CONSIDERED_OPTIONALS`)。範囲を広げるのは契約の改訂である。

| 番号 | 文書 (consumer layout の path) | 根拠 |
| --- | --- | --- |
| `035` | `docs/design/optional/035-reliability-dr-bcp-design.md` | 信頼性・DR (#1923 の指摘 3) |
| `036` | `docs/design/optional/036-privacy-design.md` | プライバシー (同) |
| `049` | `docs/design/optional/049-ai-output-verification-design.md` | AI 出力の検証 (同) |

| 機械で確かめる形 | finding |
| --- | --- |
| 文書が `exists` で見つからない番号は、節の表に `番号` が一致する行があり、`理由` が空でなく placeholder でない | `dor.optional_omitted_without_reason:<番号>` |

- 節や表そのものが無いときも、文書が無い番号ごとに同じ finding を返す (表が無い = 理由の行が無い)。
- 文書が存在する番号は、節に行が無くてよい (省略していない)。存在する文書の中身は DoR の対象外である。
- path は setup が置く先 (`src/setup/vmodel-template-writer.ts:184`、`resolveDesignRoot(repoRoot)` の下の `optional/`。consumer layout では `docs/design/`) と同じである。

人が見るもの: **方式の決定は PO の承認** (決定記録の承認は placement §5 の責任分担に従い、AI は承認の項目を埋めない。認可・PII・ライセンス・外部 AI の前提は、CLAUDE.md の高影響境界で、変更の前に PO の承認が要る。DoR のこの節での機械検査の範囲は §10 の O3)。省略の理由が妥当か。

### 4.5 L1 と L3 の trace (欠けがないこと)

- `analyzeConsumerG1Trace(read)` と `analyzeConsumerG3Trace(read)` の `violations` を取り込み、`dor.trace:<元の理由>` として返す。取り込むのは、理由の `doc_type_id` が `DOC-L1-REQUIREMENTS` / `DOC-L2-SCREEN` / `DOC-L3-FUNCTIONAL` で、種別が `missing_reference` / `dangling_reference` / `empty_required_set` / `invalid_range` / `required_table_missing` のものだけである。
- **取り込まないもの**: `DOC-L12-ACCEPTANCE` の理由 (L12 は段 3 の成果物で、段 1 では無くてよい。G3 は L12 が無いと `missing_core_doc:DOC-L12-ACCEPTANCE` を返す)。`missing_core_doc` と `doc_type_mismatch` (§4.0 が先に報告する)。G1 と G3 が同じ理由を返したときは 1 件にする。
- 読めない文書 (無い、`doc_type_id` が違う) を参照先に持つ参照は、既存の G1 / G3 と同じく `dangling_reference` になる (例: L2 が無いと、L1 の `展開先` の画面 ID が dangling になる)。これは読めない文書の finding の波及であり、抑制しない (参照先の集合を DoR が別に作らない)。
- 追加の規則を 1 つ足す。`#### 第4章 機能要求一覧` の各要求 ID が、L3 `##### 3-1 機能一覧` の `トレース元` のどれかの token (範囲表記を展開した後) に現れる。現れなければ `dor.l1_untraced:<要求ID>`。これは G3 の T1〜T4 に無い逆向きの被覆で、DoR だけの規則である (第4章の要求は機能要求で、第5章の非機能は対象外)。

人が見るもの: 非著者 review (要件の矛盾を見つける)。

## 5. 署名と UI 確定の記録

### 5.1 PO の署名の記録

**置き場は、consumer の ADR 1 件 (`docs/adr/ADR-<番号>-<題>.md`)**。既存の記録経路を使い、新しい保管方式は作らない (PO 承認の置き場は ADR と、既に `consumer-operations-controls.md` §7 が定めている。採択結果を ADR に残す規律は `skills/design-decision-elicitation.md` にある)。
署名の記録は、`docs/adr/` の file のうち、行 `## DoR 署名` を持つもので、**ADR の番号が最大のもの**とする。署名し直したときは、番号が大きい新しい ADR を足す。古い ADR は履歴として残す (書き換えない)。

節 `## DoR 署名` は、列 `項目` `値` の表を持つ。

| `項目` | `値` の形 | finding |
| --- | --- | --- |
| `署名者` | 空でなく placeholder でない | `dor.signoff_field_missing:署名者` |
| `署名日` | `YYYY-MM-DD` の形 | `dor.signoff_date_invalid` |
| `L0 digest` `L1 digest` `L2 digest` `L3 digest` | `sha256:` と 64 桁の 16 進数 | `dor.signoff_field_missing:<項目>` (無い、または形が違う) |
| `非著者 review の記録` | 空でなく placeholder でない (PR の URL か receipt の path。実在は確かめない) | `dor.signoff_field_missing:非著者 review の記録` |

- 記録が 1 件も無いと `dor.signoff_missing` を返し、§5.1 の表と §5.2 の検査は行わない。
- **digest の定義 (`bodyDigest`)**: 文書の本文から frontmatter (先頭の `---` から次の `---` の行まで。`consumer-trace.ts:128` と同じ正規表現) を除き、改行 `\r\n` を `\n` に揃え、UTF-8 の bytes の SHA-256 を `sha256:` + 16 進で表す。frontmatter を除くのは、署名の後に `status: draft` を `confirmed` へ変える (凍結する) 操作で署名を無効にしないためである。**本文**が変わると無効になる。
- 4 つの文書それぞれの `bodyDigest` を再計算し、記録の値と違えば `dor.signoff_stale:<doc_type_id>` を返す。文書が読めないときは §4.0 の finding だけを返し、`stale` は返さない。
- 署名者の本人確認、署名の真正性は機械で確かめない。**署名は PO が行い、記録を読むのは人である** (§5.3)。

### 5.2 UI 確定の証拠

同じ ADR の節 `## DoR UI 確定` に、列 `画面ID` `モックの参照` `承認者` `承認日` の表を置く。L2 の各画面に 1 行ずつ持つ。

| 機械で確かめる形 | finding |
| --- | --- |
| L2 `第4章 画面一覧` の各画面 ID が、表の `画面ID` に 1 行ある | `dor.ui_missing_screen:<画面ID>` |
| 表の `画面ID` が、L2 に無い ID でない | `dor.ui_unknown_screen:<画面ID>` |
| `モックの参照` が、repo 内の相対 path で `exists` が真のもの (絶対 path と `..` を含む path は不可) か、`https://` で始まる URL のどちらか。URL は取得しない | `dor.ui_mock_unresolvable:<画面ID>` |
| `承認者` が空でなく placeholder でなく、`承認日` が `YYYY-MM-DD` の形 | `dor.ui_approval_missing:<画面ID>` |

- モックの置き場は新設しない。参照できる path か URL であればよい。参照先の中身、モックと画面の記述の一致は、機械で確かめない (§10 の O4)。
- L2 の画面 ID が読めないとき (`dor.missing_doc` / `dor.doc_type_mismatch` / 画面が 0 件) は、この節の検査を行わない (画面の集合が決まらないため)。画面が 0 件のときは §4.5 の `dor.trace:empty_required_set` が報告する。
- モックの参照先の file は digest に束縛しない。署名後にモックを差し替えても検出しない (残余リスク。人の review が見る)。

### 5.3 人が見るもの (checklist)

結果には、機械の finding とは別に、次の 5 行を**常に**出す (合否の判定はしない)。機械の検査が全て通っても、状態 `pass` の表示は `machine-pass` とし (text 出力の先頭の語)、「着手してよい」とは表示しない。

1. L0: 採用案と理由の妥当性、PO の署名。
2. L1: 要求と受入条件の妥当性 (非著者 review)。
3. L2: モックと画面の記述の一致、PO の UI 確定の承認。
4. L3: L1 との整合と矛盾の有無 (非著者 review)。
5. 方式の決定: L3 第9章の必須論点の決定記録 (選んだ方式の妥当性、AI の推奨との違いの理由)、省略した optional の理由の妥当性、PO の承認。

## 6. 要件の矛盾が見つかったときは段 0 へ戻す

- **契機**: 段 2 以降で、L0〜L3 の内容どうしの矛盾、または L0〜L3 と下位の設計の矛盾を、誰か (AI を含む) が見つけたとき。または `dor.signoff_stale` が出たとき。
- **経路**: 既存の fullback を使う (`docs/governance/gate-design.md:61`。`kind=reverse` + `forward_routing` で L1 / L3 へ戻す)。矛盾した両側の ID と本文の引用を、GitHub Issue に書く。該当する経路の作業を止め、署名を無効として扱う。
- **AI は要件を補わない**。AI が書いてよいのは、解決案の候補を設計判断依頼の形式 (`docs/governance/design-decision-elicitation.md`) で Issue に出すことまでである。L0〜L3 の本文を直して矛盾を解消し、先へ進めることは禁止する。直すのは段 0 の作成者が PO の判断を受けて行い、その後、DoR を再実行し、PO が署名し直す (§5.1 の新しい ADR)。
- **機械が見るもの**: 署名の後に L0〜L3 の本文が変わると `dor.signoff_stale` を返す (§5.1)。これは「署名の後に本文が変わった」ことしか示さない。誰が変えたか (AI か人か) は判定しない (機械では判定できない)。
- 署名の後の L0〜L3 の変更は、全て段 0 の変更である (誤字の修正でも再署名が要る)。再署名のコストは、新しい ADR を 1 件足すだけである。

## 7. 実装の形 (profile `consumer-dor`)

- 純関数 `evaluateDefinitionOfReady(input) => DorResult` を `src/lint/consumer-dor.ts` に置く。入力は §3 の `read` / `exists` / `list`、設定は `stage` (§8)。
- `DorResult`: `{ state, stage, findings: string[], humanChecks: string[5], summary }`。`state` は §8 の 4 つ。
- doctor profile `consumer-dor` を足す。`audience: "consumer"`、`sourceOnly: false`、`invocation: "registry"`。`--profile consumer-dor` で選べ、`--profiles` の一覧に出る (`src/doctor/profiles.ts:190-214` と同じ仕組み)。`consumer-design-phase` (#1527) の 4 検査は変えない。DoR はその 5 つ目ではなく、別の profile である。
- 出力は text と `--json` の両方で、状態・finding の全件・`humanChecks` の 5 行を出す。`--json` は同じ内容である。
- **生成する consumer workflow には、advisory の間は足さない**。段 0 の作成中の consumer が、常に警告を受け続けるのを避けるためである。fail-close へ移るときに、#1522 の生成 workflow の契約へ足すかを決める。
- DoR は何も書き込まない (読み取り専用)。

## 8. 結果の状態と、警告から fail-close へ移る条件

状態は 4 つである。`consumer-design-phase` (#1527) の 3 状態の表 (§6) は変えず、DoR だけが `warn` を持つ。

| 状態 | 条件 | exit |
| --- | --- | --- |
| `pass` | finding が 0 件 | 0 |
| `warn` | finding が 1 件以上で、段が `advisory` | 0 |
| `fail` | finding が 1 件以上で、段が `enforce` (または `--strict`) | 1 |
| `not-applicable` | §3 の、4 つの文書が全て無いとき (理由 `前提文書なし`) | 0 |

- 段の既定は `advisory`。opt-in の `--strict` (flag 名は実装の判断) を付けると、その実行だけ `enforce` と同じ扱いにする (fail-close の条件を試せる。`advisory-strict-gate-aging.ts` の opt-in strict flag と同じ型)。
- summary は `pass` / `warn` / `fail` / `not-applicable` を別々に数える。**`warn` を `pass` に数えない**。「全件 pass」と表示してよいのは、`warn` と `fail` と `not-applicable` が全て 0 のときだけである。finding があるのに exit 0 のとき、出力に finding の件数を必ず出す (silent green を作らない)。
- `baseline` と `ratchet` は使わない。DoR の対象は、その consumer が最初に前提文書を書き上げる文書であり、「既に在る負債」の件数の基準 (baseline) を持たないためである。

**`enforce` (fail-close) へ移る条件**。全てを満たしたときだけ、契約の改訂 PR (既定の段の変更) で移す。

1. §4.2〜§4.4 のテンプレートの変更 (`受入条件` 列、`状態` 列、第9章 (方式の決定、#1930 が足す) と `2-4` の節、L0 の `採用案` と `理由` の行) が、Pack の公開 tag (canary.9 以降) で consumer へ配られている。配られる前に `enforce` にしない (配られていない節は、consumer が満たせないため)。
2. #894 の記入欄の検出が `src/` に実装され、Green で 1 リリース以上の間 (その consumer の CI で) 使われている。
3. consumer 1 件以上で、`advisory` の DoR を実走し、理由 (finding の種別) ごとの件数と、誤検出 (正しい文書を拒否した finding) の件数を #1927 のコメントに記録している。誤検出は 0 件である (あれば、その種別の契約を直してから)。
4. 既存の consumer を全て走らせ、`enforce` にすると `fail` になる件数を実測している。`fail` になる consumer は、是正済みか、PO が個別に承認した除外である。
5. PO が、互換を壊す変更として承認している (CLAUDE.md の運用)。

これらは条件の宣言であり、満たしたと主張しない。

## 9. 実装の順序

1. #1923 の契約 (`method-decision-placement.md`、方式の決定の置き場) は main に merge 済みである (#1949)。本書はそれに合わせ、方式の決定を L3 第9章から読む (§4.4)。`2-4` の見出しは仮置きのままである (§10 の O1)。
2. #894 の純関数 `findUnfilledTemplatePlaceholders` の Green。本書の実装 PR は、その merge の後に出す (`CANDIDATE-U-DOR-003` が依存する)。
3. 実装 (`src/lint/consumer-dor.ts` と profile) は、本書を oracle の正本として、警告モードで別 PR で行う (#1927 の 3 つ目の子)。1 PR = 新規 source_module 1 個 + 対のテスト + 最小配線。テンプレートの変更は別 PR である。

## 10. 未決の点 (実装前に決める)

| ID | 内容 | 本書の仮の扱い |
| --- | --- | --- |
| O1 | 方式の決定の置き場は、#1923 の契約が L3 第9章と定めた (解決済み)。残る未決は、`受入条件` / `状態` の列と `2-4` の節を、どの変更が足すか | L1 と L2 の列、L3 の `2-4` を仮に置く。テンプレートの変更 (#1930 の系列) が別の置き場を定めたら、本書を改訂する |
| O2 | 署名の記録の置き場。実測した既存の経路は、(a) harness 自身の gate 台帳 (`docs/process/gates.md` の `PO サインオフ` の行) と、(b) consumer の ADR (`consumer-operations-controls.md` §7) である。(a) は harness の台帳で、consumer が自分の台帳として持つ仕組みは見つからなかった | (b) の ADR を使う。署名を PR の approval や review custody の記録で行う案は、#1526 (consumer が正規の merge 経路と review custody を使えない) が解けてから検討する |
| O3 | 旧版が 6 項目 (`データ方式` `テナント分離` `認可` `外部AIへのデータの境界` `PII` `ライセンス`) の `2-3` の表を検査していた。placement の必須論点は 3 つ (`data-store` `tenant-isolation` `authn`) で、`認可` `外部AIの境界` `PII` `ライセンス` の 4 つは、必須論点にも `authn` にも当たらない (`authn` は認証方式、`認可` は別の論点) | 本書は 3 つの必須論点だけを機械で読む。4 つの高影響境界を、consumer が足す論点として決定記録を要求するか (DoR の読む範囲の拡張は placement §7 の改訂)、別の記録で受けるか、人の checklist (§5.3) だけにするかは設計判断であり、本書では決めない |
| O4 | placement §7 の 3 点目は、欄 2〜4 を承認対象 revision 時点の第9章と比べる (§4.3)。これは Git 履歴を読むが、本書は DoR にネットワークも git も使わせない (§3、§12)。また、第9章の決定記録の markup (見出しか表か) は placement が定めておらず、`read` だけで読む形が決まらない | 本書は比較基準の照合を行わず、決定記録の markup は oracle で固定しない (§4.4)。Git 読取りを DoR の入力に足すか、markup を placement かテンプレートで定めるかは、placement と本書の両方の契約改訂になるため、ここでは決めない |
| O3 | 非著者 review の証跡は、consumer では review custody の receipt を使えない (#1526)。DoR は参照の有無しか見ない | 参照が空でないことだけを確かめる。実在と内容は人が見る |
| O4 | UI のモックの置き場の規約。`consumer-design-system.md` (#1717) との関係は未確認 | path か `https://` の URL を許す。置き場の規約は作らない |

## 11. 範囲外

- **意味を判定する lint** (選択の妥当性、受入条件の十分さ、モックと画面の一致、`該当なし` の妥当性)。品質は非著者 review で守る。
- **必須の文書を増やすこと**。足すのは既存の文書の節と列だけである。署名の記録は、既存の ADR の 1 件に書く。
- **自律オーケストレータ**。ADR-001 の決定 4 (1.0.0 では管理知能を作らない) に当たる。DoR は、既存の doctor の profile として、人または CI が呼ぶ純関数である。
- 段 2 以降 (L4〜L6 の設計、実装、受入、本番反映) の自走の仕組み (#1927 の他の子)。#1526 (merge 経路) の解決。
- テンプレート本文の変更 (別 PR)。デザインシステムの preset を必須にすること (#1927 の「やらないこと」)。
- 高影響境界の承認 (本番インフラ・認可・PII・secret・ライセンス・外部 API の前提) の仕組みそのもの。DoR は、その承認が方式の決定に記録されていることの形を見るだけである。

## 12. 不変条件 (DbC)

| contract point | 不変条件 |
| --- | --- |
| pre | `input` の 3 つの関数が呼べる。`stage` は `advisory` か `enforce` |
| post (全件) | finding は全件、辞書順、各 1 回だけ返す。最初の 1 件で打ち切らない |
| post (状態) | 結果の状態は 4 つのどれか 1 つ。finding があるのに `pass` にならない。`warn` は exit 0、`fail` は exit 1 |
| post (人の確認) | `humanChecks` を常に 5 行返す。機械が全て通っても「着手してよい」と表示しない |
| invariant (読み取り専用) | 文書・ADR・設定を書き換えない。ネットワークも git も使わない |
| invariant (非意味) | 値の中身の妥当性を判定しない。形 (空でない、placeholder でない、決めた字句・列・ID の形) だけを見る |
| invariant (既存の不変) | `consumer-design-phase` の 4 検査と G1 / G3 の結果を変えない。`analyzeConsumerG1Trace` / `analyzeConsumerG3Trace` の挙動を変えない |
| invariant (署名の束縛) | 署名は 4 つの文書の本文 (frontmatter を除く) の digest に束縛する。status の変更では無効にならない。本文の変更では無効になる |

## 13. oracle

`CANDIDATE-U-DOR-001`〜`026` (`docs/test-design/harness/L7-consumer-definition-of-ready-test-design.md`。共有の `L7-unit-test-design.md` には足さない)。
