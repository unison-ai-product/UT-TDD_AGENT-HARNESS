---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_method_decision_placement
pair_artifact: docs/test-design/harness/L7-method-decision-placement-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-11-25
issue: 1923
---

> **L6 contract marker**: 本書は文書の契約であり、実装関数を持たない。契約の判定は `judgeDecisionRecords(l3Chapter) => DecisionJudgement`、`judgeDetailDocs(records, detailDocs) => DetailJudgement`、`judgeTemplateItems(items, records) => TemplateJudgement` という判定の形で書く (入力は consumer の文書の節、出力は適合 / 不適合と reason token)。oracle は `docs/test-design/harness/L7-method-decision-placement-test-design.md` の `CANDIDATE-U-METHODDEC-001`〜`012` が固定する。新しい管理機構・保管方式・gate は足さない (ADR-001 決定 4)。既存の ADR 運用、非著者 review、DoR (#1928) の読取りに乗せる。

# 方式の決定の置き場 - 機能設計 (Issue #1923)

## 1. 目的と範囲

consumer (UT-TDD を導入した先の製品開発) の V-model 文書で、**後から変えにくい方式の選択** (データの保存方式、テナント分離、認証方式など) をどこに正本として置くかを決める。

実測 (#1923): 配布テンプレートは、選ぶ前に答えが書いてある。L3 は「全業務エンティティは tenant_id を必須保持する」、L5 は「全テーブルに tenant_id 先頭のインデックス、RLS で分離」と固定している。データの保存方式を選ぶ節も、テナント分離を選ぶ節も無い。AI の worker は例文をそのまま埋めるので、単一組織のシステムにも tenant_id と RLS が「検討した結果」として入る。

#1927 のゴール (要件と UI が確定したら、人の判断待ちで止まらずに受入まで進む) を満たすには、方式が **選択済みで、承認済みで、後続の文書がそれを読める** 必要がある。選択肢を並べるだけでは、後続は選べずに止まるか、AI が黙って選ぶ。

範囲外:

- DoR (#1928) の検査項目・署名の形式・警告モードから fail-close への移行。本書は DoR が読む範囲だけを定める (§7)。
- テンプレート本体の改訂 (#1930)。本書の freeze の後に、テンプレートを本書へ合わせる (§8)。
- 個々の方式 (RDB か KVS かなど) の優劣。本書は置き場と記録の形を定め、方式の中身は決めない。

## 2. 用語 (各語の定義はここだけに置く)

| 語 | 定義 |
|---|---|
| 方式の決定 | 後から変えにくい方式の選択。変えると L4 / L5 の複数文書とデータの移行が要るものを指す。 |
| 論点 | 方式の決定の対象 1 件 (例: データの保存方式)。論点 ID は小文字 ASCII の kebab-case とする。 |
| 必須論点 | すべての consumer が決定記録を持つ論点。`data-store` (データの保存方式)、`tenant-isolation` (テナント分離)、`authn` (認証方式) の 3 種。 |
| 決定記録 | 論点 1 件につき 1 件、L3 の「方式の決定」章に置く記録。記録 ID は `DEC-NNN` (3 桁の連番)。 |
| 選んだ方式 | 決定記録の欄。採用した方式を 1 つだけ、方式コードと日本語の説明の組で書く。方式コードは小文字 ASCII の kebab-case (例: `db-per-tenant`、`shared-schema-rls`、`none-single-org`)。「分離なし (単一組織)」のような「その論点が要らない」という選択も選んだ方式である。 |
| 却下した案 | 決定記録の欄。比較して採らなかった案と、却下の理由。 |
| 承認 | PO が決定記録を認めた記録。§5.1 の 4 項目で成り立つ。 |
| 詳細 | 選んだ方式を実現する設計 (スキーマ、物理配置、認証フローなど)。L4 / L5 に置く。決定ではない。 |
| 適用条件 | テンプレートの項目が、特定の論点の特定の方式コードのときだけ必須になることを示す注記。形は `適用条件: <論点 ID>=<方式コード>`。 |
| 非適用 | 適用条件が、承認済みの決定記録の方式コードと合わない項目の状態。必須として扱わない。 |

## 3. 置き場 (二段)

**3.1 L3 に決定記録を置く**

置き場は `DOC-L3-FUNCTIONAL` (要件定義書) の **第9章「方式の決定」** とする。既存の章番号は動かさない (第8章 未確定事項の後ろに足す)。決定記録は論点ごとに 1 件、第9章にだけ置く。

- 方式の決定を L0、L1、L2、L4、L5 に置かない。L0 の代替案の比較 (事業としての採否) は方式の決定ではなく、本書の対象外である。
- 必須論点を第8章 (未確定事項) へ書くだけで済ませない。必須論点は第9章に決定記録を持つ (§4.2)。

**3.2 L4 / L5 に詳細を置く**

詳細は L4 / L5 の該当文書 (例: `DOC-L4-DATA`、`DOC-L4-SECURITY`、`DOC-L5-PHYSICAL-DATA`) に置き、どの決定記録の詳細かを `DEC-NNN` で参照する (§6)。L4 / L5 は決定記録の「選んだ方式」「理由」「却下した案」を持たない。

**3.3 ADR との関係**

決定記録は、ADR を 1 件参照する (`ADR 参照` 欄)。ADR は既存の運用 (consumer の `docs/adr/`、テンプレート optional 014 の第3章 ADR 一覧) をそのまま使い、新しい ADR の様式を作らない。

| 持つもの | 置き場 |
|---|---|
| 選んだ方式、理由の要約、却下した案と却下の理由 (各 1〜2 文)、承認 | L3 の決定記録 (正本) |
| 背景、比較の根拠 (計測・制約の引用)、決定の履歴 | ADR |

ADR の「決定」は、決定記録の「選んだ方式」と同じ内容でなければならない (食い違うときは、ADR を直して再度承認を受ける。これは非著者 review で確かめ、機械では検査しない)。承認の正本は決定記録の承認欄であり、承認済みの記録が参照する ADR の status は `accepted` でなければならない (§4.1 の欄 7)。

## 4. 決定記録の必須項目

### 4.1 欄と規則

決定記録は次の欄をすべて持つ。

**空欄の規則 (全欄に共通):**

- 「欠ける」は、欄が無い、または値が空 (空文字、空の一覧) のことである。
- 欄 1・2・3・5・7・8・9・10 は、状態 (欄 9) を問わず、欠けたら `decision_field_missing:<欄名>` とする。
- 欄 4 (却下した案) の「案が 0 件」と、欄 6 (承認) の欠落は、`decision_field_missing` を出さず、下表の専用の reason だけを出す。欄 4 の「案はあるが却下の理由が空」は `decision_field_missing:却下した案` を出す。
- 欄 7 (ADR 参照) は、欄が無いか空なら `decision_field_missing:ADR 参照` だけを出す。path があるが ADR が存在しない、または status が合わないときは `adr_ref_invalid` だけを出す。
- 状態が `proposed` の記録は、欄 6 の 4 項目が空でよい (承認前の起草を許す明示の例外)。`superseded` の記録は、承認 4 項目を持っていた場合それを残す (消さない)。
- 複数の規則が同時に当たるときは、当たった reason をすべて出す。ある規則が別の規則を打ち消すことはない (専用の規則を持つ欄が、一般の規則と二重に出ることもない)。ただし、承認対象 revision (欄 6) が空の `approved` の記録は `approval_incomplete` だけを出し、比較基準の照合 (§4.3) は行わないので `approval_baseline_unavailable` は出さない。

| 欄 | 内容 |
|---|---|
| 1. 論点 | 論点 ID。 |
| 2. 選んだ方式 | 方式コードと説明を 1 つ。 |
| 3. 理由 | この要件・制約にどう合うか (要件 ID か制約を 1 つ以上引く)。 |
| 4. 却下した案 | 1 案以上。各案に却下の理由。選んだ方式と却下した案を合わせて 2 案以上が比較されていること。案が 0 件 (欄が無い、または空の一覧) なら `decision_alternatives_insufficient` だけを出す。案が 1 件以上あり、いずれかの案の却下の理由が空なら `decision_field_missing:却下した案` を出す。 |
| 5. 起草 | 起草者 (AI の場合はモデル名)。AI が推奨した方式コードを併記する。AI の推奨と選んだ方式が違うときは、PO の判断理由が欄 3 に書かれていること。 |
| 6. 承認 | §5.1。状態が `approved` のときは 4 項目すべてが必須で、1 つでも欠ければ `approval_incomplete` だけを出す (`decision_field_missing` は出さない)。状態が `proposed` のときは空でよい。 |
| 7. ADR 参照 | consumer の `docs/adr/` の ADR への path。その ADR が存在すること。状態が `approved` の記録では、その ADR の status が `accepted` であること。満たさなければ `adr_ref_invalid`。状態が `proposed` の間は、ADR が存在すれば status は問わない。 |
| 8. 詳細の置き場 | 詳細を書く予定の L4 / L5 文書 ID (`DOC-L4-DATA` など) を 1 つ以上。予定であり、存在は検査しない (§7)。 |
| 9. 状態 | `proposed` / `approved` / `superseded` のどれか。 |
| 10. 置換元 | この記録が置き換える旧 `DEC-NNN`。置換でなければ `-`。 |

### 4.2 必須論点

第9章は `data-store`、`tenant-isolation`、`authn` の 3 論点のそれぞれに、`superseded` でない決定記録をちょうど 1 件持つ。0 件なら `required_topic_missing:<論点 ID>`、2 件以上なら `decision_duplicate:<論点 ID>`。必須論点は、選んだ方式の値を限定しない。「分離なし」「外部 IdP に委譲」のように、その論点が要らない・自前で持たないという選択も、記録があれば適合である。

必須論点以外の論点 (ファイルストレージ、検索基盤など) は、方式の決定の定義 (§2) に当たるものを consumer が足す。足した論点も本書の規則に従う。

### 4.3 変更 (置換)

`approved` の決定記録の欄 2〜4 を、その記録の中で書き換えない。判定は **比較基準** との照合で行う。比較基準は、その記録の `承認対象 revision` (欄 6) の commit にある L3 第9章の、同じ `DEC-NNN` の記録の欄 2〜4 である (consumer の既存の Git 履歴から読み、新しい保管方式は作らない)。

この照合は、`承認対象 revision` が非空のときだけ行う。空のときは `approval_incomplete` (§5.1) だけを出し、比較基準の照合はしない (専用の規則を持つ欄を二重に出さない、§4.1)。

- 現行の欄 2〜4 が比較基準と食い違う: `approved_decision_edited_in_place`。
- 非空の承認対象 revision を Git 履歴で解決できない、またはその commit に同じ `DEC-NNN` の記録が無い: `approval_baseline_unavailable`。
- 食い違いが無い: 適合。最初から別の方式で承認された記録と、承認の後に書き換えられた記録を区別できるのは、この比較基準があるからである。

方式を変えるときは次の手順を踏む。

1. 新しい `DEC-NNN` を起こし、置換元に旧記録を書く。
2. 旧記録の状態を `superseded` にする (欄 2〜4 はそのまま残す)。
3. 新しい記録を §5 の承認に通す。ADR は新しい ADR を起こして旧 ADR を supersede する (accepted の ADR を in-place で反転しない)。

## 5. 承認と責任分担

### 5.1 承認の 4 項目

状態が `approved` の記録は、承認欄に次の 4 項目をすべて持つ。1 つでも欠けるなら `approval_incomplete`。

| 項目 | 内容 |
|---|---|
| 承認者 | PO の識別子。欄 5 の起草者と同じなら `approver_equals_drafter` で不適合。 |
| 承認日 | 日付。 |
| 承認対象 revision | 承認した時点の決定記録を含む文書の revision (commit の SHA)。 |
| 承認根拠 | 承認の発言の置き場への参照 (Issue / PR のコメントの URL)。新しい保管方式は作らない。 |

DoR (#1928) の署名は L0〜L3 全体に対する署名であり、本書の承認は決定記録 1 件ごとの承認である。DoR の署名は、必須論点の決定記録がすべて `approved` であることを前提に含む (§7)。

### 5.2 AI と PO の責任分担

| 担当 | することと、してはならないこと |
|---|---|
| AI | 論点を洗い出す (必須論点 3 種に、足りない論点を追加する)。論点ごとに 2 案以上の比較案を作り、案ごとに「この要件への適合」「後から変える難しさ」を書く。推奨を 1 つ付ける。決定記録を `proposed` で起草する。**承認の項目を埋めてはならない。必須論点の記録が `approved` にならないまま、AI が方式を選んで先へ進んではならない。** |
| PO | 比較案から 1 つを選ぶ、または差し戻す。承認の 4 項目の根拠 (コメント) を残す。AI の推奨と違う方式を選ぶときは、理由を伝える (AI が欄 3 に記録する)。 |

選択肢を並べるだけでは足りない。AI は比較に加えて推奨を出し、PO が承認して初めて `approved` になる。PO の判断は設計判断のエリシテーション (`docs/governance/design-decision-elicitation.md`) の形式 (前提・選択肢・trade-off・推奨 1 つ) に従って求める。

### 5.3 戻り経路

次のいずれかのとき、後続の設計・実装は進まず、段 0 (L0〜L3 と方式の決定を作る段、#1927) へ戻る。AI が方式を補って進めることは禁止する。

- 必須論点の記録が `approved` でない (§7)。
- L4 / L5 が、第9章に無い方式の選択を持つ (`decision_outside_l3`、§6.2)。
- L4 / L5 の詳細が、承認済みの方式と矛盾する (`detail_contradicts_decision`、§6.3)。

## 6. L4 / L5 との参照関係

**6.1 詳細は決定記録を参照する**

L4 / L5 で、必須論点 (および consumer が足した論点) の詳細を書く節は、冒頭に `DEC-NNN` を参照する。参照のない節は `detail_without_decision_ref`。これは L4 / L5 の側で参照を足せば直り、段 0 へは戻らない。

**6.2 L4 / L5 は決定を持たない**

L4 / L5 が、第9章に記録の無い論点について「選んだ方式」と「理由」を持つとき、`decision_outside_l3`。その選択が要るなら、第9章に決定記録を足して承認を受けてから、詳細を書く (段 0 へ戻る、§5.3)。

**6.3 矛盾**

L4 / L5 の必須の項目が、参照する決定記録の方式コードと両立しないときは、`detail_contradicts_decision`。判定は次の 2 つで行う。

1. その項目が `適用条件: <論点 ID>=<方式コード>` を持ち、参照する決定記録の方式コードが、その条件の値と異なる (機械で読める)。
2. その項目の記述が、選んだ方式の説明と直接反する (非著者 review が読む)。

矛盾は L4 / L5 の側の書き換えで解決しない。段 0 へ戻し (§5.3)、PO が決定記録の置換 (§4.3) か、詳細を決定記録に合わせた書き直しのどちらかを判断する。

## 7. DoR が読む範囲

DoR (#1928) が方式の決定について読むのは、**L3 第9章の決定記録 (§4.3 の比較基準として、承認対象 revision 時点の同じ第9章を含む) と、それが参照する ADR の存在・status だけ**とする。次の 3 点を確かめる。

1. 必須論点 3 種のそれぞれに、`superseded` でない決定記録がちょうど 1 件ある (§4.2)。
2. その記録が §4.1 の欄をすべて持つ。
3. その記録の状態が `approved` で、承認の 4 項目がそろい、ADR 参照が有効で、欄 2〜4 が比較基準と一致する (§5.1、§4.1 の欄 7、§4.3)。

満たさない論点は `decision_not_ready:<論点 ID>` とする。DoR は **L4 / L5 の詳細を読まない**。DoR を通る時点 (段 1) では L4 / L5 はまだ書かれていないため、`詳細の置き場` (欄 8) は予定を書くだけで、存在を検査しない。L4 / L5 の側の整合 (§6) は、段 2 の L4〜L6 の pair-freeze の非著者 review で確かめる。両者の範囲は重ならない。

| 検査 | 読む文書 | 時点 |
|---|---|---|
| 決定記録の存在・欄・承認 (§4、§5、§7) | L3 第9章と、参照する ADR の status | DoR (段 1) |
| 詳細が決定記録を参照し、矛盾しない (§6) | L4 / L5 | pair-freeze の review (段 2) |

## 8. テンプレートへの規則 (選択を尊重する)

テンプレート (consumer へ配る `docs/templates/vmodel`) は次を守る。#1930 は本書の freeze の後にこれへ合わせる。

1. **適用条件のない必須項目は、どの方式コードでも成り立つこと。** 特定の方式を前提にする項目は、適用条件を付ける。例: DB をテナントごとに分ける選択のとき、「全テーブルが tenant_id を持つ」を、適用条件のない必須項目にしない (`unconditional_item_presumes_decision`)。
2. 適用条件が承認済みの方式コードと合わない項目は非適用であり、欠けていても不適合にしない。
3. 方式を前提にした結論の文 (「RLS で分離する」「案C を採用する」など) を、例とも注記せずに本文へ置かない。例文を置くときは「例」と明示し、選択肢として並べる (`template_prefilled_decision`)。
4. テンプレートは第9章「方式の決定」と決定記録の欄 (§4.1) を、空の様式として持つ。必須論点の 3 種の見出しは置くが、「選んだ方式」の欄は空にする。

## 9. 判定の定義 (oracle の入力と出力)

| 判定 | 入力 | 出力 |
|---|---|---|
| `judgeDecisionRecords` | consumer の L3 第9章 (決定記録の一覧)、参照 ADR の存在・status、`approved` の各記録の `承認対象 revision` 時点の第9章 (比較基準、§4.3。`approved` の記録が無ければ不要) | 適合、または reason token の集合 (`decision_field_missing:<欄名>` / `decision_alternatives_insufficient` / `required_topic_missing:<論点 ID>` / `decision_duplicate:<論点 ID>` / `approval_incomplete` / `approver_equals_drafter` / `adr_ref_invalid` / `approved_decision_edited_in_place` / `approval_baseline_unavailable`)。DoR は、いずれかが出た必須論点、または状態が `approved` でない必須論点を `decision_not_ready:<論点 ID>` とする (§7)。 |
| `judgeDetailDocs` | 決定記録と、L4 / L5 の節 | 適合、または `detail_without_decision_ref` / `decision_outside_l3` / `detail_contradicts_decision`。いずれも L3 を書き換えない。後者 2 つは段 0 へ戻す (§5.3)。 |
| `judgeTemplateItems` | テンプレートの項目 (適用条件の有無) と決定記録 | 適合、`unconditional_item_presumes_decision`、`template_prefilled_decision`。非適用の項目の欠落は適合。 |

reason が複数当たるときは全部を出す (昇順、重複なし。§4.1 の空欄の規則に従い、専用の規則を持つ欄 4・6 は `decision_field_missing` と二重に出さない)。`承認対象 revision` が空なら `approval_incomplete` だけで、`approval_baseline_unavailable` は出さない (比較基準の照合は非空の revision だけが対象、§4.3)。

## 10. 不変条件

- 決定記録は L3 第9章にだけ置く。同じ論点の `superseded` でない記録は 1 件だけ。
- `approved` の記録は、承認 4 項目、有効な ADR 参照 (`accepted`)、欄 1〜4・8 がそろっている。
- 選んだ方式の値は限定しない。テンプレートも DoR も、特定の方式を要求しない。
- AI は承認の項目を書かない。
