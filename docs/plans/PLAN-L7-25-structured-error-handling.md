---
plan_id: PLAN-L7-25-structured-error-handling
title: "PLAN-L7-25 (add-impl): structured error-handling coding rule"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - structured error rule implementation"
  - role: qa
    slot_label: "QA - structured error oracle"
generates:
  - artifact_path: src/lint/coding-rules.ts
    artifact_type: source_module
  - artifact_path: tests/coding-rules.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-24-structured-error-handling.md
  requires:
    - docs/plans/PLAN-L6-24-structured-error-handling.md
    - docs/plans/PLAN-REVERSE-24-structured-error-handling.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:53:00+09:00"
    reviewed_at: "2026-06-09T16:55:00+09:00"
    verdict: approve
    scope: "A-114 independent re-audit plus PO closure instruction; typecheck/lint/vitest/doctor green before confirmation; add-feature triad closed without content changes."
---

# PLAN-L7-25 (add-impl): structured error-handling coding rule

## §0 Position

Implements IMP-095 in `analyzeCodingRules`.

## §3.1 実装計画（情報源）

情報源:

- `docs/plans/PLAN-L6-24-structured-error-handling.md`
- `docs/test-design/harness/L7-unit-test-design.md` U-CODE-008

実装:

- `src/lint/coding-rules.ts`: catch clause AST inspection
- `tests/coding-rules.test.ts`: empty/rethrow catch negative fixture

## §3 工程表

### Step 1: [直列] catch analyzer

直列理由: downstream_dependency。AST detection must exist before oracle assertion.

### Step 2: [並列] unit oracle

Add synthetic empty catch and rethrow-only catch cases.

### Step 3: [直列] review

直列理由: downstream_dependency。lint / typecheck / vitest / doctor must be green before review.

## §6 用語更新

- **rethrow-only catch**: catch block whose only statement is `throw`.

## §8 DoD

- [x] U-CODE-008 passes.
- [x] Real repo guard has zero `structured-error-handling` violations.
