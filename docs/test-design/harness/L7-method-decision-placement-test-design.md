---
title: "L7 method decision placement test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L6-function-design/method-decision-placement.md
created: 2026-11-25
issue: 1923
---

# 方式の決定の置き場 テスト設計 (Issue #1923)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/method-decision-placement.md` である。本書はその §2 用語 (適用条件・適用条件の範囲・予約語・参照行)、§3.4 決定記録の書式 (未記入を含む)、§4 決定記録の必須項目、§5 承認、§6 L4 / L5 との参照関係、§7 DoR が読む範囲、§8 テンプレートへの規則、§9 判定の定義を検証する oracle を定義する。

この pair-freeze では候補 ID (`CANDIDATE-U-METHODDEC-*`) だけを宣言する。設計書は文書の契約であり、oracle は consumer の文書 (の節) を入力にした判定として書く。実装を伴う検査 (DoR の機械検査など) は #1928 が持ち、そこで正式 ID `U-METHODDEC-*` への昇格を設計書保護 gate (`design-protection-diff-gate.md` §10.2 / §10.3) の順序で入れる。

## 2. fixture

- 入力は、短い markdown の節 (L3 第9章、L4 / L5 の節、テンプレートの項目) を直接組んだもの。実 repo も GitHub も使わない。
- 既定の決定記録 `DEC-001`: 論点 `tenant-isolation`、選んだ方式 `db-per-tenant (DB をテナントごとに分ける)`、理由に要件 ID 1 件、却下した案 1 件 (`shared-schema-rls`、理由付き)、起草 `AI: claude-sonnet-5-5`、承認 4 項目すべて (承認者 `po-1`)、ADR 参照は存在する status `accepted` の ADR、詳細の置き場 `DOC-L4-DATA`、状態 `approved`、置換元 `-`。
- 既定の第9章は、`data-store` (`DEC-002`) と `authn` (`DEC-003`) の記録も、同様にそろった形で持つ。各記録は、見出し `##### 9-N <日本語名> (論点 ID: <論点 ID>)` の下に、欄名 | 値 の 2 列の表で置く (設計 §3.4)。行ごとに 1 点だけ変える。`approved` の各記録の比較基準 (承認対象 revision 時点の第9章) は、`judgeApprovedBaseline` の oracle (008) だけが入力に使い、同じ内容で添える。期待の reason 集合は、書いた token だけから成る (書かれていない reason は出ない)。

## 3. Candidate oracle matrix

「反例」は、同じ規則の逆の入力で、期待が反対になる (規則を広げすぎた実装を落とす)。

### 3.1 決定記録 (設計 §3.4、§4、§9 `judgeDecisionRecords`)

| ID | 入力 | 期待 | 反例 |
|---|---|---|---|
| `CANDIDATE-U-METHODDEC-001` | 既定の第9章 (3 論点とも完全) | 適合、reason なし | - (基準) |
| `CANDIDATE-U-METHODDEC-002` | `DEC-001` (`approved`) の `理由` を空にする。別ケース: `ADR 参照` の欄が無い。別ケース: `ADR 参照` の path があるが ADR が存在しない | 理由が空: `{decision_field_missing:理由}`。ADR 参照の欄が無い: `{decision_field_missing:ADR 参照}`。path のみ存在しない: `{adr_ref_invalid}` (各ケースの reason 集合はこれだけ) | 欄がそろっていれば、`詳細の置き場` が未作成の L4 文書 ID でも適合 (存在は見ない) |
| `CANDIDATE-U-METHODDEC-003` | `DEC-001` (`approved`) の `却下した案` が (a) 0 件 (欄が無い、または空の一覧) (b) 1 件で却下の理由が空 | (a) `{decision_alternatives_insufficient}` だけ (`decision_field_missing` は出さない) (b) `{decision_field_missing:却下した案}` だけ | 却下した案が 1 件で理由があれば適合 (選んだ方式と合わせて 2 案)。`proposed` の記録でも (a) (b) は同じ reason (空欄の例外は承認の欄だけ) |
| `CANDIDATE-U-METHODDEC-004` | (a) `tenant-isolation` の決定記録が無く、第8章 (未確定事項) に「テナント分離は TBD」と書いてあるだけ (b) `data-store` の `superseded` でない記録が 2 件 | (a) `required_topic_missing:tenant-isolation` (b) `decision_duplicate:data-store` | `tenant-isolation` の記録があり、選んだ方式が `none-single-org (分離なし、単一組織)` のとき適合 (値は限定しない)。`superseded` の旧記録と `approved` の新記録が 1 件ずつなら適合 |
| `CANDIDATE-U-METHODDEC-005` | `DEC-001` (状態 `approved`) の ADR 参照先が存在しない (別ケース: 存在するが status が `proposed`) | 各ケース `adr_ref_invalid` | 状態が `proposed` の記録で、ADR が存在し status が `proposed` なら適合 |

### 3.2 承認と責任分担 (設計 §5)

| ID | 入力 | 期待 | 反例 |
|---|---|---|---|
| `CANDIDATE-U-METHODDEC-006` | `DEC-001` の状態が `approved` で、(a) 承認根拠が空 (b) 承認対象 revision が空 (c) 承認の 4 項目がすべて空 | 各ケース `{approval_incomplete}` だけ (`decision_field_missing:承認` は出さない) | 状態が `proposed` で承認の 4 項目がすべて空なら適合 (承認前の起草を許す明示の例外)。ただし `proposed` でも `理由` が空なら `decision_field_missing:理由` |
| `CANDIDATE-U-METHODDEC-007` | 起草が `AI: claude-sonnet-5-5`、承認者も `claude-sonnet-5-5` | `approver_equals_drafter` | 承認者が `po-1` で承認根拠のコメント URL があれば適合。AI の推奨 (`shared-schema-rls`) と選んだ方式 (`db-per-tenant`) が違う記録でも、欄 3 に PO の判断理由があれば適合 |
| `CANDIDATE-U-METHODDEC-008` | `judgeApprovedBaseline` に、`approved` で承認対象 revision が非空の記録と、その revision 時点の第9章 (比較基準) を渡す。(a) 比較基準の `DEC-001` は `選んだ方式` が `db-per-tenant`、現行は同じ ID のまま `shared-schema-rls` (b) 非空の承認対象 revision が Git 履歴で解決できない (c) 承認対象 revision の第9章に `DEC-001` の記録が無い (d) 承認対象 revision が空の `approved` の記録 | (a) `{approved_decision_edited_in_place}` (b)(c) `{approval_baseline_unavailable}` (d) 空集合 (この判定は何も出さない。`approval_incomplete` は `judgeDecisionRecords` が出す、006) | (a') 比較基準も現行も `shared-schema-rls` (最初からその方式で承認された記録) なら適合。(a'') 新しい `DEC-004` (置換元 `DEC-001`) を起こし、`DEC-001` を `superseded` にして欄 2〜4 を残し、`DEC-004` の比較基準と現行が一致し欄 1〜10 そろっているなら適合 |

### 3.3 DoR が読む範囲 (設計 §7)

| ID | 入力 | 期待 | 反例 |
|---|---|---|---|
| `CANDIDATE-U-METHODDEC-009` | 3 論点とも `approved` で完全な第9章。L4 / L5 の文書は未作成、または内容が決定記録と矛盾。さらに、`DEC-001` の現行の欄 2 が承認対象 revision 時点の欄 2 と違う (比較基準と不一致、Git の履歴は渡さない) | DoR の読取りは ready (`decision_not_ready` なし)。L4 / L5 を読まず、Git も読まない。`approved_decision_edited_in_place` は DoR の出力に出ない (方式決定の検査の `judgeApprovedBaseline` が出す、008) | 第9章の `authn` の状態が `proposed` なら `decision_not_ready:authn` (L4 / L5 がどれだけ完成していても) |

### 3.4 L4 / L5 との参照関係 (設計 §6、§9 `judgeDetailDocs`)

| ID | 入力 | 期待 | 反例 |
|---|---|---|---|
| `CANDIDATE-U-METHODDEC-010` | (a) `DEC-002` の詳細の置き場が `DOC-L4-DATA` で、その文書に `DEC-002` の参照行が 1 行も無い (b) L4 の節が、第9章に記録の無い論点 `search-engine` の「選んだ方式」と「理由」を持つ | (a) `detail_without_decision_ref` (段 0 へ戻さない)、(b) `decision_outside_l3` (段 0 へ戻す) | 入力の記録集合を `DEC-002` だけに限定した場合 (`DEC-001` の置き場 `DOC-L4-DATA` を含めない)、`DOC-L4-DATA` が `参照する決定記録: DEC-002 (論点 ID: data-store)` を 1 行持てば適合。既定の記録集合のままなら、`DEC-001` の参照行も同文書に必要 (欠ければ `{detail_without_decision_ref}`、017) |
| `CANDIDATE-U-METHODDEC-011` | `DEC-001` の方式コードが `db-per-tenant`。`DOC-L5-PHYSICAL-DATA` が `DEC-001` を参照しつつ、`適用条件: tenant-isolation=shared-schema-rls` を持つ必須項目「全テーブルに tenant_id を必須とする」を必須として書く (`=` の条件。`!=` は 014) | `detail_contradicts_decision`。段 0 へ戻す。L4 / L5 の側の書き換えで解決しない | 決定記録の方式コードが `shared-schema-rls` のとき、同じ項目は適合。方式コードが `db-per-tenant` のとき、その項目を書かない L5 も適合 (非適用) |

### 3.5 テンプレートへの規則 (設計 §8、§9 `judgeTemplateItems`)

| ID | 入力 | 期待 | 反例 |
|---|---|---|---|
| `CANDIDATE-U-METHODDEC-012` | テンプレートの項目 (a) 適用条件なしの必須項目「全テーブルが tenant_id を持つ」 (b) 本文の結論文「RLS で分離する」を「例」と注記せずに置く | (a) `unconditional_item_presumes_decision`、(b) `template_prefilled_decision` | (a') 同じ項目に `適用条件: tenant-isolation=shared-schema-rls` を付け、決定記録が `db-per-tenant` のとき、項目は非適用で、欠けていても適合。(b') 「例」と明示した選択肢の並びは適合 |

### 3.6 決定記録の書式・適用条件・参照行 (設計 §2、§3.4、§6.1、§6.3、§8)

| ID | 入力 | 期待 | 反例 |
|---|---|---|---|
| `CANDIDATE-U-METHODDEC-013` | 既定の第9章の 1 点だけを変える。(a) 見出しが `##### 9-2 テナント分離 (論点 ID: Tenant_Isolation)` (b) `data-store` の見出しの下の表の `論点` が `tenant-isolation` (c) `DEC-001` の表の `記録 ID` が `DEC-1` (d) `DEC-001` の表に 3 列の行がある (e) `DEC-002` と `DEC-001` の両方が `記録 ID: DEC-001` | (a) `{decision_markup_invalid:heading, required_topic_missing:tenant-isolation}` (b) `{decision_markup_invalid:topic_mismatch, required_topic_missing:data-store}` (c) `{decision_markup_invalid:record_id, required_topic_missing:tenant-isolation}` (d) `{decision_markup_invalid:table_shape, required_topic_missing:tenant-isolation}` (e) `{decision_markup_invalid:record_id_duplicate, required_topic_missing:tenant-isolation, required_topic_missing:data-store}` (表 2 つとも数えないので、両論点が 0 件)。各ケースの集合はこれだけ | (a') 見出しの論点 ID を `` `tenant-isolation` `` と囲んでも囲まなくても適合 (同じ値)。(b') 見出しの下に無い注記の表は、reason を出さず記録にも数えない。(c') (c) と (d) を同時に満たす表は `table_shape` だけを出す (最初に当たった 1 種別) |
| `CANDIDATE-U-METHODDEC-014` | 項目 `適用条件: tenant-isolation!=none-single-org` を L5 に必須として書く。承認済みの `tenant-isolation` の方式コードが (a) `none-single-org` (b) `db-per-tenant` (c) `single-org` (予約語でない別の綴り) (d) 決定記録が `proposed` で承認済みが無い。別ケース: `適用条件: data-store=none-single-org` の項目を、`data-store` の方式コードが `none-single-org` のときに書く | (a) `detail_contradicts_decision` (条件が適用されない項目を書いた) (b) 適合 (c) 適合 (`none-single-org` でないので `!=` が適用される。コードの綴りの違いを「分離なし」とは読まない) (d) 適合 (評価しない)。別ケースは適合 (予約語は `tenant-isolation` だけで他の論点では特別な意味を持たない) | (a') (a) の項目を書かない L5 は適合 (非適用)。(b') (b) の項目を書かない L5 も、この判定は reason を出さない (適用される項目の欠落は非著者 review の範囲、機械の reason は無い)。(a'') `適用条件: tenant-isolation=none-single-org` の項目は (a) で適合 |
| `CANDIDATE-U-METHODDEC-015` | 適用条件の行が (a) `適用条件: tenant-isolation==db-per-tenant` (b) `適用条件: tenant-isolation=DB_Per_Tenant` (c) `適用条件: tenant-isolation<>db-per-tenant`。(a)〜(c) を L5 とテンプレートの両方に置く | 各ケース、`judgeDetailDocs` と `judgeTemplateItems` は `{applicability_condition_invalid}` を出す。抑えるのは条件を評価する `detail_contradicts_decision` と `unconditional_item_presumes_decision` だけ。(d) 併発: テンプレートの同じ項目に (a) の `適用条件: tenant-isolation==db-per-tenant` と本文の結論文「RLS で分離する」(「例」の注記なし) がある入力は `judgeTemplateItems` が `{applicability_condition_invalid, template_prefilled_decision}` (`template_prefilled_decision` は適用条件と独立) | `適用条件: tenant-isolation!=none-single-org` と `適用条件: tenant-isolation=db-per-tenant` は書式として適合 |
| `CANDIDATE-U-METHODDEC-016` | `DEC-001` (論点 `tenant-isolation`、詳細の置き場 `DOC-L5-PHYSICAL-DATA`) に対し、`DOC-L5-PHYSICAL-DATA` の参照行が (a) `参照する決定記録: DEC-001` (論点 ID なし) (b) `参照する決定記録: DEC-1 (論点 ID: tenant-isolation)` (c) `参照する決定記録: DEC-001 (論点 ID: data-store)` (論点が記録と違う) (d) `参照する決定記録: DEC-099 (論点 ID: tenant-isolation)` (第9章に無い記録) のいずれか 1 行だけ | 各ケース `{detail_without_decision_ref}` (数えない参照行しか無いので 0 件) | `参照する決定記録: DEC-001 (論点 ID: tenant-isolation)` は適合。論点 ID を `` `tenant-isolation` `` と囲んでも適合。数える 1 行に加えて (a)〜(d) の誤った行があっても、数える行が 1 件以上あるので適合 |
| `CANDIDATE-U-METHODDEC-017` | `DEC-001` の詳細の置き場が `DOC-L5-PHYSICAL-DATA` と `DOC-L4-DATA` の 2 つ。状態が `superseded` の旧記録 `DEC-000` の詳細の置き場は `DOC-L4-API`。入力の L4 / L5 の文書は 4 つ (`DOC-L5-PHYSICAL-DATA`、`DOC-L4-DATA`、`DOC-L4-API`、`DOC-L4-UI`)。`DOC-L5-PHYSICAL-DATA` は参照行を持ち、`DOC-L4-DATA` は持たない。`DOC-L4-API` と `DOC-L4-UI` は持たない | `{detail_without_decision_ref}` だけ (`DOC-L4-DATA` が 0 件。`DOC-L4-API` は `superseded` の記録の置き場、`DOC-L4-UI` はどの記録の置き場でもないので求めない) | `DOC-L5-PHYSICAL-DATA` が参照行を 1 行持てば、その文書の当該論点と関係の無い節に参照行が無くても適合 (文書単位)。`DOC-L4-DATA` を入力に渡さない (まだ書かれていない) 場合は判定しない。`DOC-L4-DATA` に参照行が 1 行あれば、どの節に置いても適合 (節の位置は判定しない。詳細を書いた節に置くのは書き方の推奨で非著者 review が読む) |

### 3.7 予約語 `row-level`・適用条件の範囲・ER 図・未記入 (設計 §2、§3.4、§8、#1965)

| ID | 入力 | 期待 | 反例 |
|---|---|---|---|
| `CANDIDATE-U-METHODDEC-018` | `judgeDetailDocs`。`DOC-L5-PHYSICAL-DATA` が `DEC-001` (論点 `tenant-isolation`) を参照し、`適用条件: tenant-isolation=row-level` を持つ必須項目「全テーブルにテナント識別列を持つ」を書く。`DEC-001` の方式コードが (a) `row-level` (b) `db-per-tenant` (c) `shared-schema-rls` (行レベルの意味の別の綴りでも、文字列が違う) (d) 状態 `proposed` で承認済みの記録が無い。別ケース (e): `judgeTemplateItems` に同じ項目を、決定記録なしで渡す | (a) 適合 (b) `{detail_contradicts_decision}` (c) `{detail_contradicts_decision}` (d) 適合 (評価しない) (e) 適合 (書式に合う条件。テンプレートは評価しない) | (b)(c) の項目を書かない L5 は適合 (非適用)。`DEC-001` の選んだ方式が `db-per-tenant` で、他に予約語の記録が無い第9章 (既定) は `judgeDecisionRecords` が適合 (予約語は決定を先に埋めず、選ぶことを求めない) |
| `CANDIDATE-U-METHODDEC-019` | 条件の終わり。(a) `judgeDetailDocs`、`DEC-001` の方式コードが `db-per-tenant`: 段落「適用条件: tenant-isolation=row-level のとき、全テーブルにテナント識別列を持つ。」を書く (b) `judgeDetailDocs`、`DEC-001` は `row-level`、`DEC-002` (`data-store`) の方式コードは `rdb`: 段落「適用条件: tenant-isolation=row-level、data-store=kvs のとき、全テーブルにテナント識別列を持つ。」を書く (c) `judgeTemplateItems`: 「適用条件: tenant-isolation=db_per_tenant のとき…」 (d) `judgeTemplateItems`: 「適用条件: 複数テナントのとき…」 (e) `judgeTemplateItems`: 「適用条件:tenant-isolation=row-level。」(コロンの直後に空白なし、句点で終わる) | (a) `{detail_contradicts_decision}` (条件は `tenant-isolation=row-level` で終わり、「のとき…」は条件に含まれない) (b) 適合 (条件は `tenant-isolation=row-level` だけ。続きの `data-store=kvs` は条件に含まれず評価されない) (c) `{applicability_condition_invalid}` (`db` で切れ、次の文字 `_` が条件の途中で切れていることを示す) (d) `{applicability_condition_invalid}` (文法に合う並びが取れない) (e) 適合 | `適用条件: tenant-isolation!=none-single-org` で行が終わる項目は適合 (行末で終わる)。(c) を `tenant-isolation=db-per-tenant のとき` に変えると適合 (`-` でつないだ最長の並びが条件) |
| `CANDIDATE-U-METHODDEC-020` | 掛かる範囲。(a) `judgeDetailDocs`: 1 段落に `適用条件: tenant-isolation=row-level のとき…。適用条件: data-store=rdb のとき…` の 2 つ (`DEC-001` は `db-per-tenant`) (b) `judgeTemplateItems`: 表の 1 行の 2 つのセルに 1 つずつ `適用条件:` (c) `judgeTemplateItems`: 箇条書き 1 項目の 1 行目と継続行に 1 つずつ (d) `judgeTemplateItems`: 空行で区切られた段落 A に `適用条件: tenant-isolation=row-level のとき…`、段落 B に適用条件なしの必須項目「全テーブルが tenant_id を持つ」 (e) `judgeTemplateItems`: 箇条書きの親の項目に `適用条件: tenant-isolation=row-level`、その子の項目に適用条件なしの必須項目「全テーブルが tenant_id を持つ」 | (a) `{applicability_condition_invalid}` だけ (条件を評価しないので `detail_contradicts_decision` は出ない) (b) (c) `{applicability_condition_invalid}` (d) `{unconditional_item_presumes_decision}` (段落 B だけ。A の条件は B に及ばない) (e) `{unconditional_item_presumes_decision}` (子の項目だけ。親の条件は子に及ばない) | 箇条書きの 2 つの別の項目、表の 2 つの別の行、2 つの別の段落に 1 つずつ `適用条件:` があるときは、それぞれの項目が 1 つなので適合 (書式が合えば) |
| `CANDIDATE-U-METHODDEC-021` | ER 図のエンティティ。`judgeTemplateItems` に `tenants` の行を渡す: (a) `\| tenants \| tenants テナント \| PK id, name, plan \|` (b) (a) の行に「(例)」を書く (c) (a) の行に `適用条件: tenant-isolation=row-level` を書く (d) (a) の行に `適用条件: tenant-isolation==row-level` を書く (e) (d) の行に「(例)」も書く (f) (a) の行は (a) のままで、直前の段落に `適用条件: tenant-isolation=row-level のとき tenants を置く` を書く | (a) `{template_prefilled_decision}` (b) 適合 (c) 適合 (d) `{applicability_condition_invalid, template_prefilled_decision}` (書式に合う条件が無く、「例」も無い) (e) `{applicability_condition_invalid}` (f) `{template_prefilled_decision}` (直前の段落の条件は行に及ばない。`unconditional_item_presumes_decision` は出ない) | `tenants` 以外のエンティティの行 (例 `users`) は、この規則では reason を出さない (方式を前提にするかは非著者 review が読む) |
| `CANDIDATE-U-METHODDEC-022` | 未記入 (プレースホルダ) の様式 (consumer の文書だけ。`judgeDecisionRecords` はテンプレートに適用しないので、テンプレートの入力は持たない)。consumer の第9章で、`data-store` と `authn` は完全、`tenant-isolation` の見出し (論点 ID は実際の値) の下の表だけが `記録 ID` = `<DEC-NNN>`、`選んだ方式` = `<方式コード…>`、他の欄もプレースホルダ | `{required_topic_missing:tenant-isolation}` だけ (`decision_markup_invalid:record_id` も `decision_field_missing:*` も出ない) | `記録 ID` を `DEC-1` にすると `{decision_markup_invalid:record_id, required_topic_missing:tenant-isolation}` (013c、プレースホルダではない)。`DEC-<NNN>` (一部だけが `<…>`、全体が 1 個の `<…>` でない) と `<DEC-NNN` (`>` で閉じない) も、`選んだ方式` などが未記入でない限り同じ集合 (記録 ID の形に合わない) |
| `CANDIDATE-U-METHODDEC-023` | 未記入の読みの境界。consumer の第9章で、`tenant-isolation` 以外は完全。`tenant-isolation` の表 (`DEC-001`、`approved`、他の欄は記入済み) について 1 点だけ変える。(a) `選んだ方式` を `db-per-tenant: Map<String, Tenant> を使う` (文章の一部に `<…>`) (b) `承認` を `承認者: <PO の識別子> / 承認日: 2026-11-25 / 承認対象 revision: <SHA> / 承認根拠: <URL>` (c) `記録 ID` を `<DEC-NNN>` にし、さらに 3 セルの行を 1 つ足す (d) `理由` を「要件 REQ-1 の Map<String, Tenant> に合う」 (e) 見出しを `##### 9-2 <日本語名> (論点 ID: <論点 ID>)` にし、表は完全 | (a) 適合、reason なし (3 行のどれも全体が 1 個の `<…>` でないので表は記録。値は空でないので `decision_field_missing:選んだ方式` は出ない) (b) 適合、reason なし (記録。承認の値は全体が 1 個の `<…>` でなく、各項目は空でないので `approval_incomplete` は出ない。`approver_equals_drafter` も出ない) (c) `{required_topic_missing:tenant-isolation}` だけ (`記録 ID` の全体が 1 個の `<…>` で未記入なので数えない表。`decision_markup_invalid:table_shape` は出ない) (d) 適合 (文章中の `<…>` は普通の文章) (e) `{decision_markup_invalid:heading, required_topic_missing:tenant-isolation}` (見出しは値ではないので本規則の対象外) | (a) の `選んだ方式` を空にすると `{decision_field_missing:選んだ方式}` (空は欠ける)。(a) の値を全体が 1 個の `<方式コード: 説明>` にすると未記入になる (025)。(c) の `<DEC-NNN>` を `<DEC-NNN` (閉じない) にすると、表は数えられ、最初に当たった種別だけの `{decision_markup_invalid:table_shape, required_topic_missing:tenant-isolation}`。`＜` `＞` の全角は (d) と同じく普通の文章 |
| `CANDIDATE-U-METHODDEC-024` | 項目の分け方 (最も内側の単位、設計 §2)。`DEC-001` (`tenant-isolation`) は `row-level`、`DEC-002` (`data-store`) は `rdb`。(a) `judgeDetailDocs`: 1 つの箇条書きの項目が、空行で区切られた 2 つの段落を持ち、段落 1 に `適用条件: tenant-isolation=row-level のとき、全テーブルにテナント識別列を持つ。`、段落 2 に `適用条件: data-store=rdb のとき、全テーブルに主キーを持つ。` (b) (a) で `DEC-001` を `db-per-tenant` にする (c) `judgeDetailDocs`: 1 つの箇条書きの項目の 1 つの段落 (空行なし、継続行あり) に `適用条件:` が 2 つ (d) `judgeDetailDocs`: 箇条書きの項目の中に表があり、表の 1 行に `適用条件: tenant-isolation=row-level`、その箇条書き自身の段落に `適用条件: data-store=rdb` (e) `judgeTemplateItems`: 1 つの箇条書きの項目が、空行で区切られた 2 つの段落を持ち、段落 1 に `適用条件: tenant-isolation=row-level のとき…`、段落 2 に適用条件なしの必須項目「全テーブルが tenant_id を持つ」 | (a) 適合、reason なし (2 つの段落は別の項目で、各条件は自分の段落だけに掛かる。両方とも適用される) (b) `{detail_contradicts_decision}` だけ (段落 1 だけが適用されない項目を書いた。段落 2 は適用される) (c) `{applicability_condition_invalid}` だけ (1 つの項目に 2 つ) (d) 適合、reason なし (表の行と段落は別の項目。1 項目に 1 つずつ) (e) `{unconditional_item_presumes_decision}` だけ (段落 2 だけ。段落 1 の条件は及ばない) | 空行の無い箇条書きの 1 項目に、継続行をまたいで 2 つの条件を書くと (c) と同じ (1 つの段落)。020(c) の期待は変わらない |
| `CANDIDATE-U-METHODDEC-025` | 未記入の 3 行 (設計 §3.4)。consumer の第9章で、`tenant-isolation` 以外は完全。`tenant-isolation` の表 (`DEC-001`、`approved`、他の欄は記入済み) について 1 行だけ、セルの全体を 1 個の `<…>` にする。(a) `記録 ID` を `<DEC-NNN>` (b) `選んだ方式` を `<方式コード: 説明>` (c) `承認` を `<承認者: … / 承認日: … / 承認対象 revision: … / 承認根拠: …>` (d) (b) の値の前後を空白で囲む (e) (b) の値をバッククォート 1 組で囲む (f) 3 行のうち 2 行を同時に未記入にし、さらに 3 セルの行を 1 つ足す。別ケース (g): `data-store` の表 (必須論点) の `選んだ方式` だけ (b) と同じ | (a)〜(f) `{required_topic_missing:tenant-isolation}` だけ (数えない表。`decision_markup_invalid:*`、`decision_field_missing:*`、`approval_incomplete` は出ない。新しい reason も出ない)。(g) `{required_topic_missing:data-store}` だけ | 必須論点でない論点 (例 `search-engine`) の表で同じ 1 行が未記入なら、reason なし。3 行のどれも未記入でなく、他の欄 (`理由` など) の全体が `<…>` なら、その欄は §4.1 の規則で読む (`理由` が全体 1 個の `<…>` でも空ではないので reason なし)。`選んだ方式` の行が無い表は未記入でなく、`{decision_field_missing:選んだ方式}` |
| `CANDIDATE-U-METHODDEC-026` | 未記入にならない読み (設計 §3.4)。025 と同じ表で、1 行だけ変える。(a) `選んだ方式` を `db-per-tenant: Map<String, Tenant> を使う` (b) `記録 ID` を `DEC-<NNN>` (c) `選んだ方式` を `**<方式コード: 説明>**` (太字) (d) `選んだ方式` を `<方式コード> <説明>` (`<…>` が 2 個) (e) `選んだ方式` を `<>` (中身が空) (f) `承認` を `承認者: <PO の識別子> / 承認日: 2026-11-25 / 承認対象 revision: <SHA> / 承認根拠: <URL>` (g) `選んだ方式` を全角の `＜方式コード＞` | (a) 適合、reason なし (b) `{decision_markup_invalid:record_id, required_topic_missing:tenant-isolation}` (未記入でなく、記録 ID の形に合わない値。表は数えない) (c)(d)(g) 適合、reason なし (空でなく、未記入でもない) (e) 適合、reason なし (`<>` は未記入でなく、空でもない) (f) 適合、reason なし (項目ごとの `<…>` は全体でない) | (a) の `選んだ方式` を `<db-per-tenant: Map<String, Tenant> を使う>` (外側が 1 個の `<…>` に見えるが、中に `<` があり `<` と `>` 以外の 1 字以上の並びに合わない) にすると、未記入でない (適合、reason なし) |
| `CANDIDATE-U-METHODDEC-027` | テナントを前提にした項目 (設計 §8.3)。`judgeTemplateItems`。入力の項目は、必須でない説明の文「他テナントのリソース ID を指定した要求は拒否する」で、前提にすると判定済みのもの。(a) 「例」の明示も適用条件も無い (b) 直前の段落に `適用条件: tenant-isolation!=none-single-org` を書き、項目の中には無い (c) 項目に `適用条件: tenant-isolation!==none-single-org` (書式に合わない) を書き、「例」の明示は無い (d) (c) に「(例)」も書く (e) 別ケース: テナント前提の表の行 (`テナント管理者 \| 自テナントの利用者を管理する`) に「例」も条件も無い (f) 別ケース: 表の列見出し `tenants` の列 (列全体がテナントを前提にする) に「例」も条件も無い | (a) `{template_prefilled_decision}` (b) `{template_prefilled_decision}` (条件は項目の外で及ばない) (c) `{applicability_condition_invalid, template_prefilled_decision}` (d) `{applicability_condition_invalid}` (e) `{template_prefilled_decision}` (f) reason なし (未決。形を定めず、本規則の対象外。oracle は「出さない」ことだけを固定し、列の条件の形は固定しない) | 前提にしないと判定された項目 (例: 「利用者は自分の項目を編集できる」) は reason なし |
| `CANDIDATE-U-METHODDEC-028` | テナントを前提にした項目の適合 (設計 §8.3)。027 の項目を使う。(a) 項目に「(例)」と明示する (b) 項目の中に `適用条件: tenant-isolation!=none-single-org` を書く (c) 項目の中に `適用条件: tenant-isolation=row-level` を書く (d) 同じ文を、2 つの別の表の行に 1 行ずつ置き、片方だけに条件を書く | (a)(b)(c) 適合、reason なし (d) 条件の無い行だけ `{template_prefilled_decision}` | 必須項目 (§8.1) が前提にする場合は、「例」の明示では §8.1 の判定を免れない: 適用条件の無い必須項目「全テーブルがテナント識別列を持つ」に「(例)」と書いても `{unconditional_item_presumes_decision}`。適用条件があれば適合 (012a') |

## 4. 数と網羅

oracle は 28 本。設計 §3.4・§4 (001〜005、013)、§5 (006〜008)、§7 (009)、§6 (010〜011、014〜017)、§8 (012、014〜015、018〜021、027〜028) を 1 本以上ずつ検証する。書式の規則は、見出し・表・表題の位置 (013)、`=` と `!=` と予約語 (014)、条件の書式違反 (015)、参照行の形 (016)、参照が要る範囲 (017) が 1 本ずつ検証する。§3 (置き場) は 001・004 が、§10 の不変条件のうち「AI は承認の項目を書かない」は 007 が、「選んだ方式の値を限定しない」は 004・011・012 の反例が検証する。

#1965 で足した規則は次のとおり。予約語 `row-level` (018)、適用条件の終わりと掛かる範囲と 1 項目 2 条件 (019〜020)、項目の分け方 (024)、ER 図のエンティティ (021)、`記録 ID` の未記入とその境界 (022〜023、025〜026) が 1 本以上ずつ検証する。各ケースの期待は reason の集合 1 つだけで、既存の 013〜015 の期待は変わらない (015 の書式違反 3 種は、適用条件の範囲の規則でも文法に合う並びが取れないので同じ `applicability_condition_invalid` になる)。

#1965 の決定 5・6 で足した・変えた規則は次のとおり。未記入の対象を `記録 ID` の 1 行から、`記録 ID`・`選んだ方式`・`承認` の 3 行に広げ、判定を「セルの全体が 1 個の `<…>`」にそろえた (025〜026)。それに合わせて 022 と 023 の入力と期待を直した (022: 空の様式の記録 ID を `DEC-<NNN>` から `<DEC-NNN>` へ。023: (a) の入力を文章中の `<…>` へ、(c) の記録 ID を `<DEC-NNN>` へ。(b) の期待は変わらない)。§8.3 を ER の `tenants` からテナントを前提にした項目すべてへ広げ、「例」の明示か適用条件を求める (027〜028)。表の列見出しの場合は未決で、027(f) は reason を出さないことだけを固定する。ほかの既存 oracle の ID と期待は変えていない。
