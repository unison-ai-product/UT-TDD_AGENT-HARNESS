---
plan_id: PLAN-REVERSE-46-deliverable-catalog-extension
title: "PLAN-REVERSE-46: reverse back-fill for PLAN-L7-97 標準成果物カタログ拡張 — schema 契約変更 (VALID_SUB_DOCS) を設計/governance 正本へ合流"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: normalization
drive: be
status: completed
created: 2026-06-22
updated: 2026-06-22
forward_routing: L4
promotion_strategy: reuse-as-is
agent_slots:
  - role: tl
    slot_label: 'TL - deliverable-catalog 拡張の reverse back-fill review'
dependencies:
  parent: docs/plans/PLAN-L7-97-deliverable-catalog-extension.md
  requires:
    - docs/plans/PLAN-L7-97-deliverable-catalog-extension.md
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-46-deliverable-catalog-extension.md
    artifact_type: markdown_doc
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-REVERSE-46: reverse back-fill for deliverable-catalog 拡張 (PLAN-L7-97)

## Objective

`PLAN-L7-97` は `VALID_SUB_DOCS` (PLAN frontmatter を gate する exported 契約) を変更した
(L4 へ report/batch/notification/code-value を追加)。`KIND_BACKFILL[troubleshoot]="conditional"`
= 契約変更を伴う conditional kind は対応 Reverse 合流が無いと back-fill 未了 (conditionalPending warn)。
本 Reverse PLAN でその合流を登録し、契約変更 → 設計/governance 正本への back-fill を**駆動モデル
として正しく閉じる** (impl→Reverse→design back-merge の 1 サイクル、[[feedback_impl_must_backfill_to_design]])。

## Evidence (back-fill 実体)

L7-97 の schema 契約変更は、同 cycle で以下の設計/governance 正本へ back-fill 済 (本 Reverse はその登録):

- **正本**: `src/schema/index.ts` の `VALID_SUB_DOCS` (要件 §1.10.G.1 が schema を VALID_* の単一正本と規定)。
- **要件**: `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md §1.10.G.1` の L4 行 + grounding 注記。
- **基本設計 (L4 外部設計)**: `docs/governance/document-system-map.md §1 / §1b` 標準成果物カタログ
  (IPA 共通フレーム grounding、② プロダクト選択 区分)。
- **重複撤去 (normalization)**: `src/plan/lint.ts` の並行 `VALID_SUB_DOCS` コピーを撤去し schema 由来へ
  一本化 = カタログの正本を 1 箇所へ正規化 (confirmed_reverse_type=normalization の所以)。

## 駆動モデル是正の記録 (PO 監査 2026-06-22)

PO「駆動モデルは正しく使われている？」の指摘どおり、L7-97 を `kind=troubleshoot` (conditional back-fill、
warn 止まり) で起票し契約変更の Reverse 合流を省いていた = 駆動モデルの緩い使用。本 Reverse PLAN で
合流を formal に登録し、`isBackfilled(PLAN-L7-97)=true` (本 PLAN が requires) として conditionalPending
から外す。これにより「契約変更 conditional kind は Reverse 合流まで」が駆動モデルとして正しく閉じる。

forward_routing=L4 (カタログは L4 外部設計語彙) / promotion_strategy=reuse-as-is (schema 着地済、
合流登録のみ) / confirmed_reverse_type=normalization (重複 VALID_SUB_DOCS の単一正本化)。
