---
plan_id: PLAN-REVERSE-270-spec-change-backfill
title: "PLAN-REVERSE-270: 仕様変更サイクルの設計 back-fill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: agent
status: draft
route_signal: design_gap
route_mode: reverse
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - spec-change back-fill scope"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-270-spec-change-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-270-spec-change-cycle.md
  requires: []
  references:
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
---

# PLAN-REVERSE-270: 仕様変更サイクルの設計 back-fill

## 状態

draft 起票 (PLAN-L7-270 の back-fill 意図保持、R0 メモ)。L7-270 実装後に R0→R4 を進める。

## Back-Fill 候補

- concept / requirements の workflow 節へ un-freeze→再 freeze サイクルを追記する。
- gates.md へ再 freeze 時の gate 再通過規律を追記する。

## 未着手 DoD

- [ ] 仕様変更サイクルが上位正本に存在する。
