---
plan_id: PLAN-REVERSE-396-verify-gate-binding-backfill
title: "PLAN-REVERSE-396 (reverse): verify gate binding backfill"
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
parent_design: docs/plans/PLAN-L7-396-verify-gate-binding.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T11:30:00+09:00"
    tests_green_at: "2026-07-09T11:30:00+09:00"
    verdict: approve
    scope: "PLAN-L7-396 の verify gate binding を L6 function-spec / L7 unit oracle へ backfill 済み。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/frontmatter.test.ts tests/plan-lint.test.ts -t \"verify|U-PLANGOV-011v5|U-PLANGOV-011v4\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T11:30:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:81311c6f4fa14a8f212e36436858d0c09ad6f9b8057e8e9004e0fcf3590ab5e5"
        anchor_commit: 48d89bbca4b341ce1013fb91eb4c9187d4119497
backprop_scope:
  - layer: L6-function-design
    artifact_path: docs/design/harness/L6-function-design/function-spec.md
    status: updated
    reason: "analyzePlanGovernance.verifyGateBinding の関数契約を追加した。"
  - layer: test-design
    artifact_path: docs/test-design/harness/L7-unit-test-design.md
    status: updated
    reason: "U-ROUTE-R11 として verify gate binding の oracle を追加した。"
agent_slots:
  - role: tl
    slot_label: "TL - verify gate binding reverse backfill"
  - role: qa
    slot_label: "QA - oracle citation"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-396-verify-gate-binding-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-396-verify-gate-binding.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-396-verify-gate-binding.md
  requires: []
  references:
    - docs/plans/PLAN-L7-396-verify-gate-binding.md
    - docs/plans/PLAN-RECOVERY-10-right-lung-quality-assurance.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
---

# PLAN-REVERSE-396: verify gate binding backfill

## R0 問題

`PLAN-L7-396` は右腕 verify PLAN の `verification_gate` 契約を実装する add-impl である。
この契約は L6 function-spec と L7 unit test design に戻しておかないと、検出系だけが先行し、
設計資産として残らない。

## R4 合流結果

- `docs/design/harness/L6-function-design/function-spec.md` が `analyzePlanGovernance.verifyGateBinding`
  の契約を持つ。
- `docs/test-design/harness/L7-unit-test-design.md` が `U-ROUTE-R11` oracle を持つ。
- `PLAN-L7-396` が本 Reverse backfill を requires に持ち、add-impl 単独着地を避ける。
