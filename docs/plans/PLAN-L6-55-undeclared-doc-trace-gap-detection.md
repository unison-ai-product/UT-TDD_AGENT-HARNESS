---
plan_id: PLAN-L6-55-undeclared-doc-trace-gap-detection
title: "PLAN-L6-55 (add-design): 未宣言ドキュメント trace ギャップ検出 (ZIP derive_traces + activation 相当、サンセット条件付き)"
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
parent_design: docs/plans/PLAN-L6-43-typed-spec-trace-closure.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - lite 導出 + 三層分類ギャップ検出の契約、サンセット閾値の確定"
  - role: se
    slot_label: "SE - 未宣言 doc スキャンの投影設計"
generates:
  - artifact_path: docs/plans/PLAN-L6-55-undeclared-doc-trace-gap-detection.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-43-typed-spec-trace-closure.md
  requires:
    - docs/plans/PLAN-L7-387-typed-spec-trace-closure-gate.md
  references:
    - docs/governance/vmodel-upgrade-schedule.md
    - docs/plans/PLAN-L6-41-vmodel-activation-profile-join.md
---

# PLAN-L6-55: 未宣言ドキュメント trace ギャップ検出 (サンセット条件付き)

## 0. 背景 (ZIP 比較監査 2026-07-08 再監査、advisor 相談済み、PO 指示による代理起票)

`ut-tdd advisor` (claude-fable-5) の判断: ZIP `derive_traces.py` (未宣言 doc からの trace
機械導出) を「typed-spec 普及で価値が下がるので skip」とした前回判断は**結論が逆**。
移行期こそ未宣言 doc が最多であり、trace-closure gate (L6-43/L7-387) は**宣言済み集合の
内側でしか回らない**ため、未宣言 doc は空虚に green を通過する — coverage ≠ substance /
absence-blindness の型そのもの。skip ではなく **サンセット条件付きで起票**する。
ZIP `activation.py` の宣言元/詳細化/記述 三層分類 + 未宣言ギャップ検出も同一軸のため、
advisor 提案どおり 1 本の PLAN に統合する (L6-41 は profile×schedule join のみで
doc 粒度の三層分類・ギャップ検出は持たないことを確認済み)。

## 1. 設計スコープ

1. **lite 導出**: full 導出(ZIP 相当) ではなく、trace 未宣言 doc の**検出レポート**に
   縮退する。fail-close は段階導入 (初期は warn、閾値到達後に gate 昇格)。
2. **三層分類**: 全 doc を「宣言元 (型宣言を持つ定義元)」「詳細化 (正本 ID を参照)」
   「記述 (ID 不要な方針書)」に分類し、正本カバレッジと未宣言ギャップを可視化する。
3. **サンセット条件**: typed-spec カバレッジが閾値 N% (TL が確定) に到達した時点で
   本機構を deprecate する契約を明記する。閾値なしの「過渡的」判断は禁止
   (advisor 指摘: 感想ではなく数値で持つ)。

## 2. 受け入れ条件 (design freeze 時)

- lite 導出 schema・三層分類・サンセット閾値の L6 contract が固定される。
- L6-43/L7-387 (宣言済み trace の閉包検証) との検出範囲の非重複が説明される。
