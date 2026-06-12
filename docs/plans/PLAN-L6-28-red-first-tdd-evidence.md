---
plan_id: PLAN-L6-28-red-first-tdd-evidence
title: "PLAN-L6-28 (add-design): red-first-tdd-evidence"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - Red-first evidence design"
generates:
  - artifact_path: docs/governance/ddd-tdd-rules.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/module-drift.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires:
    - docs/plans/PLAN-L6-00-master.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:53:00+09:00"
    reviewed_at: "2026-06-09T16:55:00+09:00"
    verdict: approve
    scope: "A-114 independent re-audit plus PO closure instruction; typecheck/lint/vitest/doctor green before confirmation; add-feature triad closed without content changes."
---

# PLAN-L6-28 (add-design): red-first-tdd-evidence

## §0 Position

Back-fills IMP-099. TDD Red-first evidence must be explicit for confirmed implementation PLANs.

## §3.1 実装計画 (情報源)

情報源:

- `docs/governance/ddd-tdd-rules.md`
- `docs/test-design/harness/L7-unit-test-design.md` U-DDDTDD-003

実装:

- Require confirmed PLANs with `tdd_red_required: true` to have `red_at` and `green_at`.
- Require `red_at <= green_at`.

## §3 工程表

### Step 1: [並列] evidence contract design

Define Red-first PLAN evidence fields.

### Step 2: [並列] oracle placement

Add U-DDDTDD-003 as the unit oracle.

### Step 3: [直列] review (self/pmo-sonnet)

直列理由: downstream_dependency. Evidence contract and oracle must exist before review.

## §6 用語更新

- **red-first evidence**: PLAN evidence rule for TDD Red before Green.
- **evidence bundle**: gate-significant decision evidence grouping.

## §8 DoD

- [x] Missing or inverted Red-first evidence is machine-detectable.
