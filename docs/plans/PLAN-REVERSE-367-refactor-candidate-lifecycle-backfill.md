---
plan_id: PLAN-REVERSE-367-refactor-candidate-lifecycle-backfill
title: "PLAN-REVERSE-367 (reverse): refactor candidate lifecycle design backfill"
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
owner: TL / QA
parent_design: docs/plans/PLAN-L7-367-refactor-candidate-lifecycle.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - refactor candidate lifecycle design backfill"
  - role: qa
    slot_label: "QA - lifecycle regression oracle"
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T20:05:00+09:00"
    tests_green_at: "2026-07-08T20:05:00+09:00"
    verdict: approve
    scope: "Refactor candidate lifecycle の L5/L6/L7 backfill。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/projection-writer.test.ts tests/state-db.test.ts tests/workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T20:05:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:3ca1b40b5467e5ec0c46899e441f53acbc2d81ef8172333993072b5c5ee3a581"
backprop_scope:
  - layer: L5-physical-data
    artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    status: updated
    reason: "refactor_candidates table と lifecycle index を追加した。"
  - layer: L6-function-design
    artifact_path: docs/design/harness/L6-function-design/function-spec.md
    status: updated
    reason: "candidate lifecycle upsert / decision state preservation contract を追加した。"
  - layer: test-design
    artifact_path: docs/test-design/harness/L7-unit-test-design.md
    status: updated
    reason: "rebuild 後の rejected state preservation oracle を追加した。"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-367-refactor-candidate-lifecycle-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-367-refactor-candidate-lifecycle.md
  requires:
    - docs/plans/PLAN-L7-367-refactor-candidate-lifecycle.md
---

# PLAN-REVERSE-367: refactor candidate lifecycle design backfill

## 0. 役割

`PLAN-L7-367` は existing detector output を永続 lifecycle へ接続する add-impl である。
本 Reverse はその差分を L5 physical data、L6 function contract、L7 oracle へ戻す。

## 1. Backfill 内容

- L5: `refactor_candidates` table、`idx_refactor_candidates_state`、`idx_refactor_candidates_plan`。
- L6: `projectRefactorCandidateSignals` が lifecycle row を upsert し、decision state を保持する契約。
- L7: rebuild 後も `rejected` state が `open` に戻らず、feedback が再発火しない regression oracle。

## 2. R4 判定

本 backfill は schema 追加を伴うが、既存 `quality_signals` / `feedback_events` 投影は保持する。
永続状態は `refactor_candidates` の triage decision のみに限定し、DB を authoring source 化しない。
