---
plan_id: PLAN-REVERSE-394-refactor-qa-release-contract-gate-backfill
title: "PLAN-REVERSE-394 (reverse): refactor / QA release contract gate backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
status: confirmed
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL / QA
parent_design: docs/plans/PLAN-L7-394-refactor-qa-release-contract-gate.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T19:10:00+09:00"
    tests_green_at: "2026-07-08T19:10:00+09:00"
    verdict: approve
    scope: "PLAN-L7-394 の add-impl を PLAN-L6-49 / L7 oracle / typed spec へ backfill 済み。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/vmodel-refactor-qa-release-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T19:10:00+09:00"
        evidence_path: tests/vmodel-refactor-qa-release-contracts.test.ts
        output_digest: "sha256:69b388dcb8698630b9b45abefc63d9c3b509f80e81dc872ab37aabb8a5fc0420"
        anchor_commit: a9accba5c8cc59eb53308e84613191b84dc54e22
backprop_scope:
  - layer: L6-function-design
    artifact_path: docs/plans/PLAN-L6-49-refactor-and-qa-release-gates.md
    status: created
    reason: "U13b refactor / QA release contract design を追加した。"
  - layer: test-design
    artifact_path: docs/test-design/harness/L7-unit-test-design.md
    status: updated
    reason: "U-REFACTOR-QA oracle と TVMS-012/013 を追加した。"
  - layer: governance
    artifact_path: docs/governance/vmodel-typed-spec-definitions.md
    status: updated
    reason: "VMS-012/013 と TVMS-012/013 を typed spec 台帳へ追加した。"
agent_slots:
  - role: tl
    slot_label: "TL - reverse backfill"
  - role: qa
    slot_label: "QA - trace closure"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-394-refactor-qa-release-contract-gate-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L6-49-refactor-and-qa-release-gates.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-394-refactor-qa-release-contract-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/governance/vmodel-typed-spec-definitions.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-394-refactor-qa-release-contract-gate.md
  requires:
    - docs/plans/PLAN-L6-49-refactor-and-qa-release-gates.md
  references:
    - docs/plans/PLAN-L7-394-refactor-qa-release-contract-gate.md
    - docs/governance/vmodel-typed-spec-definitions.md
---

# PLAN-REVERSE-394: refactor / QA release contract gate backfill

## R0 問題

`PLAN-L7-394` は doctor gate と unit oracle を追加する add-impl である。HARNESS の
add-impl は上流設計と oracle へ戻す必要があるため、本 Reverse で U13b の設計差分を閉じる。

## R4 合流結果

- `PLAN-L6-49` が ZIP 108/109 の L6 設計差分を持つ。
- `docs/test-design/harness/L7-unit-test-design.md` が U-REFACTOR-QA oracle を持つ。
- `docs/governance/vmodel-typed-spec-definitions.md` が VMS-012/013 と TVMS-012/013 を台帳化する。
