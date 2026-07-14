---
plan_id: PLAN-REVERSE-434-universal-pr-trigger-backfill
title: "PLAN-REVERSE-434: universal PR trigger 実装の設計 backfill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: agent
status: draft
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-14
updated: 2026-07-14
owner: PO / Claude (Fable orchestrator)
parent_design: docs/plans/PLAN-L7-434-universal-pr-trigger-impl.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
backprop_scope:
  - layer: L6-function-design
    decision: pending
    evidence_path: docs/plans/PLAN-L6-82-universal-pr-trigger-contract.md
    reason: "universal PR trigger 契約 (base 無限定 pull_request + push main 維持 + 3 面同期) を L6 契約へ合流する。"
  - layer: L7-unit-test-design
    decision: pending
    evidence_path: docs/test-design/harness/L7-unit-test-design.md
    reason: "main_limited_pr_trigger fail-close と missing pull_request trigger の負例 oracle (U-CIPOL 系) を test design へ合流する。"
agent_slots:
  - role: tl
    slot_label: "TL - trigger 契約と検出器負例の L6/L7 backfill"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-434-universal-pr-trigger-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-434-universal-pr-trigger-impl.md
  requires:
    - docs/plans/PLAN-L7-434-universal-pr-trigger-impl.md
---

# PLAN-REVERSE-434: universal PR trigger 実装の設計 backfill

PLAN-L7-434 (add-impl) の Reverse ペア。実装事実を R0-R4 で設計層へ合流する:

- R0: 実装差分の観測 — 3 面 (source workflow / Pack template / setup builtin) の
  `pull_request` base 限定撤去と `github-ci-policy` の `main_limited_pr_trigger` /
  missing pull_request trigger fail-close (tests/github-ci-policy.test.ts 負例 2 本)。
- R1-R2: L6-82 契約との trace 照合 (required context `harness-check` 不変、push main 維持)。
- R3: U-CIPOL 系 oracle を docs/test-design/harness/L7-unit-test-design.md へ同期。
- R4: Forward 合流。確定済み PLAN-L7-197 / L7-221 の claim と矛盾があれば supersedes
  宣言で訂正する (上書き禁止、PLAN-L7-89 の errata 規約)。
