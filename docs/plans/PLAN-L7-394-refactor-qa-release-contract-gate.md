---
plan_id: PLAN-L7-394-refactor-qa-release-contract-gate
title: "PLAN-L7-394 (add-impl): refactor / QA release contract doctor gate"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL / QA
parent_design: docs/plans/PLAN-L6-49-refactor-and-qa-release-gates.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T19:10:00+09:00"
    tests_green_at: "2026-07-08T19:10:00+09:00"
    verdict: approve
    scope: "U13b add-impl slice. refactor-qa-release-contracts doctor gate と unit oracle を追加。"
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
agent_slots:
  - role: tl
    slot_label: "TL - refactor / QA gate"
  - role: se
    slot_label: "SE - vmodel lint / doctor wiring"
  - role: qa
    slot_label: "QA - fail-close oracle"
generates:
  - artifact_path: docs/plans/PLAN-L7-394-refactor-qa-release-contract-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/vmodel/lint.ts
    artifact_type: source_module
  - artifact_path: src/doctor/roadmap-verification.ts
    artifact_type: source_module
  - artifact_path: src/doctor/check-definition-groups.ts
    artifact_type: source_module
  - artifact_path: tests/vmodel-refactor-qa-release-contracts.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-49-refactor-and-qa-release-gates.md
  requires:
    - docs/plans/PLAN-REVERSE-394-refactor-qa-release-contract-gate-backfill.md
  references:
    - docs/governance/vmodel-refactor-qa-release-gates.md
    - docs/process/modes/refactor.md
    - src/workflow/contracts.ts
---

# PLAN-L7-394: refactor / QA release contract doctor gate

## 0. 実装内容

`PLAN-L6-49` の設計正本を `refactor-qa-release-contracts` doctor gate へ接続する。
gate は authoring source、Refactor process、workflow invariant contract の 3 点を読み、
ZIP 108 / 109 の必須 marker が欠ける場合に fail-close する。

## 1. 受け入れ条件

- `checkRefactorQaReleaseContractsResult` が doctor full profile で実行される。
- `tests/vmodel-refactor-qa-release-contracts.test.ts` が fail-close fixture と real repo green を持つ。
- `VMS-013` と `TVMS-013` が typed spec ledger / body / L7 test design に登録される。

## U13b typed spec owned artifact

```yaml
spec:
  defines:
    - id: VMS-013
      kind: refactor-qa-release-contract-gate
      traces_from: [VMS-012]
      tests: [TVMS-013]
```
