---
plan_id: PLAN-REVERSE-421-generic-right-arm-backfill
title: "PLAN-REVERSE-421: generic right-arm/document gate実装の設計backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
status: confirmed
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-421-generic-right-arm-doctor-gate.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
backprop_scope:
  - layer: L6-function-design
    decision: updated
    evidence_path: docs/design/harness/L6-function-design/function-spec.md
    reason: "contract-derived right-arm/right-lung検査のpre/post/exitを固定する。"
  - layer: L7-unit-test-design
    decision: updated
    evidence_path: docs/test-design/harness/L7-unit-test-design.md
    reason: "偽PLAN、層欠落、marker重複、L11/L13 backlink負例をoracle化する。"
agent_slots:
  - role: tl
    slot_label: "TL - expected PLAN/gate/artifact検出をL6/contractへbackfill"
review_evidence:
  - reviewer: codex-engine-wave-rereview
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-10T18:56:16+09:00"
    tests_green_at: "2026-07-10T18:55:57+09:00"
    verdict: approve
    scope: "right-arm/right-lung実装事実のL6/L7 backfillと負例traceを独立レビュー。"
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/vmodel-contract-compiler.test.ts tests/right-arm-gate-planning.test.ts tests/right-lung-doc-governance.test.ts tests/vmodel-source-assets.test.ts tests/oracle-test-trace.test.ts tests/relation-graph-loader.test.ts tests/merged-plan-status.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T18:55:57+09:00"
        evidence_path: tests/right-arm-gate-planning.test.ts
        output_digest: "sha256:3ed3a8512c7a23825594e4f6e61bfaf5bfee793a96f74dda06a1ca692a3e9a38"
        anchor_commit: 3d232e9cc187bc06006896dadc6774148a871a0b
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-421-generic-right-arm-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-421-generic-right-arm-doctor-gate.md
  requires:
    - docs/plans/PLAN-L7-421-generic-right-arm-doctor-gate.md
---

# PLAN-REVERSE-421

R0でright-arm/right-lung detectorを観測し、R1でcontract metadata差、R2で偽PLAN/L11/L13負例、R3でdoctor surface、R4でL6-73/vmodel-contract/self-proofへ合流する。

R4ではL6 function-specとL7 unit-test-designへ実装事実と負例を合流済みとする。
