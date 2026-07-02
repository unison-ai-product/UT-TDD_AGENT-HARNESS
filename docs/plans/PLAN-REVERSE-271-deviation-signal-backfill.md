---
plan_id: PLAN-REVERSE-271-deviation-signal-backfill
title: "PLAN-REVERSE-271: 逸脱 signal 語彙の設計 back-fill"
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
    slot_label: "TL - deviation signal back-fill scope"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-271-deviation-signal-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-271-deviation-signal-tokens.md
  requires: []
  references:
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-REVERSE-271: 逸脱 signal 語彙の設計 back-fill

## 状態

draft 起票 (PLAN-L7-271 の Reverse pairing、parent 参照 = PLAN-L7-265 方式)。L7-271 実装後に R0→R4 を進める。

## Back-Fill 候補

- concept §2.6.1 の signal 台帳へ新 token を追記する。
- requirements の routing 要件表を同期する。

## 未着手 DoD

- [ ] 新 token が concept/requirements の signal 台帳に存在する。
