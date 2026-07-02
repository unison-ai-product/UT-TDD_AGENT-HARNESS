---
plan_id: PLAN-L7-242-mode-exit-enforcement-batch
title: "PLAN-L7-242 (impl): mode exit 未強制の残バッチ起票 (着手時 per-requirement 分割)"
kind: impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/process/modes/README.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - 分割起票時の優先順・スコープ確定"
  - role: tl
    slot_label: "TL - 各 gate の実装単位分割 (§1.10 PLAN per requirement)"
generates:
  - artifact_path: docs/plans/PLAN-L7-242-mode-exit-enforcement-batch.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-173-drive-model-coverage-audit-2026-07-02.md
---

# PLAN-L7-242 (impl): mode exit 未強制の残バッチ起票

## Status

draft 起票 (PO /goal 2026-07-02、A-173 F-6/F-7 feature-gap)。**本 PLAN は取りこぼし防止の起票束であり、着手時に per-requirement (§1.10) で分割 PLAN 化してから実装する** (本体を 1 PLAN で実装しない)。

## 収容項目 (A-173 F-6/F-7)

| # | 項目 | 出典 |
|---|---|---|
| 1 | Incident: troubleshoot + recovery の 2-PLAN 紐付け (requires) 検証 | incident.md:44 |
| 2 | Recovery: 再発防止 3 要件 (root cause / guard 具体変更 / L14 route) の body lint | recovery.md:100-102 |
| 3 | Discovery: `verify/*.sh` の存在/実行成功チェック | discovery.md:33 |
| 4 | Scrum: Reverse fullback 昇華先 (`forward_routing ∈ {L1,L3,L4,L5}`) 検証 | scrum.md:70 (IMP-044) |
| 5 | Add-feature: add-impl → Reverse 起票の機械確認 (scrum-reverse lint の poc 限定解除) | backfill-pairing.ts:8 |
| 6 | version-up: exit 条件節の doc 追補 + activation 時 version_target 除去/requires trace 検証 | version-up.md §4 |
| 7 | Forward: `accept` ステップの canonical コマンド定義 or 既存コマンドへの明示紐付け | CLAUDE.md:212 |
| 8 | G1-content 専用 doctor エントリ + G2/G4/G5 pair gate の doctor 配線 + G14 disposition | gates.md:50-63 |

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | PO 優先順確定 → per-requirement 分割起票 | 直列 |
| 2 | 分割 PLAN 群の実装 (各 PLAN 内で管理) | 直列 |

## DoD

- [ ] 全収容項目が分割 PLAN へ移管 (本 PLAN は分割完了で supersede)
