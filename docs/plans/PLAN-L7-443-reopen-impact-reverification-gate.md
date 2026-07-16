---
plan_id: PLAN-L7-443-reopen-impact-reverification-gate
title: "PLAN-L7-443 (add-impl): 再開放影響閉包・再検証・再合流gate"
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
    slot_label: "SE - impact closure、certificate/merge policy統合"
  - role: qa
    slot_label: "QA - upstream reopen・invalidated拒否oracle"
generates:
  - artifact_path: docs/plans/PLAN-L7-443-reopen-impact-reverification-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-443-reopen-impact-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-87-freeze-checkpoint-reopen-contract.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-442-freeze-checkpoint-ledger-tag-projection.md
    - docs/plans/PLAN-L7-438-reentry-internal-ci-auto-pr.md
    - docs/plans/PLAN-L7-439-cross-review-merge-learning-closure.md
    - docs/plans/PLAN-REVERSE-443-reopen-impact-backfill.md
review_evidence: []
---

# PLAN-L7-443: 再開放影響閉包・再検証・再合流gate

## 1. 実装

`assess-reopen` はPLAN revision、artifact manifest、typed relation/trace graphからtransitive closureを算出し、最上流reopenと下流invalidatedをLedgerへ記録する。`verify` はrequired gateすべてのfresh evidenceを確認して次checkpointへ束縛する。off-Forward Issue、E9 certificate、E10/E12/E14 acceptanceへ同じassessmentを接続する。

## 2. TDD Red

`U-REOPEN-001..007` でno-impact偽装、最上流判定漏れ、閉包改変、古いevidence、未再凍結certificate、PR、mergeを拒否する。`IT-FREEZE-01..04` はSQLite/outbox/reconcile/rebuild、`ST-FREEZE-01..03` はIssueからmain mergeまでの遮断を検証する。

## 3. AC

- [ ] 設計変更→再開放→実装→再検証→再凍結の閉ループを証拠化する。
- [ ] 実装を保持するReverseと実装を捨てて設計から進むRedesignを同じreopen policyで区別して扱う。
- [ ] 未解消invalidated freezeがあるPRはreview/CI Greenでもmerge不能である。
