---
plan_id: PLAN-L6-26-domain-boundary-lint
title: "PLAN-L6-26 (add-design): domain-boundary lint"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - domain-boundary design"
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

# PLAN-L6-26 (add-design): domain-boundary lint

## §0 Position

Back-fills IMP-097. DDD domain boundary is a mechanical rule, not only a review concern.

## §3.1 実装計画 (情報源)

情報源:

- `docs/governance/ddd-tdd-rules.md`
- `docs/design/harness/L6-function-design/module-drift.md`
- `docs/test-design/harness/L7-unit-test-design.md` U-DDDTDD-007

実装:

- Define `domain-boundary` in the DDD/TDD SSoT.
- Route the rule through `analyzeDddTddRules`.
- Surface violations through doctor.

## §3 工程表

### Step 1: [並列] boundary policy design

Define allowed dependency direction for lint/runtime/schema modules.

### Step 2: [並列] test oracle placement

Add U-DDDTDD-007 as the unit-level oracle.

### Step 3: [直列] review (self/pmo-sonnet)

直列理由: downstream_dependency. Policy and oracle must exist before qualitative review can confirm the boundary.

## §6 用語更新

- **domain-boundary**: DDD dependency boundary rule.
- **DDD/TDD strictness**: policy family carrying the rule.

## §8 DoD

- [x] SSoT, L6 contract, L7 oracle, and doctor route are connected.
- [x] domain-boundary violations are detectable by unit test and doctor.
