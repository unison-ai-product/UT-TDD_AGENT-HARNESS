---
plan_id: PLAN-L6-24-structured-error-handling
title: "PLAN-L6-24 (add-design): structured error-handling coding rule"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - structured error rule design"
generates:
  - artifact_path: docs/governance/coding-rules.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/module-drift.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires:
    - docs/plans/PLAN-L6-23-coding-rules-workflow.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:53:00+09:00"
    reviewed_at: "2026-06-09T16:55:00+09:00"
    verdict: approve
    scope: "A-114 independent re-audit plus PO closure instruction; typecheck/lint/vitest/doctor green before confirmation; add-feature triad closed without content changes."
---

# PLAN-L6-24 (add-design): structured error-handling coding rule

## §0 Position

Defines IMP-095: fail-open is allowed, but silent or rethrow-only catch blocks are not acceptable governance-quality error handling.

## §3.1 実装計画（情報源）

情報源:

- `docs/governance/coding-rules.md`
- `docs/design/harness/L6-function-design/module-drift.md`
- `docs/test-design/harness/L7-unit-test-design.md`

実装:

- `src/lint/coding-rules.ts`: `structured-error-handling`
- `tests/coding-rules.test.ts`: U-CODE-008

## §3 工程表

### Step 1: [並列] rule design

Define the minimum enforceable rule: empty catch and rethrow-only catch are violations.

### Step 2: [直列] oracle design

直列理由: downstream_dependency。The oracle depends on the exact violation shape.

### Step 3: [直列] review

直列理由: downstream_dependency。lint / typecheck / vitest / doctor must be green before review.

## §6 用語更新

- **structured-error-handling**: catch block が explicit failure state を返す、記録する、または変換すること。

## §8 DoD

- [x] Empty catch and rethrow-only catch are machine-detected.
- [x] Real repo guard has zero violations.
