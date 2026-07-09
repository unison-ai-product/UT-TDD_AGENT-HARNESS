---
plan_id: PLAN-REVERSE-403-feedback-surface-context-efficiency-backfill
title: "PLAN-REVERSE-403 (reverse): feedback surface context efficiency backfill"
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
parent_design: docs/plans/PLAN-L7-403-feedback-surface-context-efficiency.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T13:10:00+09:00"
    tests_green_at: "2026-07-09T13:05:00+09:00"
    verdict: approve
    scope: "PLAN-L7-403 の feedback surface / attempt escalation context-efficiency 契約を L6 function-spec と L7 unit oracle へ backfill 済み。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/feedback-surface.test.ts tests/attempt-escalation.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T13:05:00+09:00"
        evidence_path: tests/feedback-surface.test.ts
        output_digest: "sha256:9568e906a8acfd0ecee9398f70554db93d9dd5ad3508540960895575db39d051"
backprop_scope:
  - layer: L6-function-design
    artifact_path: docs/design/harness/L6-function-design/function-spec.md
    status: updated
    reason: "takeover feedback group-first cap と attempt escalation display cap の関数契約を追加した。"
  - layer: test-design
    artifact_path: docs/test-design/harness/L7-unit-test-design.md
    status: updated
    reason: "U-FEEDBACK-SURFACE と U-SLOG-009 oracle を追加した。"
agent_slots:
  - role: tl
    slot_label: "TL - context efficiency reverse backfill"
  - role: qa
    slot_label: "QA - surface oracle citation"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-403-feedback-surface-context-efficiency-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-403-feedback-surface-context-efficiency.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-403-feedback-surface-context-efficiency.md
  requires: []
  references:
    - docs/plans/PLAN-L7-403-feedback-surface-context-efficiency.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
---

# PLAN-REVERSE-403: feedback surface context efficiency backfill

## R0 問題

`PLAN-L7-403` は context-efficiency audit の F2/F3 を受けた実装差分である。
実装だけが先行すると、SessionStart surface の固定予算・多様性・breadcrumb 契約が設計資産に残らない。

## R4 合流結果

- `docs/design/harness/L6-function-design/function-spec.md` が group-first takeover feedback surface と attempt escalation cap 契約を持つ。
- `docs/test-design/harness/L7-unit-test-design.md` が `U-FEEDBACK-SURFACE-001..002` と `U-SLOG-009` oracle を持つ。
- `PLAN-L7-403` が本 Reverse backfill を requires に持ち、add-impl 単独着地を避ける。
