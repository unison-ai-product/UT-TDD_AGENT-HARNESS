---
plan_id: PLAN-L7-27-domain-boundary-lint
title: "PLAN-L7-27 (add-impl): domain-boundary lint"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - domain-boundary implementation"
  - role: qa
    slot_label: "QA - domain-boundary oracle"
generates:
  - artifact_path: src/lint/ddd-tdd-rules.ts
    artifact_type: source_module
  - artifact_path: tests/ddd-tdd-rules.test.ts
    artifact_type: test_code
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-26-domain-boundary-lint.md
  requires:
    - docs/plans/PLAN-L6-26-domain-boundary-lint.md
    - docs/plans/PLAN-REVERSE-26-domain-boundary-lint.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:53:00+09:00"
    reviewed_at: "2026-06-09T16:55:00+09:00"
    verdict: approve
    scope: "A-114 independent re-audit plus PO closure instruction; typecheck/lint/vitest/doctor green before confirmation; add-feature triad closed without content changes."
---

# PLAN-L7-27 (add-impl): domain-boundary lint

## §0 Position

Implements IMP-097 as an add-feature slice.

## §3.1 実装計画 (情報源)

情報源:

- `docs/plans/PLAN-L6-26-domain-boundary-lint.md`
- `docs/governance/ddd-tdd-rules.md`
- `docs/test-design/harness/L7-unit-test-design.md` U-DDDTDD-007

実装:

- Add domain-boundary source import analysis to `src/lint/ddd-tdd-rules.ts`.
- Add synthetic negative test and real repo guard.
- Wire `checkDddTddRules` into doctor.

## §3 工程表

### Step 1: [直列] analyzer implementation

直列理由: downstream_dependency. The analyzer input shape must be fixed before tests and doctor messages.

### Step 2: [並列] unit oracle

Add the reverse-import fixture and real repo guard.

### Step 3: [直列] review (self/pmo-sonnet)

直列理由: downstream_dependency. lint / typecheck / vitest / doctor must be green before qualitative review.

## §6 用語更新

- **domain-boundary**: implemented import-boundary detector.
- **DDD/TDD back-fill**: Reverse record for this add-impl slice.

## §8 DoD

- [x] U-DDDTDD-007 passes.
- [x] doctor surfaces DDD/TDD strictness findings.
