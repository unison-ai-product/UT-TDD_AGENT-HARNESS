---
plan_id: PLAN-L6-22-l6-completion-readiness
title: "PLAN-L6-22 (add-design): L6 completion readiness lint"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - L6 completion readiness design"
generates:
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires:
    - docs/plans/PLAN-L6-00-master.md
    - docs/design/harness/L6-function-design/fr-unit-coverage.md
    - docs/governance/gate-design.md
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: cross_agent
    worker_model: codex:gpt-5.4
    reviewer_model: claude:pmo-sonnet
    tests_green_at: "2026-06-09T13:00:00+09:00"
    reviewed_at: "2026-06-09T13:10:23+09:00"
    verdict: approve
    scope: "G6 L6 completion final recheck; lint/typecheck/vitest/doctor green; L6 FR coverage and guardrail coverage reviewed"
---

# PLAN-L6-22 (add-design): L6 completion readiness lint

## §0 Position

L6 completion was previously visible only indirectly through verification group messages. This add-design defines a dedicated readiness lint that aggregates L6 design doc status, L6 doc owning-plan and L7-pair trace, owning PLAN status/review evidence, L7 pair status, and G6 gate status.

## §3.1 実装計画（情報源）

情報源:

- `docs/plans/PLAN-L6-00-master.md` completion scope addendum
- `docs/design/harness/L6-function-design/*.md`
- `docs/test-design/harness/L7-unit-test-design.md`
- `docs/governance/gate-design.md`

実装:

- `src/lint/l6-completion.ts`
- `src/doctor/index.ts`
- `tests/l6-completion.test.ts`

Trace DoD addendum:

- [x] L6 readiness inputs include L6 docs / L6 doc owning-plan trace / L6 doc L7-pair trace / L6 unit-contract substance / L6 design PLAN / L7 / G6.
- [x] Incomplete states surface as draft docs, missing owning plan, unresolved owning plan, missing L7 pair, missing L7 reverse reference, weak unit-contract substance, draft PLANs, L7 draft, or G6 not-pass.
- [x] A synthetic oracle proves `ready=true` only when every condition is satisfied.
- [x] A synthetic oracle proves `freezeInputReady=true` can be true before final G6 completion when trace/substance inputs are complete but status/gate flips are still pending.
- [x] doctor surfaces readiness as hard/fail-close.

## §3 工程表

### Step 1: [直列] readiness inputs 設計

直列理由: downstream_dependency。L6 docs / L6 PLAN / L7 / G6 の入力集合が決まらないと判定関数を定義できない。

### Step 2: [並列] L7 oracle 追記

U-L6COMP-* を L7 unit test design の readiness oracle として参照する。

### Step 3: [直列] review

直列理由: downstream_dependency。lint / typecheck / vitest / doctor が green になってから self / reviewer 監査に回す。

## §6 用語更新

- **L6 completion readiness**: L6 docs、対応 PLAN、L7 pair、G6 gate の状態を集約し、L6 完了可否を明示する機械判定。

## §8 DoD

- [x] L6 readiness inputs が L6 docs / L6 design PLAN / L7 / G6 を含む。
- [x] 未完了状態が draft docs / draft PLANs / L7 draft / G6 not-pass として表示される。
- [x] 全条件充足時に `ready=true` になる synthetic oracle を持つ。
- [x] doctor は hard/fail-close として readiness を surface する。
