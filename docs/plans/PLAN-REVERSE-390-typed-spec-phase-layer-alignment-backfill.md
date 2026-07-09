---
plan_id: PLAN-REVERSE-390-typed-spec-phase-layer-alignment-backfill
title: "PLAN-REVERSE-390: typed spec phase/layer alignment backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
status: confirmed
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/plans/PLAN-L7-390-typed-spec-phase-layer-alignment-gate.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T16:35:00+09:00"
    tests_green_at: "2026-07-08T16:35:00+09:00"
    verdict: approve
    scope: "PLAN-L7-390 からの design/test-design/governance back-fill。typed_spec_phase_owner と phase/layer finding を設計正本へ戻した。"
    green_commands:
      - kind: doctor
        command: "bun run src/cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T16:35:00+09:00"
        evidence_path: docs/governance/vmodel-upgrade-schedule.md
        output_digest: "sha256:38d72b7ca812183dc8a7acacbfd3b5784d86c405cc045cf8eb017a3ae8334cba"
        anchor_commit: 33f03923a561495acd0ff9f43b9e2f8af718335e
backprop_scope:
  - layer: L4-basic-design
    artifact_path: docs/design/harness/L4-basic-design/data.md
    status: updated
    reason: "typed spec owner phase をデータ概念の不変条件へ追加した。"
  - layer: L5-detailed-design
    artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    status: updated
    reason: "phase/layer alignment finding 種別を物理データ設計へ追加した。"
  - layer: L6-function-design
    artifact_path: docs/design/harness/L6-function-design/function-spec.md
    status: updated
    reason: "analyzer / doctor contract を機能設計へ追加した。"
  - layer: test-design
    artifact_path: docs/test-design/harness/L7-unit-test-design.md
    status: updated
    reason: "U-TYPED-SPEC-P1..P4 oracle を追加した。"
  - layer: governance
    artifact_path: docs/governance/vmodel-typed-spec-definitions.md
    status: updated
    reason: "governance artifact の typed spec owner phase 明示を追加した。"
agent_slots:
  - role: tl
    slot_label: "TL - phase/layer backfill"
  - role: qa
    slot_label: "QA - reverse trace check"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-390-typed-spec-phase-layer-alignment-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/governance/vmodel-upgrade-schedule.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-typed-spec-definitions.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-390-typed-spec-phase-layer-alignment-gate.md
  requires:
    - PLAN-L6-46-typed-spec-phase-layer-alignment
---

# PLAN-REVERSE-390: typed spec phase/layer alignment backfill

## 0. 役割

本 PLAN は、U12b の doctor gate 実装で確定した phase/layer alignment の意味を、
L4/L5/L6/test-design/governance に戻す Reverse backfill である。

## 1. 戻し先

- L4: typed spec owner phase を data model の不変条件として追加する。
- L5: `typed-spec-owner-phase-missing` / `typed-spec-phase-layer-mismatch` finding を追加する。
- L6: analyzer と doctor gate の contract を追加する。
- L7 test-design: U-TYPED-SPEC-P1..P4 oracle を追加する。
- governance: `typed_spec_phase_owner` を横断 artifact の typed spec 所有層として宣言する。

## 2. 受け入れ条件

- L4/L5/L6/test-design/governance の設計差分が PLAN-L6-46 / PLAN-L7-390 と整合する。
- `doctor` と targeted tests が green。
