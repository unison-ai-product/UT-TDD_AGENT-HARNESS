---
plan_id: PLAN-REVERSE-245-sub-doc-schema-integrity-backfill
title: "PLAN-REVERSE-245 (reverse): sub_doc schema integrity 実装の設計backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: be
status: draft
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-14
updated: 2026-07-14
owner: PM / PO
parent_design: docs/plans/PLAN-L7-245-sub-doc-schema-integrity.md
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - sub_doc schema/map/role境界をL6/L7正本へbackfill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-245-sub-doc-schema-integrity-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-245-sub-doc-schema-integrity.md
  requires: []
---

# PLAN-REVERSE-245: sub_doc schema integrity 実装の設計backfill

## R0-R4

- R0: `sub-doc-schema-integrity` が schema、設計doc、document-system-mapの三者を実際に突合することを観測する。
- R1: L6の共有`function-spec` bucketと`artifact_role`によるtopic差分の境界をfunction contractへ同期する。
- R2: U-SDSI-001..019の正例・schema外値・未宣言・L4双方向drift・L6方針ノート欠落をL7 test designへ同期する。
- R3: `sub-doc-catalog-drift` と本gateの責務重複、meta doc除外、artifact_roleの自由値がschema値を迂回しないことを検証する。
- R4: L0/L1の列挙型要求を変更せず、document-system-map §1b-1を現行L6設計正本として承認するかを記録する。

## DoD

- [ ] L6 contract / L7 unit design に実装境界とoracleをbackfillする。
- [ ] targeted test、doctor、plan lintのgreen evidenceと独立reviewを記録する。
- [ ] PLAN-L7-245のreview evidenceと実装状態に矛盾がないことを確認し、R4 verdictを確定する。
