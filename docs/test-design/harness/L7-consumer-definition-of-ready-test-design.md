---
title: "L7 consumer の Definition of Ready テスト設計"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/consumer-definition-of-ready.md
status: confirmed
updated: 2026-11-24
issue: 1928
---

# consumer の Definition of Ready テスト設計 (issue #1928)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/consumer-definition-of-ready.md` である。共有の
`docs/test-design/harness/L7-unit-test-design.md` には行を足さない (shared file の直列化規律)。本書が
oracle の正本であり、`CANDIDATE-U-DOR-001`〜`026` を候補として宣言する。昇格・実装は別 PR である。
Red は `it.fails` で先に入れ、Green で `it` に戻す (設計書保護 gate)。

## 2. fixtures

すべてメモリ上の `{ read, exists, list }` で作る使い捨ての入力で、実 repo を対象にしない。`dor-ok` は、全ての検査を同時に満たす基準の入力である。各 oracle は、`dor-ok` に**1 つだけ**変更を加えた入力を使う (どの oracle も、その oracle が守る条件だけが崩れている)。
「再署名」と書いた入力は、変更を加えた後の 4 文書の `bodyDigest` で署名の記録を作り直す (署名の digest 以外の違反を混ぜないため)。

`dor-ok` の内容 (frontmatter は全て `status: draft`、`doc_type_id` は設計文書 §3 の値):

| path | 内容 |
| --- | --- |
| `docs/design/L0-planning/charter.md` | `#### 第10章 代替案の比較` に、列 `案` `概要` `利点` `欠点` `評価` の表 (行は `案A`、`案B`) と、その下に 2 行 `- 採用案: 案A` と `- 理由: 差別化の要因になるため` |
| `docs/design/L1-requirements/functional-requirements.md` | 第4章 機能要求一覧の表 (列は `要求ID` `要求名` `要求内容` `優先度` `展開先` `受入条件`)。9 行目が `R-001` (展開先 `F-001`、受入条件 `検索結果が 1 秒以内に出る`)、10 行目が `R-002` (展開先 `F-002, SC-002`、受入条件 `通知が届く`)。第5章の表 (列 `要求ID` `分類` `要求内容` `展開先`) に `NFR-001` (`95 パーセンタイルで 1 秒`) と `NFR-002` (`該当なし + 社内の試用のため`) |
| `docs/design/L2-screen/screen-list.md` | 第4章 画面一覧の表 (列は `画面ID` `画面名称` `概要` `関連機能` `ロール` `状態`)。`SC-001` (関連機能 `F-001`、状態 `初期、結果、エラー`) と `SC-002` (関連機能 `R-002`、状態 `一覧、空`)。`##### 5-2 主要遷移` の表 (列 `No` `遷移元` `操作` `遷移先`) に 1 行 (`SC-001` から `SC-002`)。末尾に説明用の HTML comment 1 行 (最低行数の注記) |
| `docs/design/L3-functional/functional-requirements.md` | `##### 2-3 方式の決定` の表 (列 `項目` `選択` `理由` `ADR`)。6 項目が全てあり、`テナント分離` だけ `選択` が `該当なし` で `ADR` が空、他の 5 項目は `選択` と `理由` が埋まり、`ADR` は `ADR-001`〜`ADR-005`。`##### 2-4 省略した optional 文書` の表 (列 `番号` `文書名` `理由`) に `035` の 1 行 (理由あり)。`##### 3-1 機能一覧` に `F-001` (トレース元 `R-001`) と `F-002` (トレース元 `R-002`) |
| `docs/adr/` | `ADR-001-data.md`〜`ADR-005-license.md` (中身は見出し 1 行)。署名の記録 `ADR-006-dor-signoff.md` (下記) |
| optional 文書 | `docs/design/optional/036-privacy-design.md` と `049-ai-output-verification-design.md` (存在すればよく、中身は見ない)。`035` は置かない |
| `docs/mock/sc-001.png` | 存在する file |

`ADR-006-dor-signoff.md` は、`## DoR 署名` の表 (列 `項目` `値`: `署名者`、`署名日 2026-12-01`、4 つの `L0 digest`〜`L3 digest` (4 文書の `bodyDigest`)、`非著者 review の記録` に PR の URL) と、`## DoR UI 確定` の表 (列 `画面ID` `モックの参照` `承認者` `承認日`: `SC-001` は `docs/mock/sc-001.png`、`SC-002` は `https://example.com/mock/sc-002`、どちらも承認者あり、承認日 `2026-12-01`) を持つ。

`dor-ok` に L12 の文書は置かない (段 1 では無くてよい)。

## 3. 候補の oracle

以下は契約からの転記であり、実行済み・Green・正式 oracle 昇格を主張しない。`findings` は辞書順の配列である。特記の無い限り、段は `advisory`。

| ID | 入力 | 期待 | 反例 (検出したい誤実装) |
| --- | --- | --- | --- |
| `CANDIDATE-U-DOR-001` | `dor-ok` | 状態 `pass`、`findings` は空、`humanChecks` は 5 行、出力の先頭の語は `machine-pass` で `READY` も「着手してよい」も出力に無い。exit 0 | 機械が全て通ると「着手してよい」と表示する / `humanChecks` を省く |
| `CANDIDATE-U-DOR-002` | 4 つの文書が全て無い入力 (`read` が常に `undefined`) | 状態 `not-applicable`、理由 `前提文書なし`、`findings` は空。exit 0 | 4 件の `dor.missing_doc` を返す / `pass` と表示する |
| `CANDIDATE-U-DOR-003` | `dor-ok` の L1 の `R-001` 行の `要求内容` (`x`) を、記入欄の字句 (山括弧で囲んだ「記入」を含む語) に変える (再署名)。L1 は `status: draft` のまま。`findUnfilledTemplatePlaceholders` に spy を付ける | `findings` は `dor.placeholder:DOC-L1-REQUIREMENTS:9:16` の 1 件だけ。spy は、L1 に対して `status` 引数 `"confirmed"` で呼ばれる (frontmatter の `draft` は渡さない)。L2 の説明用 HTML comment は一致に数えない (`dor-ok` が `pass` であることが対照) | `draft` を理由に検査を飛ばす / HTML comment の中を一致に数える / 実 status を渡す |
| `CANDIDATE-U-DOR-004` | `dor-ok` の L0 の末尾に、一文 `> ※ 総合評価により案C（自社SaaS開発）を採用する。` (全角の括弧) を足す (再署名) | `findings` は `dor.l0_example_residue:C-adoption` の 1 件だけ | 一文が残っていても通す / 半角の括弧に直したものだけを拾う |
| `CANDIDATE-U-DOR-005` | (a) L0 の `- 採用案: 案A` を `- 採用案: 案C` にする (表に `案C` は無い)。(b) 別の入力で、`- 理由:` の行を削除する (どちらも再署名) | (a) `dor.l0_adoption_unknown_option` の 1 件だけ。(b) `dor.l0_adoption_missing` の 1 件だけ (`unknown_option` を併せて返さない) | 表と照合しない / 行が無いのに別の finding も返す |
| `CANDIDATE-U-DOR-006` | `dor-ok` の L1 の第4章の表に、3 行目として `要求ID` が空で `要求名` が `予備`、`受入条件` が `受入あり` の行 (展開先 `F-002`) を足す (再署名) | `findings` は `dor.l1_row_without_id:3` の 1 件だけ。`dor.trace:*` は出ない (読み取りが飛ばす行なので、他の trace に影響しない) | ID の無い要求を静かに無視する |
| `CANDIDATE-U-DOR-007` | (a) `dor-ok` の `R-002` の `受入条件` を空にする。(b) 別の入力で、第4章の表から `受入条件` 列を消す (どちらも再署名) | (a) `dor.l1_no_acceptance:R-002` の 1 件だけ。(b) `dor.required_column_missing:DOC-L1-REQUIREMENTS:受入条件` の 1 件だけ (行ごとの `l1_no_acceptance` を返さない) | 列が無いのに行ごとに finding を重ねる / 空の受入条件を通す |
| `CANDIDATE-U-DOR-008` | (a) `NFR-002` の `要求内容` を `該当なし` だけにする。(b) `NFR-001` の `要求内容` を空にする。(c) `NFR-002` を `該当なし：試用のため` (全角のコロン) にする。(d) 第5章の表の行を全て placeholder 行にする (全て再署名) | (a) `dor.l1_nfr_na_without_reason:NFR-002` の 1 件だけ。(b) `dor.l1_nfr_empty:NFR-001` の 1 件だけ。(c) `findings` は空 (`pass`)。(d) `dor.l1_nfr_table_empty` に加え、placeholder の finding (`dor.placeholder:*`) が返る (表の行が全て記入欄のため) | 理由の無い `該当なし` を通す / 全角のコロンを拒否する / 空の表を通す |
| `CANDIDATE-U-DOR-009` | (a) `SC-002` の `状態` を空にする。(b) 5-2 の表の `遷移先` を `SC-001` に変え、`SC-002` を遷移に現れなくする。(c) `SC-002` の `関連機能` を空にする。(d) 画面を `SC-001` の 1 つだけにする (L2 から `SC-002` の行と遷移の行を消し、L1 の `R-002` の展開先から `SC-002` を除き、署名の UI 確定の表から `SC-002` の行を消す) (全て再署名) | (a) `dor.l2_no_state:SC-002` の 1 件だけ。(b) `dor.l2_no_transition:SC-002` の 1 件だけ。(c) `dor.trace:missing_reference:DOC-L2-SCREEN:SC-002:関連機能` の 1 件だけ (`dor.l2_*` を重ねない)。(d) `findings` は空 (画面が 1 つのときは遷移を検査しない) | 状態が空の画面を通す / 画面が 1 つでも遷移を要求する / 関連機能の欠落を二重に報告する |
| `CANDIDATE-U-DOR-010` | `dor-ok` の L3 の `F-001` のトレース元を `R-001, R-999` にする (再署名)。L12 の文書は無いまま | `findings` は `dor.trace:dangling_reference:DOC-L3-FUNCTIONAL:F-001:トレース元:R-999` の 1 件だけ。`DOC-L12-ACCEPTANCE` の理由 (`missing_core_doc` を含む) は出ない | L12 が無いことを DoR の違反にする / dangling を取り込まない |
| `CANDIDATE-U-DOR-011` | `dor-ok` の L3 の `F-002` のトレース元を `R-001` にする (L1 の `R-002` を指す L3 の機能が無くなる) (再署名) | `findings` は `dor.l1_untraced:R-002` の 1 件だけ (G1 / G3 の既存の理由は出ない。T1〜T4 は満たすため) | L1 の要求が L3 に降りていなくても通す |
| `CANDIDATE-U-DOR-012` | (a) 2-3 の表から `PII` の行を消す。(b) `認可` の `選択` を空にする。(c) 別の入力で、2-3 の節ごと消す (全て再署名) | (a) `dor.decision_missing_row:PII` の 1 件だけ。(b) `dor.decision_unfilled:認可` の 1 件だけ (`理由` は埋まっているので `no_reason` は出ない)。(c) `dor.required_table_missing:DOC-L3-FUNCTIONAL:##### 2-3 方式の決定` の 1 件だけ (項目ごとの `decision_missing_row` を重ねない) | 6 項目のうち欠けを通す / 節が無いのに項目ごとに finding を重ねる |
| `CANDIDATE-U-DOR-013` | (a) `docs/adr/ADR-001-data.md` を消す。(b) `データ方式` の `ADR` を空にする。(c) `テナント分離` の `理由` を空にする (`選択` は `該当なし` のまま) (全て再署名) | (a) `dor.decision_adr_unknown:データ方式:ADR-001` の 1 件だけ。(b) `dor.decision_adr_missing:データ方式` の 1 件だけ。(c) `dor.decision_no_reason:テナント分離` の 1 件だけ。対照: `dor-ok` の `テナント分離` は `該当なし` で `ADR` が空だが finding が無い | ADR の実在を確かめない / `該当なし` にも ADR を要求する / `該当なし` の理由を省かせる |
| `CANDIDATE-U-DOR-014` | (a) `docs/design/optional/036-privacy-design.md` を消す (2-4 に `036` の行は無い)。(b) 別の入力で、(a) に加えて 2-4 に `036` の行 (理由あり) を足す。(c) 別の入力で、2-4 の節ごと消す (`035` の文書は元から無い) (全て再署名) | (a) `dor.optional_omitted_without_reason:036` の 1 件だけ。(b) `findings` は空。(c) `dor.optional_omitted_without_reason:035` の 1 件だけ (`036` と `049` の文書は在るので出ない)。対照: `dor-ok` では `035` の文書が無いが、行があるので finding が無い | 文書が在っても理由を要求する / 理由の行が無い省略を通す |
| `CANDIDATE-U-DOR-015` | `dor-ok` から `ADR-006-dor-signoff.md` を除く (他の ADR は残す)。および、`## DoR 署名` の行を持たない ADR だけがある入力 | どちらも `dor.signoff_missing` の 1 件だけ (署名の表と UI 確定の finding を返さない) | 署名の記録が無いのに通す / 署名の無い ADR を署名として扱う |
| `CANDIDATE-U-DOR-016` | 署名の記録を 2 件置く。(a) `ADR-007-dor-old.md` は L2 の digest が違い、`ADR-009-dor-new.md` が正しい。(b) 逆に `ADR-007` が正しく、`ADR-009` の L2 の digest が違う | (a) `findings` は空 (番号が最大の `ADR-009` を使う)。(b) `dor.signoff_stale:DOC-L2-SCREEN` の 1 件だけ (古い `ADR-007` が正しくても救わない) | 全ての署名の記録のどれか 1 つが合えば通す / 番号が最小のものを使う |
| `CANDIDATE-U-DOR-017` | `dor-ok` に対して、署名を作り直さずに次を行う。(a) L2 の本文の 1 文字を変える。(b) L2 の frontmatter の `status: draft` を `status: confirmed` にする。(c) L2 の改行を全て `\r\n` にする | (a) `dor.signoff_stale:DOC-L2-SCREEN` の 1 件だけ。(b) `findings` は空 (`pass`)。(c) `findings` は空 (`pass`) | 凍結 (status の変更) で署名が無効になる / 本文の変更を見逃す / 改行の違いで無効になる |
| `CANDIDATE-U-DOR-018` | `dor-ok` の署名の記録の `署名日` を `12/01` にし、`署名者` を空にする | `findings` は `dor.signoff_date_invalid` と `dor.signoff_field_missing:署名者` の 2 件だけ。`非著者 review の記録` を空にした別の入力は `dor.signoff_field_missing:非著者 review の記録` の 1 件だけ | 日付の形を確かめない / 署名者が空でも通す / review の記録の欄を省く |
| `CANDIDATE-U-DOR-019` | 署名の記録の UI 確定の表を次のように変える。`SC-001` の行を消す。`SC-002` の `モックの参照` を、存在しない `docs/mock/none.png` にする。`SC-009` の行を足す (L2 に無い画面)。別の入力で、`SC-001` の `承認日` を `12/01` にする。さらに別の 2 つの入力で、`モックの参照` をそれぞれ `../secret.png` と `/etc/passwd` にする | 最初の入力は `dor.ui_missing_screen:SC-001`、`dor.ui_mock_unresolvable:SC-002`、`dor.ui_unknown_screen:SC-009` の 3 件だけ。2 つ目は `dor.ui_approval_missing:SC-001` の 1 件だけ。3 つ目と 4 つ目は、それぞれ `dor.ui_mock_unresolvable:SC-001` の 1 件だけ (相対でない path と `..` を含む path は存在確認をせず拒否)。`https://` の URL は取得せずに通る (`dor-ok` の `SC-002` が対照) | モックの参照を確かめない / URL を取得しにいく / repo の外の path を通す |
| `CANDIDATE-U-DOR-020` | `dor-ok` に、`R-002` の `受入条件` を空にする変更を 1 つだけ加える (再署名)。(a) 段 `advisory`。(b) 段 `enforce` (または `--strict`)。さらに (c) `dor-ok` を `--strict` で。(d) 4 文書が全て無い入力を `--strict` で | (a) 状態 `warn`、exit 0、出力に finding の件数 1、summary は `pass 0 / warn 1 / fail 0 / not-applicable 0` で「全件 pass」と表示しない。(b) 状態 `fail`、exit 1。(c) `pass`、exit 0。(d) `not-applicable`、exit 0 | `warn` を `pass` に数える / finding があるのに「全件 pass」と表示する / `enforce` でも exit 0 になる |
| `CANDIDATE-U-DOR-021` | 現行のテンプレート 4 本 (`docs/templates/vmodel/` の `L0-charter.md` `L1-requirements.md` `L2-screen-list.md` `L3-functional-requirements.md`) を、§2 の path へそのまま置いた入力 (L12 の文書は置く。署名・ADR は無い) | 例外を出さず、状態 `warn`。`dor.placeholder:*` が 4 文書の全てにある (1 件以上)。`dor.placeholder` 以外の finding は次の 13 件と**一致する** (辞書順、各 1 回): `dor.l0_adoption_missing`、`dor.l0_example_residue:C-adoption`、`dor.l1_nfr_table_empty`、`dor.optional_omitted_without_reason:035` / `036` / `049`、`dor.required_column_missing:DOC-L1-REQUIREMENTS:受入条件`、`dor.required_column_missing:DOC-L2-SCREEN:状態`、`dor.required_table_missing:DOC-L3-FUNCTIONAL:##### 2-3 方式の決定`、`dor.signoff_missing`、`dor.trace:empty_required_set:DOC-L1-REQUIREMENTS:要求ID` / `:DOC-L2-SCREEN:画面ID` / `:DOC-L3-FUNCTIONAL:機能ID`。G1 と G3 が同じ `empty_required_set` を返しても 1 回だけ数える | 最初の 1 件で打ち切る / 同じ finding を重ねる / 実テンプレートで例外になる |
| `CANDIDATE-U-DOR-022` | doctor の profile の登録を読む (`DOCTOR_RUN_PROFILE_IDS`、`--profiles` の出力、`consumer-design-phase` の出力、生成する consumer workflow の本文) | `consumer-dor` が登録され、`audience=consumer`、`sourceOnly=false`、`invocation=registry`。`consumer-design-phase` の検査は 4 つのまま (`CANDIDATE-U-CDPD-002` の期待が変わらない) で、DoR を含まない。生成する workflow に `consumer-dor` の step が無い (advisory の間) | `consumer-design-phase` に DoR を混ぜる / 生成 workflow を暗黙に変える / source 専用になる |
| `CANDIDATE-U-DOR-023` | 形は正しいが意味の無い内容: `dor-ok` の L0 の `理由` を `あ`、L1 の `R-001` の `受入条件` を `あ`、L3 の `認可` の `理由` を `あ` に変える (再署名) | `findings` は空 (`pass`)。値の中身 (数値・単位・妥当性) を判定しない | 文字数・語彙・数値の有無で意味を判定する (意味の lint) |
| `CANDIDATE-U-DOR-024` | `dor-ok` と各 oracle の入力を、一時ディレクトリの実 file として置き、DoR の実行の前後で全 file の内容と mtime を比べる。git と ネットワークの呼び出し (`child_process` と `fetch`) に spy を付ける | 内容と mtime は同一。spy の呼び出し回数は 0 | 文書や ADR を書き換える / 署名の確認に git やネットワークを使う |
| `CANDIDATE-U-DOR-025` | (a) `dor-ok` から L2 の文書を消す。(b) 別の入力で、L2 の `doc_type_id` を `DOC-L2-SCREENX` にする (どちらも L2 以外は元のまま、署名は元の文書で作ったまま) | (a) `dor.missing_doc:DOC-L2-SCREEN` と、波及の `dor.trace:dangling_reference:DOC-L1-REQUIREMENTS:R-002:展開先:SC-002` の 2 件だけ。(b) `dor.doc_type_mismatch:DOC-L2-SCREEN` と同じ波及の 1 件の 2 件だけ。どちらも L2 の `状態`・遷移・署名の UI 確定の finding と、`dor.signoff_stale:DOC-L2-SCREEN` は出ない (読めない文書の節を飛ばす) | 読めない文書の表を読もうとして例外になる / 読めない文書の `stale` を返す |
| `CANDIDATE-U-DOR-026` | 順序の整合: `dor-ok` に対して、(1) 署名の記録を作る (4 文書は `draft`)。(2) 4 文書の frontmatter の `status` を全て `confirmed` にする (本文は不変)。(3) #894 の `findUnfilledTemplatePlaceholders` を、4 文書に実 status (`confirmed`) で適用する。(4) DoR を実行する | (3) の結果は 0 件。(4) は `pass`、`findings` は空。(2) の後も署名は有効 (`bodyDigest` は frontmatter を除くため)。さらに、4 文書のどれかの本文に記入欄を 1 つ足した入力で、(3) の一致の集合 (path・行・列) と (4) の `dor.placeholder` の集合が一致する (同じ関数を呼ぶ) | 凍結の操作で署名が無効になり、署名と凍結を同時に満たせない / DoR が #894 と違う基準で記入欄を数える |

## 4. 範囲と実行

- 全 oracle は純関数の fixture テストで、ネットワークなし、git なし (§2 の `read` / `exists` / `list` を注入する)。ID の `CANDIDATE-U-DOR-022` は doctor の登録の単体確認、`024` は一時ディレクトリの実 file を使う。
- `CANDIDATE-U-DOR-003` と `026` は、#894 の純関数 `findUnfilledTemplatePlaceholders` が `src/` に Green で在ることを前提にする。本書の実装 PR は、#894 の Green の merge の後に出す (設計 §9)。Red の段階では、その関数が無いことによる import 失敗ではなく、各 oracle の期待の不成立で Red になること (import は stub で解決する)。
- `CANDIDATE-U-DOR-021` は、現行のテンプレートに `受入条件` / `状態` の列と 2-3 / 2-4 の節が無いことを前提にした oracle である。テンプレートへそれらを足す PR (設計 §10 の O1) は、同じ PR で `021` の期待 (列と節の finding の行) を、配った後のテンプレートに対する期待へ改訂する。実装 PR は、テンプレートを書き換えない。
- 全 ID は `Red -> Green` の対象である。実装の PR は、Green の後に Refactor の commit か、`Refactor なし (理由)` を持つ。
- 本書は、`consumer-design-phase` の oracle (`CANDIDATE-U-CDPD-*`)、consumer trace の oracle (`CANDIDATE-U-CTRACE-*`)、#894 の oracle (`CANDIDATE-U-PH-*`) を変えない。
