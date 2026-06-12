---
plan_id: PLAN-L7-24-coding-rules-workflow
title: "PLAN-L7-24 (add-impl): coding-rules SSoT workflow"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - coding-rules workflow implementation"
  - role: qa
    slot_label: "QA - coding-rules workflow oracle"
generates:
  - artifact_path: src/lint/coding-rules.ts
    artifact_type: source_module
  - artifact_path: tests/coding-rules.test.ts
    artifact_type: test_code
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-23-coding-rules-workflow.md
  requires:
    - docs/plans/PLAN-L6-23-coding-rules-workflow.md
    - docs/plans/PLAN-REVERSE-23-coding-rules-workflow.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:53:00+09:00"
    reviewed_at: "2026-06-09T16:55:00+09:00"
    verdict: approve
    scope: "A-114 independent re-audit plus PO closure instruction; typecheck/lint/vitest/doctor green before confirmation; add-feature triad closed without content changes."
---

# PLAN-L7-24 (add-impl): coding-rules SSoT workflow

## §0 Position

Implements the coding-rules workflow analyzer and doctor hard gate for IMP-094.

## §3.1 実装計画（情報源）

情報源:

- `docs/plans/PLAN-L6-23-coding-rules-workflow.md`
- `docs/governance/coding-rules.md`
- `docs/test-design/harness/L7-unit-test-design.md` U-CODE-001..007

実装:

- `src/lint/coding-rules.ts`: pure analyzer, loader, messages
- `src/doctor/index.ts`: `checkCodingRules`
- `tests/coding-rules.test.ts`: negative and real repo guard

## §3 工程表

### Step 1: [直列] analyzer implementation

直列理由: downstream_dependency。Policy/workflow loaders define the input shape for tests and doctor wiring.

### Step 2: [並列] unit oracle

Synthetic negative fixtures and real repo guard validate the analyzer.

### Step 3: [直列] review

直列理由: downstream_dependency。lint / typecheck / vitest / doctor must be green before review.

## §6 用語更新

- **coding-rules workflow analyzer**: coding-rule SSoT と workflow anchor の欠落を検出する lint。

## §8 DoD

- [x] U-CODE-001..007 pass.
- [x] doctor hard gate includes coding-rules.
