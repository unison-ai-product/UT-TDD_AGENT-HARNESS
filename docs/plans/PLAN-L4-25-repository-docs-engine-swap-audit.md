---
plan_id: PLAN-L4-25-repository-docs-engine-swap-audit
title: "PLAN-L4-25 (add-design): repository全docs disposition・DDD/OOP・FSM/右腕波及監査"
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
    slot_label: "TL - 全tracked docsの責務・正本階層・更新判断"
  - role: se
    slot_label: "SE - DDD/OOP、FSM/PLAN v2、contract-derived detectorの設計波及"
  - role: qa
    slot_label: "QA - snapshot件数、exactly-once、orphan、stale assumptionの閉包"
  - role: docs
    slot_label: "Docs - 日本語正本、重複/廃止/統合、cross-reference更新"
generates:
  - artifact_path: docs/governance/repository-document-disposition-ledger.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/document-system-map.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-upgrade-schedule.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L4-22-vmodel-source-disposition-profile-ssot.md
    - docs/plans/PLAN-L4-23-forward-fsm-plan-asset-v2.md
    - docs/plans/PLAN-L4-24-declarative-vmodel-contract-right-arm.md
    - docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md
---

# PLAN-L4-25: repository全docs disposition・DDD/OOP・FSM/右腕波及監査

## 1. 目的

`docs/**` の全tracked artifactをsnapshot単位でinventoryし、今回のengine-swapに対する
`update|merge|retain|supersede|archive|not_applicable`をexactly once記録する。ZIP 109件の監査だけで
既存HARNESS正本の全面見直しを代替しない。

## 2. 必須観点

- canonical/reference/archive境界、重複責務、stale count/path/status/route/gate表現
- Forward FSM、PLAN Asset v2、revision-bound evidenceへの波及
- source 109→item 163→target slot dispositionへの接続
- L8-L14/G8-G14 contract、L11/L13 process evidence、roadmap park撤去への波及
- bounded context、aggregate、value object、invariant、port/repository、CQS等DDD/OOP設計のL4-L6全正本への波及
- class/method設計が縮退・欠落しているdomainを検出し、PLAN-L4-26のobject/method設計へ接続
- ZIP 163 semantic itemのHARNESS実装正しさをPLAN-L4-27で全件検証し、存在確認だけのgreenを禁止
- concept/requirements/ADR/design/test-design/process/governance/PLAN間の参照更新

## 3. 受入条件

- 監査開始commitと`git ls-files docs`件数/hashをledger headerへ固定する。
- baselineの全tracked docsがexactly once現れ、未判断・重複・存在しないpathが0件である。
- `update|merge|supersede|archive`はtarget artifact/PLAN、`retain|not_applicable`は判断理由を持つ。
- DDD/OOP波及対象のL4-L6正本、FSM/PLAN v2対象、右腕対象をtagで検索できる。
- classを使わない判断も理由とpure function/VO/port境界を持ち、設計欠落を「非OOP」で正当化しない。
- 旧前提 `572|107文書|~150 items|3 profiles|最小影響|L8-L14恒久park` のcanonical残存が0件である。
- 更新完了後の全docsを再snapshotし、未処理deltaとcross-reference orphanを0にする。
- detectorはledgerを読み、監査対象/判断/targetを推測生成しない。

## 4. 降下先

文書群ごとのadd-design/reverse/update PLAN、cross-reference migration、readability/design-language/doc-consistency gateを
同一program内で起票する。大きさを理由に対象文書を除外しない。
