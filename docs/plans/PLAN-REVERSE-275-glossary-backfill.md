---
plan_id: PLAN-REVERSE-275-glossary-backfill
title: "PLAN-REVERSE-275: glossary 突合の設計 back-fill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: be
status: draft
route_signal: design_gap
route_mode: reverse
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - glossary back-fill scope"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-275-glossary-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-275-glossary-code-consistency.md
  requires: []
  references:
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-REVERSE-275: glossary 突合の設計 back-fill

## 状態

draft 起票 (PLAN-L7-275 の back-fill 意図保持、R0 メモ)。

## Back-Fill 候補

- L0 glossary の運用節へ機械突合の位置付けを追記する。

## 未着手 DoD

- [ ] glossary 突合が上位正本に存在する。
