---
plan_id: PLAN-REVERSE-29-test-oracle-strength
title: "PLAN-REVERSE-29 (reverse): back-fill test-oracle-strength"
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
    slot_label: "TL - test oracle strength back-fill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-29-test-oracle-strength.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-30-test-oracle-strength.md
  requires:
    - docs/plans/PLAN-L6-29-test-oracle-strength.md
    - docs/plans/PLAN-L7-30-test-oracle-strength.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:53:00+09:00"
    reviewed_at: "2026-06-09T16:55:00+09:00"
    verdict: approve
    scope: "A-114 independent re-audit plus PO closure instruction; typecheck/lint/vitest/doctor green before confirmation; add-feature triad closed without content changes."
---

# PLAN-REVERSE-29 (reverse): back-fill test-oracle-strength

## §0 Position

Records the Reverse side for IMP-100.

## §3.1 実装計画 (情報源)

情報源:

- `docs/plans/PLAN-L6-29-test-oracle-strength.md`
- `docs/plans/PLAN-L7-30-test-oracle-strength.md`

実装:

- Preserve the reverse trace for test-oracle-strength.

## §3 工程表

### Step 1: [並列] observed gap record

Record that weak test oracle detection was missing.

### Step 2: [直列] Forward PLAN connection

直列理由: downstream_dependency. Reverse can close only after L6/L7 PLAN ids are fixed.

### Step 3: [直列] review (self/pmo-sonnet)

直列理由: downstream_dependency. Backfill lint and doctor must be green before review.

## §6 用語更新

- **DDD/TDD back-fill**: Reverse trace for DDD/TDD strictness automation.

## §8 DoD

- [x] PLAN-L7-30 requires this Reverse PLAN.
