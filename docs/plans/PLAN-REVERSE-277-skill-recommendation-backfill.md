---
plan_id: PLAN-REVERSE-277-skill-recommendation-backfill
title: "PLAN-REVERSE-277: skill 推奨差別化の設計 back-fill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: db
status: draft
route_signal: design_gap
route_mode: reverse
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - skill recommendation back-fill scope"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-277-skill-recommendation-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-277-skill-recommendation-discrimination.md
  requires: []
  references:
    - docs/design/harness/L6-function-design/function-spec.md
---

# PLAN-REVERSE-277: skill 推奨差別化の設計 back-fill

## 状態

draft 起票 (PLAN-L7-277 の Reverse pairing、parent 参照)。L7-277 実装後に R0→R4 を進める。

## Back-Fill 候補

- L6 機能契約へ score 式 (実績項含む) と統合後の単一実装の契約を addendum する。
- 学習ループ (evaluations→score) の閉路を requirements の skill 節へ追記する。

## 未着手 DoD

- [ ] score 式と学習閉路が設計正本に存在する。
