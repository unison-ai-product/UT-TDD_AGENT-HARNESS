---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_disposition_claim_integrity
pair_artifact: docs/test-design/harness/L7-disposition-claim-integrity-test-design.md
---

# disposition claim 実体整合 gate 契約 (issue #119、未実装の目標契約)

> **実装状態**: 本書の契約は未実装である。2026-10-14 時点で `src/disposition/` と `src/document-disposition/` には
> 採用条件の型付き列、claim anchor、決定行 join の検出器は無い。本書は PLAN-L6-91 から還流した目標契約であり、
> 実装は L7 の add-impl で行う。oracle は `CANDIDATE-U-DISPCLAIM-*` のまま、実装 PR で Red を置いてから昇格する。

## 1. 目的

`docs/governance/vmodel-document-disposition-catalog.md` は、V-model 文書の統合・採用を claim として宣言する。
既存の参照整合 projection (PLAN-L7-417、path 実在・ID 解決・件数整合) は、path が実在すれば中身が無くても通す。
2026-07-22 の checked ZIP semantic item 163 件の忠実性監査 (8 レーン実測) で、claim と受け皿正本の実体が
乖離する 5 型が確認された。本書はその 5 型を機械で fail-close する検出器の契約を定める。

| 型 | 内容 |
|---|---|
| claim 未履行 (quota 型) | 「architecture.md の provider/token concurrency policy へ統合」と merge を宣言したが、統合先に該当内容が無い (grep 0 件) |
| 決定行欠落 (billing 型) | 「billing capability 案件のみ profile 採用」と prose reason で宣言したが、`vmodel-document-scale-profiles.md` §2 に対応する決定行が無く、参照する saas axis 自体が §1 の profile 一覧に未定義 |
| 未定義 axis 参照 (regulated 型) | 「regulated profile で採用」の参照先 profile が正本のどこにも定義されていない (二重欠落) |
| api-service doc_type 不在 | `api_gov` / `api_portal` / `api_webhook` を受ける typed `doc_type_id` が catalog に無く、採否を `adopt` / `not_applicable` の決定行として復元できない |
| product profile の item 粒度崩壊 | mobile / desktop 系 12 item の個別 claim が `DOC-L4-UI-STANDARD` 1 行へ集約され、`source_id` / `item_id` 単位の採否 coverage を証明できない |

`vmodel-document-catalog.md` の不変条件「source/item 側の orphan は fail-close する」は宣言だけで機構が無い。
profile の「unknown profile fail-close」(PLAN-L4-22) も、採用条件が prose reason で書かれている限り型付き検査に掛からない。

## 2. 検査契約 (claim の型付き化と三面照合)

正本は authoring source (disposition catalog / scale-profiles / 実体 doc) であり、検出器はそれに従う。
設計を検出器へ合わせない。

1. **型付き採用条件**: disposition catalog の `reference` 行は、prose reason に加えて機械可読の採用条件
   (`profile_axis` / `profile_id` / capability token) を持つ。未定義 axis または未登録 profile を参照する行は
   fail-close する (regulated 型)。prose reason だけで型付き採用条件が無い行も fail-close する。
2. **決定行 join**: 採用条件が profile 採用を宣言する item / source は、`vmodel-document-scale-profiles.md` の
   決定表に対応する行 (doc_type × profile) を持つ。条件だけあって決定行が無い片方向 claim は fail-close する
   (billing 型)。
3. **claim anchor**: `merge` / `adopt` 行は統合先実体への anchor (統合先 doc 内の `source_ref` back-reference、
   または section anchor) を持つ。anchor が統合先に実在しない claim は fail-close する (quota 型)。anchor 形式は
   `security.md` が既に実践する「実体は security.md §N (PLAN-L4-29)」方式を正規化する。
4. **not_applicable の明示**: 採用しない判断は reason 付き `not_applicable` としてのみ許可する。claim も判断記録も
   無い無音の欠落を残さない (issue #121 の受け皿)。
5. **api-service typed doc_type join**: `api_gov` / `api_portal` / `api_webhook` は、authoring source が定義する
   typed `doc_type_id` と、その doc_type に対する `adopt` または reason 付き `not_applicable` の決定行を必須とする。
   doc_type 不在、決定行不在、自由記述だけの採否は fail-close する。
6. **product profile item coverage join**: mobile / desktop の採否は `source_id` / `item_id` ごとに決定行へ join
   できなければならない。複数 item を `DOC-L4-UI-STANDARD` 1 行へ集約して個別 coverage を失う状態は fail-close する。
   正本側の item 粒度を保持し、検出器都合で doc_type 1 行へ丸めない。
7. **常設面への合流**: 検出結果は既存 doctor gate の fail-close 方針へ合流し、`plan-governance` / `rule-drift` と
   同じ常設検出面に載せる。

## 3. 責務の分担と依存

| 対象 | 関係 |
|---|---|
| 参照整合 projection (PLAN-L7-417、実装済み) | 前提として維持する。path 実在・ID 解決・件数整合は L7-417 が持ち、本検出器は二重実装しない。本書が足すのは claim の内容整合の層である |
| source / item / profile SSoT (PLAN-L4-22) | join 整合を定義する親。L4-22 の「profile 8 件 exactly」不変条件は、axis 追加時に authoring source 側の宣言変更として扱い、検出器は宣言に従う |
| resolver 契約 (PLAN-L6-70) | resolver は決定行が存在する前提で解決する。本書は決定行の存在自体を保証する前段であり、責務 A (決定行の存在保証、本書) の成果を責務 B (解決、L6-70) が使う実在の依存である |
| 163 item 検収の判定語彙 (PLAN-L4-27) | `verified` 等の語彙が腐らないための再発防止機構を、本書が提供する |

## 4. 受け入れ条件

- claim 語彙 (型付き採用条件 / claim anchor / not_applicable) が authoring source schema として固定される。
- issue #119 実測の 5 型を、実 repo 回帰 fixture で全件検出する。
- api-service 3 item は typed doc_type と `adopt|not_applicable` 決定行へ全件 join し、欠落 0 を証明する。
- mobile / desktop 12 item は `source_id` / `item_id` 単位で coverage join し、`DOC-L4-UI-STANDARD` 1 行への集約による
  未追跡 item 0 を証明する。
- 検出器導入時点の既知乖離は、是正または正規の `not_applicable` / defer 記録のどちらかへ収束し、無音欠落 0 で gate が green になる。
- 非著者 family の review が PASS し、L7 add-impl (authoring source 拡張、三面照合検出器、doctor 合流、実 repo 回帰 fixture)
  へ降下する。hybrid の cross-execution に従い、実装は Codex レーン、review は Claude 側で行う。

## 5. 検証の対

`docs/test-design/harness/L7-disposition-claim-integrity-test-design.md` (`CANDIDATE-U-DISPCLAIM-001..008`)。
