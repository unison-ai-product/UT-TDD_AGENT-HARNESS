---
plan_id: PLAN-L7-26-module-boundary-rule
title: "PLAN-L7-26 (add-impl): module-boundary coding rule"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - module-boundary rule implementation"
  - role: qa
    slot_label: "QA - module-boundary oracle"
generates:
  - artifact_path: src/lint/coding-rules.ts
    artifact_type: source_module
  - artifact_path: tests/coding-rules.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-25-module-boundary-rule.md
  requires:
    - docs/plans/PLAN-L6-25-module-boundary-rule.md
    - docs/plans/PLAN-REVERSE-25-module-boundary-rule.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:53:00+09:00"
    reviewed_at: "2026-06-09T16:55:00+09:00"
    verdict: approve
    scope: "A-114 independent re-audit plus PO closure instruction; typecheck/lint/vitest/doctor green before confirmation; add-feature triad closed without content changes."
---

# PLAN-L7-26 (add-impl): module-boundary coding rule

## §0 Position

Implements IMP-096 in `analyzeCodingRules`.

## §3.1 実装計画（情報源）

情報源:

- `docs/plans/PLAN-L6-25-module-boundary-rule.md`
- `docs/test-design/harness/L7-unit-test-design.md` U-CODE-009

実装:

- `src/lint/coding-rules.ts`: import declaration boundary inspection
- `tests/coding-rules.test.ts`: disallowed import negative fixture

## §3 工程表

### Step 1: [直列] import analyzer

直列理由: downstream_dependency。Import resolution must exist before oracle assertion.

### Step 2: [並列] unit oracle

Add synthetic `src/lint/*` importing `../runtime/*` case.

### Step 3: [直列] review

直列理由: downstream_dependency。lint / typecheck / vitest / doctor must be green before review.

## §6 用語更新

- **reverse import**: lower-level governance module importing higher-level runtime/CLI feature module.

## §8 DoD

- [x] U-CODE-009 passes.
- [x] Real repo guard has zero `module-boundary` violations.
