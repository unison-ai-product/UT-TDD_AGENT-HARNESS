---
plan_id: PLAN-L6-91-disposition-claim-integrity-gate
title: "PLAN-L6-91 (add-design/function-spec): disposition claim↔実体整合 gate —
  merge/adopt/reference 主張と受け皿正本の機械照合 (issue #119)"
kind: add-design
layer: L6
drive: db
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-22
updated: 2026-07-27
owner: PO / Claude (Fable orchestrator)
parent_design: docs/plans/PLAN-L4-22-vmodel-source-disposition-profile-ssot.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: TL - claim 語彙の型付き化境界と fail-close 判定基準
  - role: se
    slot_label: SE - disposition/scale-profiles/実体 doc の三面照合契約
  - role: qa
    slot_label: QA - claim 未履行・決定行欠落・未定義 axis の Red oracle
generates:
  - artifact_path: docs/plans/PLAN-L6-91-disposition-claim-integrity-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L4-22-vmodel-source-disposition-profile-ssot.md
  requires: []
  references:
    - docs/plans/PLAN-L7-417-source-disposition-profile-projection.md
    - docs/plans/PLAN-L6-70-source-catalog-profile-resolver-contracts.md
    - docs/plans/PLAN-L4-27-vmodel-semantic-self-audit.md
    - docs/governance/vmodel-document-disposition-catalog.md
    - docs/governance/vmodel-document-scale-profiles.md
  blocks: []
review_evidence: []
status: draft
sub_doc: function-spec
github_issue_id: 119
admission_receipt:
  schema_version: v2
  receipt_id: certificate:5525d5bfcf54efce57dfb03e55e46476
  command_id: plan-l6-91-20260727-03
  admitted_at: 2026-07-27T11:06:01.211Z
  source_digest: sha256:c857943873e799f2bbc09ceb25217f5db4a07406cbfade76df167a072a593557
  decision_digest: sha256:5b65c4e69c2443ad017b3f0c47fc20f637023bab63f5e63a67d1b6fb39c0b0e3
  receipt_digest: sha256:65e8aa9e80afb70d7cf45c1ea9eac2a300d3b5e696f73eba3f78b88c38428c54
  binding:
    path: docs/plans/PLAN-L6-91-disposition-claim-integrity-gate.md
    plan_id: PLAN-L6-91-disposition-claim-integrity-gate
    asset_id: plan:legacy:64bc729867f74597943e533396e4d022cf87e664059978169f9301441294ed75
    revision: 3
    content_digest: sha256:c857943873e799f2bbc09ceb25217f5db4a07406cbfade76df167a072a593557
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 119
    episode_id: E4-119
    projection_digest: sha256:47c39cd7edb4ddf54737a51e4e779a85a5bb89d81de5517526798fb01b79cf56
  origin:
    plan_id: PLAN-L4-22-vmodel-source-disposition-profile-ssot
    revision: 1
    digest: sha256:504335ff6ed703bdce449e496bea9dea5b4e556e9f885006f654e57bd92677a8
  reentry:
    target_plan_id: PLAN-L4-22-vmodel-source-disposition-profile-ssot
    target_revision: 2
    phase: forward_merge
  escape_reason: "2026-07-22の163 item忠実性監査で、disposition claimと受け皿正本の乖離3型
    (claim未履行/決定行欠落/未定義axis参照) が既存gate (PLAN-L7-417参照整合) で検出不能なまま存在することを実測した
    (issue #119)。Forward通常経路に該当layerの受け皿が無く、add-featureで検出器契約を追加する。"
---

# PLAN-L6-91: disposition claim↔実体整合 gate

## 1. 目的と実測根拠 (Issue #119)

checked ZIP semantic item 163 件の忠実性監査 (2026-07-22、8 レーン実測) で、
`vmodel-document-disposition-catalog.md` の統合主張 (claim) と受け皿正本の実体が乖離する 5 型を確認した:

1. **claim 未履行 (quota 型)**: 「architecture.md の provider/token concurrency policy へ統合」と merge 宣言
   しながら、統合先に該当内容が存在しない (grep 0 件)。
2. **決定行欠落 (billing 型)**: 「billing capability 案件のみ profile 採用」と prose reason で宣言しながら、
   `vmodel-document-scale-profiles.md` §2 に対応する決定行が存在せず、参照する saas axis 自体が §1 profile
   一覧に未定義。
3. **未定義 axis 参照 (regulated 型)**: 「regulated profile で採用」の参照先 profile が正本のどこにも定義
   されていない (二重欠落)。
4. **api-service doc_type 不在**: `api_gov` / `api_portal` / `api_webhook` を受ける typed `doc_type_id`
   が catalog に無く、採否を `adopt` / `not_applicable` の決定行として復元できない。
5. **product profile の item 粒度崩壊**: mobile / desktop 系 12 item の個別 claim が
   `DOC-L4-UI-STANDARD` 1 行へ集約され、`source_id` / `item_id` 単位の採否 coverage を証明できない。

既存機構はこれを検出できない。PLAN-L7-417 (confirmed) の fail-close は参照レベル (path 実在・ID 解決・
件数整合) 止まりで、path は実在するが中身・決定行が無い状態を green で通す。PLAN-L4-22 (draft) の
「unknown profile fail-close」も、採用条件が **prose reason** で書かれている限り型付き検査に掛からない。
`vmodel-document-catalog.md` 不変条件「source/item 側の orphan は fail-close する」は宣言のみで機構が無い。

## 2. 契約 (claim の型付き化と三面照合)

正本は authoring source (disposition catalog / scale-profiles / 実体 doc)、検出器はそれに従う
(設計を検出器へ合わせない)。

1. **型付き採用条件**: disposition catalog の `reference` 行は、prose reason に加えて機械可読の採用条件
   (`profile_axis` / `profile_id` / capability token) を持たなければならない。未定義 axis / 未登録
   profile を参照する行は fail-close (3 型目を検出)。
2. **決定行 join**: 採用条件が profile 採用を宣言する item/source は、`vmodel-document-scale-profiles.md`
   の決定表に対応する行 (doc_type × profile) が存在しなければならない。条件だけあって決定行が無い
   片方向 claim は fail-close (2 型目を検出)。
3. **claim anchor**: `merge` / `adopt` 行は統合先実体への anchor (統合先 doc 内の `source_ref` back-reference
   または section anchor) を持ち、anchor が統合先に実在しない claim は fail-close (1 型目を検出)。
   anchor 形式は security.md が既に実践する「実体は security.md §N (PLAN-L4-29)」方式を正規化する。
4. **not_applicable の明示**: 採用しない判断は reason 付き `not_applicable` としてのみ許可し、無音の
   欠落 (claim も判断記録も無い) を残さない (issue #121 の受け皿)。
5. **api-service typed doc_type join**: `api_gov` / `api_portal` / `api_webhook` は、authoring source が定義する
   typed `doc_type_id` と、その doc_type に対する `adopt` または reason 付き `not_applicable` 決定行を
   必須とする。doc_type 不在、決定行不在、自由記述だけの採否は fail-close する。
6. **product profile item coverage join**: mobile / desktop の採否は `source_id` / `item_id` ごとに決定行へ
   join できなければならない。複数 item を `DOC-L4-UI-STANDARD` 1 行へ集約して個別 coverage を失う状態は
   fail-close する。正本側の item 粒度を保持し、検出器都合で doc_type 1 行へ丸めない。
7. 検出結果は既存 doctor gate の fail-close 方針へ合流し、`plan-governance` / `rule-drift` と同じ
   常設検出面に載せる。

## 3. 既存 PLAN との関係

- **PLAN-L4-22 (parent)**: source/item/profile SSoT の join 整合を定義する。本 PLAN はその上に
  「claim の内容整合」層を追加する後続であり、L4-22 の「profile 8 件 exactly」不変条件は、axis 追加時に
  authoring source 側の宣言変更として扱う (検出器は宣言に従う)。
- **PLAN-L7-417 (confirmed)**: 参照整合 projection は前提として維持し、二重実装しない。
- **PLAN-L6-70 (draft)**: resolver は決定行が存在する前提の解決契約。本 PLAN が決定行の存在自体を
  保証する前段となる。
- **PLAN-L4-27 (draft)**: 163 item 検収の判定語彙 (`verified` 等) が腐らないための再発防止機構を提供する。

## 4. L6↔L7 pair / oracle

L7 test-design に `U-DISPCLAIM-*` を追加し、少なくとも次を mutation で固定する。

1. merge claim の anchor が統合先に無い fixture を fail-close する (quota 型回帰)。
2. profile 採用条件に対応する決定行が無い fixture を fail-close する (billing 型回帰)。
3. 未定義 axis / 未登録 profile を参照する fixture を fail-close する (regulated 型回帰)。
4. prose reason のみで型付き採用条件が無い `reference` 行を fail-close する。
5. reason 付き `not_applicable` 行は green、reason 無しは fail-close する。
6. `api_gov` / `api_portal` / `api_webhook` の typed doc_type または `adopt|not_applicable` 決定行を
   1 箇所ずつ欠落させた fixture を fail-close する。
7. mobile / desktop 12 item の `source_id` / `item_id` coverage を `DOC-L4-UI-STANDARD` 1 行へ集約した
   fixture を fail-close し、全 item が個別に join する fixtureだけを green にする。
8. 正常系 (anchor 実在 + 決定行 join + api-service decision + item coverage 成立) の実 repo fixtureが
   green である。

## 5. AC

- [ ] claim 語彙 (型付き採用条件 / claim anchor / not_applicable) が authoring source schema として
      固定され、`U-DISPCLAIM-1..8` の oracle で fail-close を証明する。
- [ ] issue #119 実測 5 型 (quota / billing・saas / regulated / api-service doc_type 不在 /
      mobile・desktop item 粒度崩壊) を検出器が全件検出する (実 repo 回帰 fixture)。
- [ ] api-service 3 item は typed doc_type と `adopt|not_applicable` 決定行へ全件 join し、欠落 0 を証明する。
- [ ] mobile / desktop 12 item は `source_id` / `item_id` 単位で coverage join し、
      `DOC-L4-UI-STANDARD` 1 行への集約による未追跡 item 0 を証明する。
- [ ] 検出器導入時点の既知乖離は「是正」または「正規の not_applicable / defer 記録」のどちらかへ収束し、
      無音欠落 0 で gate green になる。
- [ ] PLAN-L7-417 の参照整合 projection と二重実装しない (検査責務の分担を doc で固定)。
- [ ] cross-runtime blind review PASS、L7 実装 PLAN へ降下して confirmed 化する。

## 6. 降下先

L7 実装 (PLAN-L7-4XX 想定): disposition catalog / scale-profiles の authoring source 拡張 (型付き
採用条件・anchor 列)、三面照合検出器、doctor 合流、実 repo 回帰 fixture。hybrid cross-execution に
従い実装は Codex レーン (`ut-tdd codex`)、review は Claude 側で行う。
