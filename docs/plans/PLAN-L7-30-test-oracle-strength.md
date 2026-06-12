---
plan_id: PLAN-L7-30-test-oracle-strength
title: "PLAN-L7-30 (add-impl): test-oracle-strength"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - test oracle strength implementation"
  - role: qa
    slot_label: "QA - test oracle strength"
generates:
  - artifact_path: src/lint/ddd-tdd-rules.ts
    artifact_type: source_module
  - artifact_path: tests/ddd-tdd-rules.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-29-test-oracle-strength.md
  requires:
    - docs/plans/PLAN-L6-29-test-oracle-strength.md
    - docs/plans/PLAN-REVERSE-29-test-oracle-strength.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:53:00+09:00"
    reviewed_at: "2026-06-09T16:55:00+09:00"
    verdict: approve
    scope: "A-114 independent re-audit plus PO closure instruction; typecheck/lint/vitest/doctor green before confirmation; add-feature triad closed without content changes."
---

# PLAN-L7-30 (add-impl): test-oracle-strength

## §0 Position

Implements IMP-100.

## §3.1 実装計画 (情報源)

情報源:

- `docs/plans/PLAN-L6-29-test-oracle-strength.md`
- `docs/governance/ddd-tdd-rules.md`
- `docs/test-design/harness/L7-unit-test-design.md` U-DDDTDD-004

実装:

- Scan test blocks for `expect` / `assert`.
- Detect truthiness-only assertions.
- Add synthetic fixtures and real repo guard.

## §3 工程表

### Step 1: [直列] test block analyzer

直列理由: downstream_dependency. Assertion scanning defines the violation oracle.

### Step 2: [並列] unit oracle

Add no-assertion and truthiness-only fixtures.

### Step 3: [直列] review (self/pmo-sonnet)

直列理由: downstream_dependency. lint / typecheck / vitest / doctor must be green before review.

## §6 用語更新

- **test-oracle-strength**: implemented assertion-strength detector.
- **DDD/TDD back-fill**: Reverse record for this add-impl slice.

## §8 DoD

- [x] U-DDDTDD-004 passes.
