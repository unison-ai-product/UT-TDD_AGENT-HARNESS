---
plan_id: PLAN-L4-27-vmodel-semantic-self-audit
title: "PLAN-L4-27 (add-design): ZIP 163 semantic item対HARNESS自己適合監査"
kind: add-design
layer: L4
sub_doc: architecture
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L5
agent_slots:
  - role: tl
    slot_label: "TL - semantic itemのHARNESS適用意味と正しさ判定"
  - role: se
    slot_label: "SE - 設計/実装/DB/CLI/guardの実体evidence照合"
  - role: qa
    slot_label: "QA - oracle/test/evidence、false-green、負債routing"
generates:
  - artifact_path: docs/governance/vmodel-semantic-item-self-assessment.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-upgrade-schedule.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L4-22-vmodel-source-disposition-profile-ssot.md
    - docs/plans/PLAN-L4-25-repository-docs-engine-swap-audit.md
    - docs/plans/PLAN-L4-26-engine-swap-object-method-design.md
    - docs/governance/vmodel-semantic-item-catalog.md
---

# PLAN-L4-27: ZIP 163 semantic item対HARNESS自己適合監査

## 1. 目的

checked ZIPの163 semantic itemを比較表に載せるだけでなく、HARNESS自身の設計・実装・検証が各itemの意味を
正しく満たすかを全件監査する。path、doc slot、関数名、DB tableが存在するだけでは適合と判定しない。

## 2. 判定語彙

| state | 意味 |
|---|---|
| `verified` | authored design、runtime実装、oracle/test、実行evidenceが意味契約を満たす |
| `partial` | 一部artifactはあるが意味、edge、test、運用証拠のいずれかが不足 |
| `gap` | HARNESSに必要だが設計または実装が無い/誤っている |
| `profile_conditional` | 特定product/size profileでのみ必要。profile resolverとskip理由を検証済み |
| `not_applicable` | HARNESS製品境界外。理由とowner承認を記録 |
| `pending_review` | 未検収。green/coverage計算へ含めない |

## 3. itemごとの必須証拠

- applicabilityとHARNESSでの意味翻訳
- canonical design path/sectionとtarget slot
- runtime module/class/method/CLI/DB projectionのうち該当する実体
- unit/property/integration/system/operational oracle ID
- 最新test/evidence digestと対象commit/revision
- mismatch時のseverity、debt PLAN、owner、期限またはmigration wave

## 4. 受入条件

- 163 itemがexactly once評価され、`pending_review`が0件である。
- `verified`はdesign+implementation+test/evidenceの最低3面を持ち、存在確認だけのgreenを許さない。
- `partial|gap`は負債PLANへ接続し、severity/owner/next transitionを持つ。
- `profile_conditional|not_applicable`は理由、profile、HARNESS境界を持つ。
- object/class/method対象itemはPLAN-L4-26のaggregate/method contractへ接続する。
- self-assessmentからdetector/doctorを生成し、detectorが評価結果を創作しない。
- frontier別model family reviewでfalse-green 0を確認する。

## 5. 降下先

item clusterごとに既存PLANへmergeするか、新規debt/add-design/add-impl/verify PLANを起票し、全件閉じる。
