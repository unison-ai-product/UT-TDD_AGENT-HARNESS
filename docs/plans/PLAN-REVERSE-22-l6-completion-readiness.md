---
plan_id: PLAN-REVERSE-22-l6-completion-readiness
title: "PLAN-REVERSE-22 (reverse): back-fill L6 completion readiness lint"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
forward_routing: L5
promotion_strategy: reuse-as-is
agent_slots:
  - role: tl
    slot_label: "TL - L6 completion readiness back-fill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-22-l6-completion-readiness.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-23-l6-completion-readiness.md
  requires:
    - docs/plans/PLAN-L6-22-l6-completion-readiness.md
    - docs/plans/PLAN-L7-23-l6-completion-readiness.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:58:00+09:00"
    reviewed_at: "2026-06-09T17:00:00+09:00"
    verdict: approve
    scope: "L6 completion readiness reverse back-fill reviewed after lint/typecheck/vitest/doctor green; add-impl pairing closed."
---

# PLAN-REVERSE-22 (reverse): back-fill L6 completion readiness lint

## §0 Position

Records the Reverse side for the L6 completion readiness add-feature so the add-impl is not orphaned. No upstream requirement change is introduced; the feature operationalizes the existing G6/L6 completion condition.

## §3.1 実装計画（情報源）

情報源:

- `docs/plans/PLAN-L6-22-l6-completion-readiness.md`
- `docs/plans/PLAN-L7-23-l6-completion-readiness.md`
- `docs/governance/gate-design.md`

実装:

- Reverse trace is this PLAN plus the `requires` edge from PLAN-L7-23.

## §3 工程表

### Step 1: [直列] observed gap 記録

直列理由: downstream_dependency。L6 completion が verification message のみに埋もれていた事実を記録する。

### Step 2: [並列] Forward PLAN 接続

PLAN-L6-22 / PLAN-L7-23 の requires edge を確認する。

### Step 3: [直列] review

直列理由: downstream_dependency。backfill / doctor が green になってから self / reviewer 監査に回す。

## §6 用語更新

- **completion readiness back-fill**: 実装済み readiness 検出を Forward/Gate 設計へ戻して orphan を避ける Reverse 記録。

## §8 DoD

- [x] PLAN-L7-23 が本 PLAN を `requires` する。
- [x] backfill doctor で orphan にならない。
