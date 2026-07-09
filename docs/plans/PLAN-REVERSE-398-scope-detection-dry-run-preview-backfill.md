---
plan_id: PLAN-REVERSE-398-scope-detection-dry-run-preview-backfill
title: "PLAN-REVERSE-398 (reverse): scope detection dry-run preview backfill"
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
parent_design: docs/plans/PLAN-L7-398-scope-detection-dry-run-preview.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T12:15:00+09:00"
    tests_green_at: "2026-07-09T12:10:00+09:00"
    verdict: approve
    scope: "PLAN-L7-398 の scope dry-run preview を PLAN-L6-57 / L6 function-spec / L7 unit oracle へ backfill 済み。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/scope-preview.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T12:10:00+09:00"
        evidence_path: tests/scope-preview.test.ts
        output_digest: "sha256:d43456f00c9d0d02549805dd44c654c650e04224096967cbd708bac7f30f243d"
        anchor_commit: 48d89bbca4b341ce1013fb91eb4c9187d4119497
backprop_scope:
  - layer: L6-function-design
    artifact_path: docs/design/harness/L6-function-design/function-spec.md
    status: updated
    reason: "buildScopeDryRunPreview の関数契約を追加した。"
  - layer: L6-plan
    artifact_path: docs/plans/PLAN-L6-57-scope-detection-dry-run-preview.md
    status: updated
    reason: "scope dry-run preview の入出力契約、失敗時挙動、doctor profile 境界を明記した。"
  - layer: test-design
    artifact_path: docs/test-design/harness/L7-unit-test-design.md
    status: updated
    reason: "U-SCOPE-PREVIEW oracle を追加した。"
agent_slots:
  - role: tl
    slot_label: "TL - scope dry-run reverse backfill"
  - role: qa
    slot_label: "QA - oracle citation"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-398-scope-detection-dry-run-preview-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-398-scope-detection-dry-run-preview.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L6-57-scope-detection-dry-run-preview.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-398-scope-detection-dry-run-preview.md
  requires: []
  references:
    - docs/plans/PLAN-L6-57-scope-detection-dry-run-preview.md
    - docs/plans/PLAN-L7-398-scope-detection-dry-run-preview.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
---

# PLAN-REVERSE-398: scope detection dry-run preview backfill

## R0 問題

`PLAN-L7-398` は ZIP `scope.py --profile <name>` 相当の dry-run preview を実装する add-impl である。
実装だけが先行すると、profile / capability / activation profile の入出力契約が設計資産として残らない。

## R4 合流結果

- `PLAN-L6-57` が dry-run preview の input / output / failure behavior / doctor profile boundary を持つ。
- `docs/design/harness/L6-function-design/function-spec.md` が `buildScopeDryRunPreview` 契約を持つ。
- `docs/test-design/harness/L7-unit-test-design.md` が `U-SCOPE-PREVIEW-R1..R4` oracle を持つ。
- `PLAN-L7-398` が本 Reverse backfill を requires に持ち、add-impl 単独着地を避ける。
