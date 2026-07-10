---
plan_id: PLAN-L4-20-document-catalog-scale-profile-ssot
title: "PLAN-L4-20 (add-design): ドキュメントカタログ + 規模プロファイル SSoT (ZIP catalog.yaml/profiles.yaml 相当)"
kind: add-design
layer: L4
sub_doc: data
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / Codex
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T20:16:00+09:00"
    tests_green_at: "2026-07-08T20:16:00+09:00"
    verdict: approve
    scope: "PLAN-L4-20 P0 slice: ZIP catalog.yaml 相当の Vモデル文書カタログを `docs/governance/vmodel-document-catalog.md` に authoring source 化し、`document_catalog_entries` / search_index へ投影する。`document-system-map.md` は意味定義、DB は read-model という境界を維持し、検出系が設計正本を後追いできる形にした。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T20:12:00+09:00"
        evidence_path: src/state-db/spec-ir-projections.ts
        output_digest: "sha256:dba4fb880bd0a5ae88f4c30aab17066959a2aaf80b381cb54605592627dd9fea"
        anchor_commit: 9b29af3b955538560ca2e006c365a01603f54f2d
      - kind: unit_test
        command: "bun run vitest run tests/state-db.test.ts tests/projection-writer.test.ts tests/db-projection-ingestion.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T20:14:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:fb28667439a6f367908536433a0f8c2b1d7299c8bbcdc6a882f6d8183da3009e"
        anchor_commit: 9b29af3b955538560ca2e006c365a01603f54f2d
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T20:15:00+09:00"
        evidence_path: src/lint/db-projection-ingestion.ts
        output_digest: "sha256:026bd8f373f7735fcaf9418f4d51f0c0af8b7c8de72b6eb70ee10d1edfe4e156"
        anchor_commit: 9b29af3b955538560ca2e006c365a01603f54f2d
agent_slots:
  - role: tl
    slot_label: "TL - カタログ/プロファイル SSoT の契約設計、既存 document-system-map との重複整理"
  - role: se
    slot_label: "SE - profile adopt/skip 判定ロジックの導出元設計"
generates:
  - artifact_path: docs/plans/PLAN-L4-20-document-catalog-scale-profile-ssot.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-document-catalog.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-document-scale-profiles.md
    artifact_type: markdown_doc
  - artifact_path: src/schema/harness-db-tables-spec-ir.ts
    artifact_type: source_module
  - artifact_path: src/state-db/spec-ir-projections.ts
    artifact_type: source_module
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  references:
    - docs/design/harness/L4-basic-design/data.md
    - docs/governance/vmodel-document-catalog.md
    - docs/governance/vmodel-document-scale-profiles.md
    - docs/governance/vmodel-activation-profiles.md
    - docs/plans/PLAN-L6-50-execution-assignment-ledger.md
    - docs/plans/PLAN-L6-57-scope-detection-dry-run-preview.md
    - docs/plans/PLAN-L4-16-security-design-slot.md
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
    - .ut-tdd/audit/A-156-research-recovery-finding-route-ledger.md
---

# PLAN-L4-20: ドキュメントカタログ + 規模プロファイル SSoT

## 0. 背景 (ZIP 再監査 2026-07-08、advisor 相談済み、PO 指示による起票)

`.ut-tdd/audit/A-185` (2026-07-07) の §A④ (環境定義/ネットワーク/インフラ/DR-BCP等 product-select
gap) と §B③ (規模プロファイル機構) は `A-156` route ledger に feature-gap として route 評価済みだったが、
具体 PLAN 化されていなかった (未起票のまま残存)。2026-07-08 の ZIP 再監査 (拡張版、設計書 109 種 + メタ
yaml 8 種) で、参照 `catalog.yaml` (現行checked入力ではsemantic item 163件、category/status/detail/file
構造) と `profiles.yaml` (size 3件=PoC/Standard/Enterprise、product 5件を直交させる計8 profileの `adopt`/`detail_override`/`default_status` による
採用範囲・粒度の自動判定) の両方が、UT-TDD 側のどの既起票 PLAN (L6-50〜58) にも対応しないことを確認した。

本 PLAN は以下 3 点を統合する:

1. **ドキュメントカタログの正本化** (ZIP `catalog.yaml` 相当): document-system-map の個別ノード管理とは
   別に、種別・カテゴリ・状態を横断する一覧構造そのものを SSoT 化する。
2. **規模プロファイル機構** (ZIP `profiles.yaml`/`cmd_profile` 相当、A-185 §B③): PoC/Standard/Enterprise
   等のプロファイルに応じて、カタログ上の各ドキュメント種別を採用/skip/粒度 (詳細/標準/簡易) で自動判定する。
3. **product-select gap の吸収** (A-185 §A④): 環境定義/ネットワーク/インフラ/DR-BCP/変更管理等、UT-TDD
   自身には現状不要だが product-select 対象になりうる slot 群を、独立 slot ではなく本プロファイル機構の
   skip 判定で明示的に記録する (「無いこと」を機械的に残す。silent omission にしない)。

データディクショナリ/表示名ラベル/エラーメッセージ/i18n slot (A-185 §A③) も、本カタログの1エントリ
(データ系ドキュメント種別) として本 PLAN のスコープに含める。

## 1. 設計スコープ

1. ドキュメント種別カタログ (種別ID・カテゴリ・現状status・詳細度) の **tracked authoring source**
   (docs 配下の正本ファイル形式) を定義する。`harness.db` は認識される正本ではなく、この authoring
   source からの **projection 先** に限定する (正本と投影の混同を避ける)。
2. 規模プロファイル (最低 PoC/Standard/Enterprise 相当の 3 段階) ごとに、カタログ各エントリの
   採用/skip/粒度を宣言するデータモデルを設計する。既存 `docs/governance/vmodel-activation-profiles.md`
   (activation profile) および `PLAN-L6-57` (scope detection dry-run preview) との役割境界を明記する:
   本 PLAN はカタログ+規模プロファイルの **SSoT 定義**、`L6-57` はそれを使った **検出スコープの
   dry-run 表示**という上下関係とする。
3. skip 判定は `skip_sub_doc[].reason` 相当のフィールドで理由を必須にし、無言の欠落と区別する。
4. データディクショナリ/表示名/エラーメッセージ/i18n を、L4 `data.md` 拡張または新規カタログエントリ
   として back-fill する経路を設計する。

## 2. 受け入れ条件 (design freeze 時)

- authoring source (正本) と `harness.db` (projection) の境界が明記され、両者が混同されない。
- カタログ構造・プロファイル構造が L4 contract として固定される。
- 既存 document-system-map / `vmodel-activation-profiles.md` / `PLAN-L6-57` との役割境界が非重複で
  明記される。
- product-select skip 判定に理由必須フィールドがあり、「未着手」と「意図的 skip」が区別できる。
- PoC/Standard/Enterprise の `adopt|conditional|skip|defer`、`detail_override`、`status_override` が
  `document_scale_profile_entries` と `document_scale_profile_reviews` に投影され、検索・検出対象になる。
- catalog 欠落、skip/defer/conditional の理由欠落、`required_plan_id` 未解決は finding 化され、projection 側で
  profile 判定を補完しない。
