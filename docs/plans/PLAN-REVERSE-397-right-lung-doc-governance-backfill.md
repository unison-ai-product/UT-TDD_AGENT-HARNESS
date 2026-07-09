---
plan_id: PLAN-REVERSE-397-right-lung-doc-governance-backfill
title: "PLAN-REVERSE-397 (reverse): right-lung doc governance backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: be
status: confirmed
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-09
updated: 2026-07-09
owner: PO / TL
parent_design: docs/plans/PLAN-L7-397-right-lung-doc-governance.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T12:05:00+09:00"
    tests_green_at: "2026-07-09T12:05:00+09:00"
    verdict: approve
    scope: "PLAN-L7-397 の right-lung doc governance (workflow marker + verification_design + test case ID family) を L6 function-spec / L7 unit oracle / L12-L14 test-design へ backfill 済み。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/right-lung-doc-governance.test.ts tests/doctor-workflow-quality.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T12:05:00+09:00"
        evidence_path: tests/right-lung-doc-governance.test.ts
        output_digest: "sha256:f9805fb5bad01f32e7525d552a1a2e6059810c939c9c223979d405ab46b615c1"
backprop_scope:
  - layer: L6-function-design
    artifact_path: docs/design/harness/L6-function-design/function-spec.md
    status: updated
    reason: "analyzeRightLungDocGovernance の関数契約を追加した。"
  - layer: test-design
    artifact_path: docs/test-design/harness/L7-unit-test-design.md
    status: updated
    reason: "U-RLG oracle を追加した。"
  - layer: test-design
    artifact_path: docs/test-design/harness/L12-acceptance-test-design.md
    status: updated
    reason: "G12-WORKFLOW / verification_design minimum marker set を追加した。"
  - layer: test-design
    artifact_path: docs/test-design/harness/L14-operational-test-design.md
    status: updated
    reason: "G14-WORKFLOW / verification_design minimum marker set を追加した。"
agent_slots:
  - role: tl
    slot_label: "TL - right-lung doc governance reverse backfill"
  - role: qa
    slot_label: "QA - oracle citation"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-397-right-lung-doc-governance-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-397-right-lung-doc-governance.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/test-design/harness/L12-acceptance-test-design.md
    artifact_type: test_design
  - artifact_path: docs/test-design/harness/L14-operational-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-397-right-lung-doc-governance.md
  requires: []
  references:
    - docs/plans/PLAN-L7-397-right-lung-doc-governance.md
    - docs/plans/PLAN-RECOVERY-10-right-lung-quality-assurance.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
---

# PLAN-REVERSE-397: right-lung doc governance backfill

## R0 問題

`PLAN-L7-397` は右肺 doc の minimum workflow shape を doctor hard gate 化する add-impl である。
設計 doc 側に関数契約と oracle を戻し、L12/L14 の不足 section を補わないと、検出系だけが先行する。

## R4 合流結果

- L6 function-spec が `analyzeRightLungDocGovernance` 契約を持つ。
- L7 unit test design が `U-RLG-001..003` oracle を持つ。
- L12 / L14 test-design doc が `G12-WORKFLOW` / `G14-WORKFLOW`、`verification_design`、共通 marker を持つ。
