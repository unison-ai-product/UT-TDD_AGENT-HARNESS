---
plan_id: PLAN-L6-59-design-doc-cross-integrity-check
title: "PLAN-L6-59 (add-design): 設計 doc 横断整合性チェック — 重複定義+循環依存検出 (ZIP cmd_check 相当)"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / Codex
parent_design: docs/plans/PLAN-L4-20-document-catalog-scale-profile-ssot.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - 設計 doc 級の重複定義/循環依存検出契約、既存 namespace 個別 dup / module 級 cycle との境界確認"
generates:
  - artifact_path: docs/plans/PLAN-L6-59-design-doc-cross-integrity-check.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L4-20-document-catalog-scale-profile-ssot.md
  requires:
    - docs/plans/PLAN-L4-20-document-catalog-scale-profile-ssot.md
    - docs/plans/PLAN-L6-43-typed-spec-trace-closure.md
  references:
    - src/plan/lint.ts
    - src/lint/dependency-drift.ts
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
    - .ut-tdd/audit/A-156-research-recovery-finding-route-ledger.md
---

# PLAN-L6-59: 設計 doc 横断整合性チェック

## 0. 背景 (ZIP 再監査 2026-07-08、advisor 相談済み、PO 指示による起票)

`.ut-tdd/audit/A-185` §B① で route 評価済み (`A-156` candidate) だったが未起票。ZIP `build.py cmd_check`
は ID 族 (`R-`/`NR-`/`F-`/`SC-`/`T-`/`API-`/`IF-`/`BT-`/`UT-`…) を対象に、全 doc 横断で以下 4 種の構造矛盾を
一括検出する。UT-TDD 側は以下の通り部分カバーに留まる (裏取り済):

| 検出 | UT-TDD 現状 | 差分 |
|---|---|---|
| 参照切れ | covered: relation-graph `missing-projection` / trace | 同等 |
| 孤立定義 | covered: descent-obligation / forward-convergence orphan | 同等 |
| **重複定義** | partial: namespace 個別のみ (`duplicate_plan_id`, `src/plan/lint.ts:664`) | **設計 doc 横断の oracle/entity ID 重複定義は非カバー** |
| **循環依存** | partial: module 級のみ (`src/lint/dependency-drift.ts:218 detectCycles`) | **設計 doc 間 (doc a が doc b 定義 ID を参照する循環) は非カバー** |

本 PLAN は `PLAN-L4-20` のカタログ SSoT に加え、`PLAN-L6-43` (typed-spec-trace-closure) の
`spec_defs`/`spec_relations` 投影を ID 定義元マップの入力とする (カタログのみでは ID 族の実体定義
粒度が不足するため)。設計 doc 級の重複定義検出・循環依存検出を doctor へ追加する契約を設計する。

## 1. 設計スコープ

1. `PLAN-L4-20` のドキュメントカタログと `PLAN-L6-43` の `spec_defs`/`spec_relations` を ID 族の
   定義元マップとして利用する。
2. 同一 ID 族内で複数 doc が同じ ID を定義するケースを重複として検出する契約を設計する。
3. doc a → doc b (b 定義 ID を参照) のエッジから DFS で循環を検出する契約を設計する
   (既存 `detectCycles` は module 級であり、本 PLAN は設計 doc ノード級で再設計する)。
4. 検出結果は既存 doctor gate の fail-close 方針に合流させる。

## 2. 受け入れ条件 (design freeze 時)

- 重複定義検出の対象 ID 族・doc 単位の粒度が固定される。
- 循環依存検出が既存 module 級 `detectCycles` と非重複であることが明記される。
- `PLAN-L4-20` のカタログ構造が確定するまで本 PLAN は `requires` でブロックされる。
