---
plan_id: PLAN-L6-58-agent-contract-digest-export
title: "PLAN-L6-58 (add-design): 実装リポジトリ持込用ダイジェスト生成 (ZIP agent_docs.py 相当)"
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
parent_design: docs/plans/PLAN-L6-47-agent-contract-authoring-source.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - digest export の契約 (L6-47 confirmed 契約への非破壊追加)"
generates:
  - artifact_path: docs/plans/PLAN-L6-58-agent-contract-digest-export.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-47-agent-contract-authoring-source.md
  requires:
    - docs/plans/PLAN-L7-391-agent-contract-detect-gate.md
  references:
    - docs/governance/vmodel-upgrade-schedule.md
    - docs/governance/vmodel-agent-contracts.md
---

# PLAN-L6-58: 実装リポジトリ持込用ダイジェスト生成

## 0. 背景 (ZIP 比較監査 2026-07-08 再監査、advisor 相談済み、PO 指示による代理起票)

ZIP `agent_docs.py` (`build/agent/{architecture,coding,test,design,marketing}.md` 生成、
編集禁止ヘッダ付き読み取り専用ビュー) 相当が未起票。agent-contract authoring/detect
(L6-47/L7-391) は **contract の authoring と検出**のみで、ダウンストリーム実装
リポジトリへ持ち込む digest 生成は別機能。L6-47 は **status: confirmed 済み**のため
(起票前に status 確認済み)、既存契約への note 追記ではなく本 PLAN を独立 dependency
として起票する (PLAN claim discipline: confirmed 済み契約への無断上書きをしない)。

## 1. 設計スコープ

1. agent_contracts projection から、実装リポジトリ持込用の digest (アーキテクチャ /
   コーディング規約 / テスト方針 / 設計方針 の複数ビュー) を生成する。
2. 生成物は読み取り専用ビューとし、正本 (docs/governance) への書き戻しを防ぐ
   編集禁止マーカーを付与する。

## 2. 受け入れ条件 (design freeze 時)

- digest の入出力契約・ビュー種別が L6 contract として固定される。
- L6-47 (confirmed) の契約を変更せず、非破壊で積み上げる依存関係になっている。
