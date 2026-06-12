---
plan_id: PLAN-REVERSE-25-module-boundary-rule
title: "PLAN-REVERSE-25 (reverse): back-fill module-boundary rule"
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
    slot_label: "TL - module-boundary rule back-fill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-25-module-boundary-rule.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-26-module-boundary-rule.md
  requires:
    - docs/plans/PLAN-L6-25-module-boundary-rule.md
    - docs/plans/PLAN-L7-26-module-boundary-rule.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:53:00+09:00"
    reviewed_at: "2026-06-09T16:55:00+09:00"
    verdict: approve
    scope: "A-114 independent re-audit plus PO closure instruction; typecheck/lint/vitest/doctor green before confirmation; add-feature triad closed without content changes."
---

# PLAN-REVERSE-25 (reverse): back-fill module-boundary rule

## §0 Position

Records Reverse trace for IMP-096 so the implementation is not orphaned from governance design.

## §3.1 実装計画（情報源）

情報源:

- `docs/plans/PLAN-L6-25-module-boundary-rule.md`
- `docs/plans/PLAN-L7-26-module-boundary-rule.md`

実装:

- Reverse trace is this PLAN plus the `requires` edge from PLAN-L7-26.

## §3 工程表

### Step 1: [並列] observed gap record

Record manual-review-only module-boundary checking as a coding-rule gap.

### Step 2: [直列] Forward PLAN connection

直列理由: downstream_dependency。Reverse can only close after L6/L7 PLAN ids are fixed.

### Step 3: [直列] review

直列理由: downstream_dependency。backfill / doctor must be green before review.

## §6 用語更新

- **module-boundary back-fill**: module-boundary rule を PLAN trace に戻す Reverse 記録。

## §8 DoD

- [x] PLAN-L7-26 requires this Reverse PLAN.
- [x] backfill doctor does not report this add-impl as orphan.
