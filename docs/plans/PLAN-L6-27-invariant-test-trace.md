---
plan_id: PLAN-L6-27-invariant-test-trace
title: "PLAN-L6-27 (add-design): invariant-test-trace"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - invariant trace design"
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

# PLAN-L6-27 (add-design): invariant-test-trace

## §0 Position

Back-fills IMP-098. DDD invariant declarations must trace to L7 test oracles.

## §3.1 実装計画 (情報源)

情報源:

- `docs/governance/ddd-tdd-rules.md`
- `docs/test-design/harness/L7-unit-test-design.md` U-DDDTDD-002

実装:

- Define invariant declarations with `DDD-INV-*` and `oracle: U-*`.
- Require every declared oracle to exist in L7 test design.

## §3 工程表

### Step 1: [並列] invariant SSoT design

Define invariant declaration format in `ddd-tdd-rules.md`.

### Step 2: [並列] oracle trace design

Add U-DDDTDD-002 as the unit oracle.

### Step 3: [直列] review (self/pmo-sonnet)

直列理由: downstream_dependency. Invariants and oracle list must exist before review confirms trace closure.

## §6 用語更新

- **invariant-test-trace**: invariant to L7 oracle trace rule.
- **DDD/TDD strictness**: policy family carrying the rule.

## §8 DoD

- [x] DDD invariants and L7 oracle trace are machine-checkable.
