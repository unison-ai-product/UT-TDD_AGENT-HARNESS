---
plan_id: PLAN-REVERSE-272-red-first-backfill
title: "PLAN-REVERSE-272: Red-first 発火化の設計 back-fill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: fullstack
status: draft
route_signal: design_gap
route_mode: reverse
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - red-first activation back-fill scope"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-272-red-first-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-272-red-first-activation.md
  requires: []
  references:
    - docs/governance/ddd-tdd-rules.md
---

# PLAN-REVERSE-272: Red-first 発火化の設計 back-fill

## 状態

draft 起票 (PLAN-L7-272 の Reverse pairing、parent 参照)。L7-272 実装後に R0→R4 を進める。

## Back-Fill 候補

- ddd-tdd-rules.md の red-first-evidence ルールへ既定 ON / cutoff / opt-out 条件を追記する。
- PLAN template (impl 系) へ marker 既定を反映する。

## 未着手 DoD

- [ ] 既定 ON の条件が governance 正本に存在する。
