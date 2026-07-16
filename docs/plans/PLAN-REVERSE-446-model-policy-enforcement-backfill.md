---
plan_id: PLAN-REVERSE-446-model-policy-enforcement-backfill
title: "PLAN-REVERSE-446: モデル選定ポリシー強制の設計 back-fill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: be
status: draft
route_signal: design_gap
route_mode: reverse
created: 2026-07-16
updated: 2026-07-16
owner: PO / Claude
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - モデルポリシー強制面 (guard/lint/telemetry) の設計 back-fill scope"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-446-model-policy-enforcement-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-446-model-policy-enforcement.md
  requires: []
  references:
    - docs/plans/PLAN-L7-446-model-policy-enforcement.md
    - docs/plans/PLAN-L7-254-judgment-gate-reviewer-tier-matrix.md
---

# PLAN-REVERSE-446: モデル選定ポリシー強制の設計 back-fill

## 状態

draft 起票 (PLAN-L7-446 の Reverse pairing、R0 メモ)。

## Back-Fill 候補

- モデル選定ポリシーの enforcement 面マップ (正規委譲 = fail-close / subagent guard = warn-first /
  team lint = fail / telemetry = 事後検出) を L6 function design (cross-review-enforcement 系) へ
  1 節追記し、PLAN-L7-254 の gate 側 tier マトリクスとの分担境界を明文化する。
- `model_runs` 投影のスキーマ (routing source / lane / intent の記録粒度) を DB 設計へ back-fill する。

## DoD

- [ ] enforcement 面マップと L7-254 との分担境界が設計 doc に記録される。
- [ ] model_runs スキーマが DB 設計 doc に記録される。
