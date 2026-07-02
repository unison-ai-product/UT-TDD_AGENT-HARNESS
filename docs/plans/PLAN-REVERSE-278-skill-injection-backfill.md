---
plan_id: PLAN-REVERSE-278-skill-injection-backfill
title: "PLAN-REVERSE-278: skill 注入安全弁の設計 back-fill"
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
    slot_label: "TL - skill injection back-fill scope"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-278-skill-injection-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-278-skill-injection-safety.md
  requires: []
  references:
    - docs/plans/PLAN-L5-06-skill.md
---

# PLAN-REVERSE-278: skill 注入安全弁の設計 back-fill

## 状態

draft 起票 (PLAN-L7-278 の Reverse pairing、parent 参照)。L7-278 実装後に R0→R4 を進める。

## Back-Fill 候補

- PLAN-L5-06 / L6 機能契約へ注入予算と path 再検証の契約を addendum する。

## 未着手 DoD

- [ ] 注入予算が設計正本に存在する。
