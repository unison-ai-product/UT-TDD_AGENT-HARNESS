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

対になる設計文書は `docs/design/harness/L6-function-design/method-decision-placement.md` である。本書はその §4 決定記録の必須項目、§5 承認、§6 L4 / L5 との参照関係、§7 DoR が読む範囲、§8 テンプレートへの規則、§9 判定の定義を検証する oracle を定義する。

この pair-freeze では候補 ID (`CANDIDATE-U-METHODDEC-*`) だけを宣言する。設計書は文書の契約であり、oracle は consumer の文書 (の節) を入力にした判定として書く。実装を伴う検査 (DoR の機械検査など) は #1928 が持ち、そこで正式 ID `U-METHODDEC-*` への昇格を設計書保護 gate (`design-protection-diff-gate.md` §10.2 / §10.3) の順序で入れる。

## 2. fixture

- 入力は、短い markdown の節 (L3 第9章、L4 / L5 の節、テンプレートの項目) を直接組んだもの。実 repo も GitHub も使わない。
- 既定の決定記録 `DEC-001`: 論点 `tenant-isolation`、選んだ方式 `db-per-tenant (DB をテナントごとに分ける)`、理由に要件 ID 1 件、却下した案 1 件 (`shared-schema-rls`、理由付き)、起草 `AI: claude-sonnet-5-5`、承認 4 項目すべて (承認者 `po-1`)、ADR 参照は存在する status `accepted` の ADR、詳細の置き場 `DOC-L4-DATA`、状態 `approved`、置換元 `-`。
- 既定の第9章は、`data-store` (`DEC-002`) と `authn` (`DEC-003`) の記録も、同様にそろった形で持つ。行ごとに 1 点だけ変える。`approved` の各記録には、承認対象 revision 時点の第9章 (比較基準) を同じ内容で添える。期待の reason 集合は、書いた token だけから成る (書かれていない reason は出ない)。

## 3. Candidate oracle matrix

「反例」は、同じ規則の逆の入力で、期待が反対になる (規則を広げすぎた実装を落とす)。

### 3.1 決定記録 (設計 §4、§9 `judgeDecisionRecords`)

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
| `CANDIDATE-U-METHODDEC-008` | 入力に比較基準を渡す (`approved` の `DEC-001` の `承認対象 revision` 時点の第9章)。(a) 比較基準の `DEC-001` は `選んだ方式` が `db-per-tenant`、現行は同じ ID のまま `shared-schema-rls` (b) 非空の承認対象 revision が Git 履歴で解決できない (c) 承認対象 revision の第9章に `DEC-001` の記録が無い | (a) `{approved_decision_edited_in_place}` (b)(c) `{approval_baseline_unavailable}` | (a') 比較基準も現行も `shared-schema-rls` (最初からその方式で承認された記録) なら適合。(a'') 新しい `DEC-004` (置換元 `DEC-001`) を起こし、`DEC-001` を `superseded` にして欄 2〜4 を残し、`DEC-004` の比較基準と現行が一致し欄 1〜10 そろっているなら適合 |

### 3.3 DoR が読む範囲 (設計 §7)

| ID | 入力 | 期待 | 反例 |
|---|---|---|---|
| `CANDIDATE-U-METHODDEC-009` | 3 論点とも `approved` で完全な第9章。L4 / L5 の文書は未作成、または内容が決定記録と矛盾 | DoR の読取りは ready (`decision_not_ready` なし)。L4 / L5 を読まない | 第9章の `authn` の状態が `proposed` なら `decision_not_ready:authn` (L4 / L5 がどれだけ完成していても) |

### 3.4 L4 / L5 との参照関係 (設計 §6、§9 `judgeDetailDocs`)

| ID | 入力 | 期待 | 反例 |
|---|---|---|---|
| `CANDIDATE-U-METHODDEC-010` | (a) `DOC-L4-DATA` の保存方式の節が `DEC-NNN` を参照していない (b) L4 の節が、第9章に記録の無い論点 `search-engine` の「選んだ方式」と「理由」を持つ | (a) `detail_without_decision_ref` (段 0 へ戻さない)、(b) `decision_outside_l3` (段 0 へ戻す) | `DEC-002` を冒頭で参照し、スキーマだけを書いた L4 の節は適合 |
| `CANDIDATE-U-METHODDEC-011` | `DEC-001` の方式コードが `db-per-tenant`。`DOC-L5-PHYSICAL-DATA` が `DEC-001` を参照しつつ、`適用条件: tenant-isolation=shared-schema-rls` を持つ必須項目「全テーブルに tenant_id を必須とする」を必須として書く | `detail_contradicts_decision`。段 0 へ戻す。L4 / L5 の側の書き換えで解決しない | 決定記録の方式コードが `shared-schema-rls` のとき、同じ項目は適合。方式コードが `db-per-tenant` のとき、その項目を書かない L5 も適合 (非適用) |

### 3.5 テンプレートへの規則 (設計 §8、§9 `judgeTemplateItems`)

| ID | 入力 | 期待 | 反例 |
|---|---|---|---|
| `CANDIDATE-U-METHODDEC-012` | テンプレートの項目 (a) 適用条件なしの必須項目「全テーブルが tenant_id を持つ」 (b) 本文の結論文「RLS で分離する」を「例」と注記せずに置く | (a) `unconditional_item_presumes_decision`、(b) `template_prefilled_decision` | (a') 同じ項目に `適用条件: tenant-isolation=shared-schema-rls` を付け、決定記録が `db-per-tenant` のとき、項目は非適用で、欠けていても適合。(b') 「例」と明示した選択肢の並びは適合 |

## 4. 数と網羅

oracle は 12 本。設計 §4 (001〜005)、§5 (006〜008)、§7 (009)、§6 (010〜011)、§8 (012) を 1 本以上ずつ検証する。§3 (置き場) は 001・004 が、§10 の不変条件のうち「AI は承認の項目を書かない」は 007 が、「選んだ方式の値を限定しない」は 004・011・012 の反例が検証する。
