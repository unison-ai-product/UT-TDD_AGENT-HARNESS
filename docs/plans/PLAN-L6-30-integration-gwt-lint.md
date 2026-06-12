---
plan_id: PLAN-L6-30-integration-gwt-lint
title: "PLAN-L6-30 (add-design): integration-gwt lint"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - integration GWT design"
generates:
  - artifact_path: docs/governance/ddd-tdd-rules.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
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

# PLAN-L6-30 (add-design): integration-gwt lint

## §0 Position

Back-fills IMP-101. L8 integration test design must be confirmable at Given/When/Then granularity.

## §3.1 実装計画 (情報源)

情報源:

- `docs/governance/ddd-tdd-rules.md`
- `docs/test-design/harness/L8-integration-test-design.md`
- `docs/test-design/harness/L7-unit-test-design.md` U-DDDTDD-005

実装:

- Require confirmed L8 IT rows to have Given / When / Then.
- Add the rule to DDD/TDD workflow placement.

## §3 工程表

### Step 1: [並列] integration GWT policy

Define L8 row granularity as machine-checkable evidence.

### Step 2: [並列] oracle placement

Add U-DDDTDD-005 as the unit oracle.

### Step 3: [直列] review (self/pmo-sonnet)

直列理由: downstream_dependency. L8 granularity contract must exist before review.

## §6 用語更新

- **integration-gwt**: L8 Given/When/Then granularity rule.
- **qualitative review**: reviewer evidence after quantitative check.

## §8 DoD

- [x] L8 IT rows without GWT are machine-detectable.
