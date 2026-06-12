---
plan_id: PLAN-L7-29-red-first-tdd-evidence
title: "PLAN-L7-29 (add-impl): red-first-tdd-evidence"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - Red-first evidence implementation"
  - role: qa
    slot_label: "QA - Red-first evidence oracle"
generates:
  - artifact_path: src/lint/ddd-tdd-rules.ts
    artifact_type: source_module
  - artifact_path: tests/ddd-tdd-rules.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-28-red-first-tdd-evidence.md
  requires:
    - docs/plans/PLAN-L6-28-red-first-tdd-evidence.md
    - docs/plans/PLAN-REVERSE-28-red-first-tdd-evidence.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:53:00+09:00"
    reviewed_at: "2026-06-09T16:55:00+09:00"
    verdict: approve
    scope: "A-114 independent re-audit plus PO closure instruction; typecheck/lint/vitest/doctor green before confirmation; add-feature triad closed without content changes."
---

# PLAN-L7-29 (add-impl): red-first-tdd-evidence

## §0 Position

Implements IMP-099.

## §3.1 実装計画 (情報源)

情報源:

- `docs/plans/PLAN-L6-28-red-first-tdd-evidence.md`
- `docs/governance/ddd-tdd-rules.md`
- `docs/test-design/harness/L7-unit-test-design.md` U-DDDTDD-003

実装:

- Inspect confirmed PLAN frontmatter for TDD Red/Green evidence.
- Add missing and inverted timestamp fixtures.

## §3 工程表

### Step 1: [直列] PLAN evidence parser

直列理由: downstream_dependency. PLAN parsing defines the Red/Green comparison input.

### Step 2: [並列] unit oracle

Add missing-evidence and inverted-evidence tests.

### Step 3: [直列] review (self/pmo-sonnet)

直列理由: downstream_dependency. lint / typecheck / vitest / doctor must be green before review.

## §6 用語更新

- **red-first evidence**: implemented Red/Green timestamp detector.
- **DDD/TDD back-fill**: Reverse record for this add-impl slice.

## §8 DoD

- [x] U-DDDTDD-003 passes.
