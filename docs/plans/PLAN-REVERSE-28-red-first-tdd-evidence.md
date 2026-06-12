---
plan_id: PLAN-REVERSE-28-red-first-tdd-evidence
title: "PLAN-REVERSE-28 (reverse): back-fill red-first-tdd-evidence"
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
    slot_label: "TL - Red-first evidence back-fill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-28-red-first-tdd-evidence.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-29-red-first-tdd-evidence.md
  requires:
    - docs/plans/PLAN-L6-28-red-first-tdd-evidence.md
    - docs/plans/PLAN-L7-29-red-first-tdd-evidence.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:53:00+09:00"
    reviewed_at: "2026-06-09T16:55:00+09:00"
    verdict: approve
    scope: "A-114 independent re-audit plus PO closure instruction; typecheck/lint/vitest/doctor green before confirmation; add-feature triad closed without content changes."
---

# PLAN-REVERSE-28 (reverse): back-fill red-first-tdd-evidence

## §0 Position

Records the Reverse side for IMP-099.

## §3.1 実装計画 (情報源)

情報源:

- `docs/plans/PLAN-L6-28-red-first-tdd-evidence.md`
- `docs/plans/PLAN-L7-29-red-first-tdd-evidence.md`

実装:

- Preserve the reverse trace for Red-first TDD evidence.

## §3 工程表

### Step 1: [並列] observed gap record

Record that Red-first evidence was not machine-enforced.

### Step 2: [直列] Forward PLAN connection

直列理由: downstream_dependency. Reverse can close only after L6/L7 PLAN ids are fixed.

### Step 3: [直列] review (self/pmo-sonnet)

直列理由: downstream_dependency. Backfill lint and doctor must be green before review.

## §6 用語更新

- **DDD/TDD back-fill**: Reverse trace for DDD/TDD strictness automation.

## §8 DoD

- [x] PLAN-L7-29 requires this Reverse PLAN.
