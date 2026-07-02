---
plan_id: PLAN-L4-15-nfr-grade-ac-landing
title: "PLAN-L4-15 (add-design): nfr-grade AC placeholder (NFR-02/09) の L4 carry 着地"
kind: add-design
layer: L4
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L3-functional/nfr-grade.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - 性能/容量/更新性の数値閾値設計"
  - role: po
    slot_label: "PO - グレード値の採否"
generates:
  - artifact_path: docs/plans/PLAN-L4-15-nfr-grade-ac-landing.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L4-02-architecture.md
  requires: []
  references:
    - .ut-tdd/audit/A-174-forward-design-test-pair-audit-2026-07-02.md
    - docs/design/harness/L3-functional/nfr-grade.md
---

# PLAN-L4-15 (design): nfr-grade AC placeholder の L4 carry 着地

## Status

draft 起票 (PO /goal 2026-07-02、A-174 F-3 feature-gap)。

## 背景 (A-174 F-3)

`nfr-grade.md:56,60,148-149` — NFR-02 (更新性) / NFR-09 の AC が「L4 carry placeholder」宣言のまま節本文なしで未着地。性能/容量の数値閾値確定が宙に浮き、L3-acceptance の AT-NFR-02/09 も carry のまま。

## スコープ

L4 側 (architecture/data) で NFR-02/09 の数値閾値・検証方法を設計確定し、nfr-grade.md の placeholder 節を AC 本文で置換、対応する AT-NFR の carry を解消する。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 閾値設計 (TL) + PO 採否 | 直列 |
| 2 | nfr-grade.md / L3-acceptance の carry 解消 (pair-freeze 維持) | 直列 |

## DoD

- [ ] nfr-grade.md に carry placeholder 節が残っていない (grep 固定)
- [ ] AT-NFR-02/09 が実 AC を持つ
