---
plan_id: PLAN-REVERSE-434-universal-pr-trigger-backfill
title: "PLAN-REVERSE-434: universal PR trigger 実装の設計 backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: agent
status: confirmed
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-14
updated: 2026-07-15
owner: PO / Claude (Fable orchestrator)
parent_design: docs/plans/PLAN-L7-434-universal-pr-trigger-impl.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
backprop_scope:
  - layer: requirements
    decision: updated
    evidence_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    reason: "§6.4の旧main限定event契約を全PR base発火へ訂正し、poc拒否をjob内guardへ固定する。"
  - layer: L6-function-design
    decision: updated
    evidence_path: docs/plans/PLAN-L6-82-universal-pr-trigger-contract.md
    reason: "universal PR trigger 契約 (base 無限定 pull_request + push main 維持 + 4 artifact同期) を L6 契約へ合流する。"
  - layer: L7-unit-test-design
    decision: updated
    evidence_path: docs/test-design/harness/L7-unit-test-design.md
    reason: "main_limited_pr_trigger fail-close と missing pull_request trigger の負例 oracle (U-CIPOL 系) を test design へ合流する。"
agent_slots:
  - role: tl
    slot_label: "TL - trigger 契約と検出器負例の L6/L7 backfill"
  - role: po
    slot_label: "PO - R3 backfill判断とForward合流境界の検収"
review_evidence:
  - reviewer: claude-blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-07-15T11:41:00+09:00"
    tests_green_at: "2026-07-15T11:14:59+09:00"
    verdict: approve
    scope: "PR #61 HEAD 9359a5b5 の claim-blind / spec-blind はともに PASS。詳細は A-188。"
    worker_model: codex-gpt-5
    reviewer_model: claude-fable-5
    green_commands:
      - kind: smoke
        command: "GitHub Actions harness-check run 29383432438"
        runner: ci
        scope: full
        exit_code: 0
        completed_at: "2026-07-15T11:14:59+09:00"
        evidence_path: .ut-tdd/audit/A-188-pr-61-universal-trigger-self-proof-2026-07-15.md
        output_digest: "sha256:4606e7d3c87602a7ce8297fc94d37afeb6cd3d5f02b6bed52460e5b676bc685c"
        anchor_commit: 487ccd318a7e27f56ea35764d6204f35300d91d4
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-434-universal-pr-trigger-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L6-82-universal-pr-trigger-contract.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: .ut-tdd/audit/A-188-pr-61-universal-trigger-self-proof-2026-07-15.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-434-universal-pr-trigger-impl.md
  requires: []
  references:
    - docs/plans/PLAN-L7-434-universal-pr-trigger-impl.md
---

# PLAN-REVERSE-434: universal PR trigger 実装の設計 backfill

PLAN-L7-434 (add-impl) の Reverse ペア。実装事実を R0-R4 で設計層へ合流する:

- R0: 実装差分の観測済み — 4 artifact (source workflow / source template / Pack template / setup builtin) の
  `pull_request` base 限定撤去と `github-ci-policy` の `main_limited_pr_trigger` /
  missing pull_request trigger fail-close (tests/github-ci-policy.test.ts 負例 2 本)。
- R1-R2: L6-82 契約との trace 照合済み (required context `harness-check` 不変、push main 維持)。
- R3: requirements §6.4 / §6.9.3 / §7.5-7.6 と U-CIPOL-001..012 oracle を上位設計・test-designへ同期済み。
- R4: PR #61 の cross review / CI green 後に Forward 合流する。確定済み PLAN-L7-197 / L7-221 の claim と矛盾があれば supersedes
  宣言で訂正する (上書き禁止、PLAN-L7-89 の errata 規約)。

## R3 証拠

- source workflow / source template / Pack template / setup builtin はいずれも `pull_request` の
  `branches` / `branches-ignore` を持たない。
- `tests/github-ci-policy.test.ts` は正常構文、base filter、trigger欠落、不正型、
  push main限定欠落、path filter、不完全/未知activity types、workflow構造異常、権限誤指定、
  profile偽装、4 artifact loaderを独立oracleとして固定する。
- `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` §6.4の旧main限定event契約を訂正し、
  §7.5-7.6へ全PR base発火とfail-close ACを合流した。
