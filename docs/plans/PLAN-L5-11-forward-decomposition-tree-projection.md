---
plan_id: PLAN-L5-11-forward-decomposition-tree-projection
title: "PLAN-L5-11 (add-design/physical-data): Forward 分解ツリー射影 — 設計項目 node 粒度の左肺系譜 + 右肺鏡映 + 完備性 fail-close (空セル=永続エラー)"
kind: add-design
layer: L5
sub_doc: physical-data
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-07
updated: 2026-07-07
owner: PM / PO
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL — ツリー射影 schema / 完備性 invariant / 被覆規則 (≥1、非1:1) のレビュー"
  - role: se
    slot_label: "SE — §9.5 拡張 (decomposes/pairs エッジ + 完備性 lint + matrix view) の詳細設計"
generates:
  - artifact_path: docs/plans/PLAN-L5-11-forward-decomposition-tree-projection.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
dependencies:
  parent: docs/plans/PLAN-L5-01-physical-data.md
  requires: []
  references:
    - docs/plans/PLAN-L5-10-drive-model-router-redesign.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/design/harness/L6-function-design/vmodel-pair-freeze.md
    - docs/plans/PLAN-RECOVERY-10-right-lung-quality-assurance.md
    - docs/plans/PLAN-L7-248-diagram-view-expansion.md
    - src/lint/relation-graph.ts
    - src/state-db/projection-writer.ts
    - src/schema/harness-db-tables-graph.ts
---

# PLAN-L5-11 (add-design): Forward 分解ツリー射影

## Status

draft 起票 (2026-07-07 PO 裁定「フォワードはデータベースもイメージこうなってないとダメ」+
「こうなるためのフォワード設計定義」+ 採用判断承認「OKそれですすめて」)。

## 背景 — PO 正解イメージ (Forward の DB 正規形)

Forward の完備性 invariant (PLAN-L5-10 Appendix C ヘッダ原則) の **DB 上の正規表現**は、
左肺の分解ツリーと右肺の鏡映集約からなる行列 (matrix) である:

- 左肺: `L0 (企画) → L1-A (要求) → L3-AA (要件) → L4-A (基本) → L5 → L6 → L7 (実装)` の
  **設計項目粒度**の親子系譜 (doc 粒度ではない)。
- 右肺: `L8 (単体) → L9 (結合) → L10 (総合) → L12 (受入) → L13 (本番) → L14 (運用)` が左肺の
  対層 node を**基数まで鏡写しに集約**して L0 へ戻る (例: L12 セル群は L3 要件群と対応、
  L14 は L0 と対応)。
- 完備性 = この表に**空セルが無い**状態。空セルは機械の事実として検出され、散文の主張を要しない。

現状 DB とのずれ (2026-07-07 照合、実測):

1. `graph_nodes` は doc/file 粒度。`section_id` / `layer` は §9.5 で宣言済みだが projection 実装が
   空文字を書く (`src/state-db/projection-writer.ts` の relation-graph 射影)。設計項目粒度の系譜が
   DB に存在しない。
2. エッジは依存関係系 (`imports`/`references`/`tests` 等) のみで、**分解 (descent 親子) エッジの背骨**と
   **左右対エッジ**が第一級で存在しない。pair-freeze は doc 粒度 50 ペアの検査止まり。
3. 左 node に右対 node が無い状態を fail-close する完備性検査が graph 側に無い
   (absence-blindness。gate 所見 `missing-projection: changed-path has no relation graph node` が
   この穴の実測)。
4. L13 (本番) 列に対応する成果物ファミリーが未定義。

## 設計 scope — physical-data §9.5 拡張 (詳細設計)

1. **設計項目 node**: `graph_nodes` を設計項目粒度で張る。node = 安定 ID (既存 FR/BR/AT/U-xxx
   oracle ID 体系を第一 source とし、無い doc は heading anchor から導出) + `layer` (必須、空文字
   禁止) + `section_id` (doc 内位置)。ID の rename/split は supersession 記録を要する
   (系譜を黙って断絶しない)。
2. **エッジ 2 種の第一級化**: `decomposes` (左肺 親→子 descent、L0→L1→L3→L4→L5→L6→L7 の背骨) と
   `pairs` (左肺 node → 右肺対層 node、V-model ペア写像 L1↔L14 / L2↔L10 / L3↔L12 / L4↔L9 /
   L5↔L8 / L6↔L7 に従う)。既存 edge kind へ追加し、`is_expected`/`is_actual` の区別を保つ。
3. **被覆規則 (採用条件 a、PO 承認済)**: 鏡映は厳密 1:1 ではなく **「左 node は右ペア層で被覆数 ≥1」**
   (n:m 許容)。1:1 強制は stub セル埋めのゲーミング (Goodhart) を誘発するため不変条件にしない。
4. **セル実在の証跡拘束 (採用条件 b、PO 承認済)**: 右肺 node は oracle ID / テスト / evidence への
   参照を持たない限り「被覆」と数えない (PLAN claim discipline の graph 版。散文で埋めたセルは
   空セルと同判定)。
5. **完備性 lint (fail-close)**: 空セル (被覆 0 の左 node / descent 子 0 の中間 node) は
   **永続エラー** (作るまで消えない)。理由付き opt-out のみ許容し、opt-out は監査ログへ記録
   (PLAN-L5-10 C.2c のルール外部化と同型: `.ut-tdd/config` policy で project 単位に強化のみ可)。
6. **matrix view**: 行=左肺系譜 / 列=layer の表形式 query (`ut-tdd status --forward-tree` 相当) を
   projection から導出可能にする (human plane。PO の工程管理表と同型)。
7. **L13 成果物ファミリー定義**: 本番 (L13) 列の成果物種別と対応を定義する (現状未定義の列を
   埋める。粒度は L1 対応)。
8. **漸進移行**: 項目 ID を parse できない既存 doc は粗い doc 粒度 node + `warn` として可視化し、
   big-bang 書き直しを要求しない (欠落は隠さず warn で見える化)。
9. **駆動モデル = ブランチ overlay + 差し込み点 (PO 2026-07-07)**: 非 Forward 駆動 (Reverse /
   Recovery / Refactor / add-* 等) の PLAN・作業行は、本体ツリー (Forward = main) の外側に
   **ブランチ行**として置き、本体の node を指す**差し込み点 (insertion node = layer + node ID)**
   を持つ。差し込まれる layer は駆動モデルごとに異なり、それにより影響対象のテーブル領域
   (差し込み node から decomposes/pairs を下流展開したセル群) が変わる。
   - ブランチ行の基本内容 = **どういう内容か (駆動モデルの選択) + どういう順番で進めるか (plan)**。
   - **Reverse のみ追加で「どの駆動モデル (出所 branch/PLAN) から発し、本体のどこ (直す場所 =
     差し込み node) の修正が必要か」を必須で持つ** (Reverse 出所必須 invariant の DB 表現。
     Reverse = branch→main 合流ベクタ)。
   - 検出クエリは差し込み node から下流展開して修正すべきセルを列挙し、合流未了のブランチは
     対象 node を非 green (要修正) として保持する (branch→main 合流義務、PLAN-L5-10 C.2b の
     機械検出)。
   - **可監査性 (PO 2026-07-07)**: ブランチ行を見れば「本体のどこに手を入れる進め方をしたか」が
     後から追跡できること (差し込み node + 進行順 + 触れたセルの履歴)。Reverse は
     **「正しく Forward へ指し戻しできたか」自体を PLAN として記録**する (指し戻し先 node、
     反映内容、検証結果が plan 行と証跡で照合可能。指し戻し未検証の Reverse は合流完了と
     みなさない fail-close)。

## 非対象

- projection/lint の**実装**は後続 add-impl (L7) の scope (cold L7 禁止に従い本 PLAN の descent
  child として起票する)。
- 関数契約 (collect 系 signature 拡張) は L6 function-spec 追補の scope (L5-10/L6-38 と同型の
  粒度分担)。
- 既存 L1-L6 doc への安定 ID back-fill 作業自体は別 PLAN (本 PLAN は受け皿の schema と移行規則を
  設計する)。

## §3 工程表

### Step 1: §9.5 拡張設計 (設計項目 node + decomposes/pairs エッジ + 被覆規則) (SE) [直列]

physical-data §9.5 へ追補節を書く。後続の完備性 lint 設計がこの schema に依存
(downstream_dependency)。

### Step 2: 完備性 lint + opt-out 外部化 + L13 ファミリー + matrix view の設計 [直列]

Step 1 の schema を参照する検査・view 設計 (downstream_dependency)。

### Step 3: ③ 結合テスト設計ペア (L8) の追補 [並列]

L8-integration-test-design へ本射影の結合テスト設計 (GWT、検証戦略・検証設計を含む 3 点セット準拠)
を追加。別 doc のため並列可。

### Step 4: cross-runtime 設計レビュー (codex-tl) [直列]

完備性 invariant / 被覆規則 (≥1、非1:1) / 証跡拘束 / 漸進移行の整合を別ランタイムでレビュー
(downstream_dependency)。

## §3.1 実装計画

physical-data.md §9.5 に Forward 分解ツリー射影の追補節を書き、pair_artifact
(L8-integration-test-design.md) に結合テスト設計ペアを追加 → レビュー → confirmed 後、descent
child の add-impl (L7) が projection/lint を実装する (新ルーター規律の初適用: cold L7 禁止、
add-impl は本 PLAN の子として起票)。

## DoD / 受入基準

- [ ] physical-data.md §9.5 に設計項目 node / decomposes・pairs エッジ / 被覆規則 (≥1) /
      証跡拘束 / 完備性 lint (空セル=永続エラー、fail-close) / matrix view / L13 ファミリー /
      漸進移行の追補節がある (`ut-tdd doctor` design 系 green)。
- [ ] 被覆規則が「1:1 強制ではない」ことと、証跡なし右 node を被覆と数えないことが不変条件として
      明記される。
- [ ] pair_artifact (L8-integration-test-design.md) に結合テスト設計ペアがあり pair-freeze 孤児 0。
- [ ] cross-runtime レビュー (approve) が review_evidence に記録される。
- [ ] `ut-tdd plan lint` / `ut-tdd doctor` が green。
