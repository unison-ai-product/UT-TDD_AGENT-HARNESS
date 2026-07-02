---
plan_id: PLAN-REVERSE-273-test-results-backfill
title: "PLAN-REVERSE-273: test_results ingest の設計 back-fill"
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
    slot_label: "TL - test_results back-fill scope"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-273-test-results-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-273-test-results-ingest.md
  requires: []
  references:
    - docs/design/harness/L5-detailed-design/physical-data.md
---

# PLAN-REVERSE-273: test_results ingest の設計 back-fill

## 状態

draft 起票 (PLAN-L7-273 の Reverse pairing、parent 参照)。L7-273 実装後に R0→R4 を進める。

## Back-Fill 候補

- physical-data.md の test_results 節へ ingest 経路と provenance 列を追記する。
- L6 機能契約へ ingest の入出力を addendum する。

## 未着手 DoD

- [ ] test_results の書き手が設計正本に存在する。
