---
plan_id: PLAN-L5-14-ai-model-governance-card
title: "PLAN-L5-14 (add-design): AI モデルガバナンス・モデルカード台帳 (ZIP 70_モデルガバナンス・ML-BOM設計書 相当)"
kind: add-design
layer: L5
sub_doc: internal-processing
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / Codex
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L6
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - モデルカード台帳の契約設計、既存 model-id SSoT / routing 機構との役割境界"
generates:
  - artifact_path: docs/plans/PLAN-L5-14-ai-model-governance-card.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires:
    - docs/plans/PLAN-L7-256-model-id-ssot-drift-gate.md
  references:
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/plans/PLAN-L7-255-delegation-model-effort-injection.md
    - docs/plans/PLAN-L7-215-model-effort-advisor-routing.md
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
---

# PLAN-L5-14: AI モデルガバナンス・モデルカード台帳

## 0. 背景 (ZIP 再監査 2026-07-08、advisor 相談済み、PO 指示による起票)

ZIP `70_モデルガバナンス・ML-BOM設計書` は利用 AI モデルの来歴・モデルカード・評価/安全性 (HITL) を
定義する。UT-TDD は Claude/Codex/GPT 複数モデルの routing 統制を `PLAN-L7-255` (delegation model/effort
injection)・`PLAN-L7-256` (model-id SSoT drift gate)・`PLAN-L7-215` (advisor routing) で既に機構化済み
だが、これらは **routing の実装契約**であり、「利用モデル一覧 (Claude/Codex/GPT 各バージョン・提供元・
既知制限・想定用途)」を1枚にまとめた**モデルカード/来歴台帳**に相当するものは無いと確認した。

## 1. 設計スコープ

1. 利用中の各モデル (Claude family、GPT/Codex family) について、提供元・既知の制限・想定用途・
   セーフティ上の注意点を1覧にまとめるモデルカード台帳のデータモデルを設計する。
2. `PLAN-L7-256` の model-id SSoT と非破壊で連携する (SSoT が正、モデルカードはそれに紐づく
   メタデータ層) 契約とする。

## 2. 受け入れ条件 (design freeze 時)

- モデルカード台帳が `PLAN-L7-256` の model-id SSoT と重複せず、メタデータ層として位置づけられる。
