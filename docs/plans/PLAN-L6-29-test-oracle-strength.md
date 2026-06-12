---
plan_id: PLAN-L6-29-test-oracle-strength
title: "PLAN-L6-29 (add-design): test-oracle-strength"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - test oracle strength design"
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

# PLAN-L6-29 (add-design): test-oracle-strength

## §0 Position

Back-fills IMP-100. A test that only runs code is not enough TDD evidence.

## §3.1 実装計画 (情報源)

情報源:

- `docs/governance/ddd-tdd-rules.md`
- `docs/test-design/harness/L7-unit-test-design.md` U-DDDTDD-004

実装:

- Require each `it` / `test` block to include an explicit assertion oracle.
- Flag truthiness-only assertions as weak oracle.

## §3 工程表

### Step 1: [並列] oracle strength design

Define strong vs weak assertion criteria.

### Step 2: [並列] unit oracle placement

Add U-DDDTDD-004 as the unit oracle.

### Step 3: [直列] review (self/pmo-sonnet)

直列理由: downstream_dependency. Criteria and oracle must exist before review.

## §6 用語更新

- **test-oracle-strength**: assertion strength rule.
- **quantitative check**: machine pass/fail evidence for test strength.

## §8 DoD

- [x] no-assertion and weak-oracle tests are machine-detectable.
