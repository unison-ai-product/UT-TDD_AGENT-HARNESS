---
plan_id: PLAN-L7-28-invariant-test-trace
title: "PLAN-L7-28 (add-impl): invariant-test-trace"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - invariant trace implementation"
  - role: qa
    slot_label: "QA - invariant trace oracle"
generates:
  - artifact_path: src/lint/ddd-tdd-rules.ts
    artifact_type: source_module
  - artifact_path: tests/ddd-tdd-rules.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-27-invariant-test-trace.md
  requires:
    - docs/plans/PLAN-L6-27-invariant-test-trace.md
    - docs/plans/PLAN-REVERSE-27-invariant-test-trace.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:53:00+09:00"
    reviewed_at: "2026-06-09T16:55:00+09:00"
    verdict: approve
    scope: "A-114 independent re-audit plus PO closure instruction; typecheck/lint/vitest/doctor green before confirmation; add-feature triad closed without content changes."
---

# PLAN-L7-28 (add-impl): invariant-test-trace

## §0 Position

Implements IMP-098.

## §3.1 実装計画 (情報源)

情報源:

- `docs/plans/PLAN-L6-27-invariant-test-trace.md`
- `docs/governance/ddd-tdd-rules.md`
- `docs/test-design/harness/L7-unit-test-design.md` U-DDDTDD-002

実装:

- Parse invariant oracle references.
- Flag invariant oracle ids absent from L7 test design.
- Add negative and real repo tests.

## §3 工程表

### Step 1: [直列] invariant parser

直列理由: downstream_dependency. The parser defines the input for oracle comparison.

### Step 2: [並列] unit oracle

Add missing-oracle fixture and real repo guard.

### Step 3: [直列] review (self/pmo-sonnet)

直列理由: downstream_dependency. lint / typecheck / vitest / doctor must be green before review.

## §6 用語更新

- **invariant-test-trace**: implemented invariant oracle detector.
- **DDD/TDD back-fill**: Reverse record for this add-impl slice.

## §8 DoD

- [x] U-DDDTDD-002 passes.
