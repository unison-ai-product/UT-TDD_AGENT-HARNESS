---
plan_id: PLAN-L7-442-freeze-checkpoint-ledger-tag-projection
title: "PLAN-L7-442 (add-impl): Freeze checkpoint Ledger・tag projection"
kind: add-impl
layer: L7
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-16
updated: 2026-07-16
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-87-freeze-checkpoint-reopen-contract.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - checkpoint aggregate、SQLite、tag outbox/reconcile"
  - role: qa
    slot_label: "QA - immutable receiptとfailure injection"
generates:
  - artifact_path: docs/plans/PLAN-L7-442-freeze-checkpoint-ledger-tag-projection.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-442-freeze-checkpoint-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-87-freeze-checkpoint-reopen-contract.md
  requires: []
  blocks:
    - docs/plans/PLAN-L7-443-reopen-impact-reverification-gate.md
  references:
    - docs/plans/PLAN-L5-24-freeze-checkpoint-reopen-physical-data.md
    - docs/plans/PLAN-REVERSE-442-freeze-checkpoint-backfill.md
review_evidence: []
---

# PLAN-L7-442: Freeze checkpoint Ledger・tag projection

## 1. 実装

`FreezeCheckpoint` aggregate、receipt canonicalizer、SQLite repository/migration、tag outbox/reconciler、`plan freeze checkpoint` CLIを実装する。Git操作をdomainへ埋め込まずportへ分離し、request/retry/reconcileをevent列から再現可能にする。

## 2. TDD Red

`U-FREEZE-001..006` を実装前にRed化し、同一requestの冪等性、tag/OID不一致、timeout後のreconcile、partial transaction、rebuild write 0、Release tag拒否をGreen化する。

## 3. AC

- [ ] tagはanchor後にだけ成功扱いになり、削除/移動を受理しない。
- [ ] receiptとmanifestはappend-onlyで、SQLite再構築後も一致する。
- [ ] targeted test、typecheck、plan lint、Reverse backfillを独立reviewする。
