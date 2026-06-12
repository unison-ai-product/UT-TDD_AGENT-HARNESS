---
plan_id: PLAN-L6-23-coding-rules-workflow
title: "PLAN-L6-23 (add-design): coding-rules SSoT workflow"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - coding-rules workflow design"
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
    - docs/plans/PLAN-L6-00-master.md
review_evidence:
  - reviewer: PO/A-114-ddd-tdd-strengthening-reaudit
    review_kind: human
    tests_green_at: "2026-06-09T16:53:00+09:00"
    reviewed_at: "2026-06-09T16:55:00+09:00"
    verdict: approve
    scope: "A-114 independent re-audit plus PO closure instruction; typecheck/lint/vitest/doctor green before confirmation; add-feature triad closed without content changes."
---

# PLAN-L6-23 (add-design): coding-rules SSoT workflow

## §0 Position

Back-fills IMP-094 as a formal add-feature PLAN. Coding rules are requirements-level SSoT plus workflow artifact, not an informal CI-only convention.

## §3.1 実装計画（情報源）

情報源:

- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` §7.6.1
- `docs/governance/coding-rules.md`
- `docs/process/forward/L00-L06-design-phase.md`
- `docs/process/modes/add-feature.md`
- `docs/process/modes/README.md`

実装:

- `docs/governance/coding-rules.md`: rule IDs and workflow placement
- `src/lint/coding-rules.ts`: policy/workflow analyzer
- `tests/coding-rules.test.ts`: U-CODE-001..007

## §3 工程表

### Step 1: [並列] SSoT placement design

`docs/governance/coding-rules.md` defines coding rules and workflow timing.

### Step 2: [並列] workflow anchor design

Forward / Add-feature / mode index docs carry `CODING-RULE-WORKFLOW`.

### Step 3: [直列] review

直列理由: downstream_dependency。SSoT and workflow anchors must exist before reviewer can confirm trace completeness.

## §6 用語更新

- **coding-rules SSoT**: TypeScript/Bun core の coding rule 正本。
- **CODING-RULE-WORKFLOW**: coding-rule 文書化が workflow step であることを示す process doc anchor。

## §8 DoD

- [x] requirements / L6 design / L7 oracle / lint / tests are connected.
- [x] `ut-tdd doctor` reports `coding-rules — OK`.
