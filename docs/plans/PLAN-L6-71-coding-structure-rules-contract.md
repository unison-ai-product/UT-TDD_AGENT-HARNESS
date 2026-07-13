---
plan_id: PLAN-L6-71-coding-structure-rules-contract
title: "PLAN-L6-71 (add-design): ZIP-DOC-095 クラス・メソッド構造規約の analyzer 契約 — 宣言済み規約の機械強制化"
kind: add-design
layer: L6
sub_doc: function-spec
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-13
updated: 2026-07-13
owner: PO / TL
parent_design: docs/plans/PLAN-L4-21-domain-vo-coding-constraints.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: "TL - 構造 rule 語彙 (nesting/CQS/メソッド長等) と閾値の契約判断"
  - role: qa
    slot_label: "QA - 負系 fixture と実 repo 回帰 (false-positive 封止) の oracle 設計"
generates:
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/plans/PLAN-L6-71-coding-structure-rules-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L4-21-domain-vo-coding-constraints.md
  requires:
    - docs/plans/PLAN-L4-21-domain-vo-coding-constraints.md
    - docs/plans/PLAN-L7-24-coding-rules-workflow.md
  blocks: []
  references:
    - .ut-tdd/audit/A-187-vmodel-checked-zip-divergence-audit-2026-07-13.md
    - docs/governance/coding-rules.md
    - docs/design/harness/L4-basic-design/data.md
review_evidence: []
---

# PLAN-L6-71 (add-design): クラス・メソッド構造規約の analyzer 契約

## 1. 問題 (A-187 §5 / ZIP-DOC-095)

PLAN-L4-21 で ZIP-DOC-094/095 の値オブジェクト方針とクラス・メソッド構造規約は
`docs/design/harness/L4-basic-design/data.md` §3.2 と `docs/governance/coding-rules.md` へ SSoT 化済み。
両 doc は「L6/L7 実装 PLAN で analyzer/oracle を追加後に hard gate へ昇格する」と宣言しているが、
その L6 契約が未起票のまま宙に浮いている。既存 `src/lint/coding-rules.ts` (PLAN-L6-23/L7-24) は
coding-rule SSoT と workflow anchor の欠落検出であり、構造規約 (nesting 深さ・CQS・メソッド構造等) の
機械検査は未実装 (grep 0 件、A-187 裏取り)。宣言のみの規約は `coding ≠ substance` の残債である。

## 2. 設計範囲

1. 検査対象 rule の語彙を L4 SSoT から確定する (機械判定可能な部分集合を選定し、判定不能規約は
   review 責務として明示区分する)。
2. analyzer の関数契約: 入力 (対象 TS ファイル集合)・出力 (finding 型)・閾値の宣言位置 (SSoT 側)・
   fail-close 境界を固定する。
3. 既存 coding-rules workflow analyzer (L6-23/L7-24) との責務分離と finding 合流先を定義する。
4. 段階導入契約: warn 期間 → hard gate 昇格の条件 (実 repo violation 0 化) を定義する。

## 3. 受入条件

- L4 SSoT の各構造規約が「機械検査対象 (rule id 付与)」か「review 責務 (理由付き)」へ排他分類され、
  宙吊り規約 0 件。
- analyzer 契約が negative fixture 族 (規約違反サンプル) と実 repo 回帰の両 oracle を宣言する。
- `ut-tdd plan lint` / doctor green。

## 4. 降下先

L7 実装 (analyzer + unit oracle + doctor 接続) は本契約 freeze 後に add-impl として後続起票し、
Reverse pairing を宣言する。
