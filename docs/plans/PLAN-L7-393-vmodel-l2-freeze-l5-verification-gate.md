---
plan_id: PLAN-L7-393-vmodel-l2-freeze-l5-verification-gate
title: "PLAN-L7-393 (add-impl): V-model L2/L5 forward freeze contract gate"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/plans/PLAN-L6-48-vmodel-l2-freeze-l5-verification-design.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T17:45:45+09:00"
    tests_green_at: "2026-07-08T17:45:45+09:00"
    verdict: approve
    scope: "U13a add-impl slice. forward-freeze-contracts doctor gate と unit oracle を追加。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/vmodel-forward-freeze-contracts.test.ts tests/vmodel-pair.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T17:45:45+09:00"
        evidence_path: tests/vmodel-forward-freeze-contracts.test.ts
        output_digest: "sha256:4a9f3dd15d5b50a2bc1cbe4e2e40d46f3f7e59a5e2b0b7845c4fae1774a88840"
agent_slots:
  - role: tl
    slot_label: "TL - forward freeze contract gate"
  - role: se
    slot_label: "SE - vmodel lint / doctor wiring"
  - role: qa
    slot_label: "QA - L2/L5 freeze regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-393-vmodel-l2-freeze-l5-verification-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/vmodel/lint.ts
    artifact_type: source_module
  - artifact_path: src/doctor/roadmap-verification.ts
    artifact_type: source_module
  - artifact_path: src/doctor/check-definition-groups.ts
    artifact_type: source_module
  - artifact_path: tests/vmodel-forward-freeze-contracts.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-48-vmodel-l2-freeze-l5-verification-design.md
  requires:
    - docs/plans/PLAN-REVERSE-393-vmodel-l2-freeze-l5-verification-gate-backfill.md
  references:
    - docs/design/harness/L2-screen/
    - docs/design/harness/L5-detailed-design/
    - docs/test-design/harness/L8-integration-test-design.md
---

# PLAN-L7-393: V-model L2/L5 forward freeze contract gate

## 0. 役割

本 PLAN は `PLAN-L6-48` の設計を doctor hard gate へ接続する。
既存 `pair-freeze` は pair の存在と双方向参照を検査する。本 gate は ZIP 107 の追加意図に合わせ、L2 prototype agreement と L5 verification design readiness を名前付きで検査する。

## 1. 実装内容

1. `PairDoc` に `nextPairFreeze` と `content` を追加し、frontmatter だけでなく証跡 marker も判定できるようにする。
2. `analyzeForwardFreezeContracts` で L2 6 sub-doc、L5 5 sub-doc、L8 integration test design を検査する。
3. `forwardFreezeContractMessages` で doctor 表示を生成する。
4. `checkForwardFreezeContractsResult` を doctor `source-trace` group に追加する。
5. `tests/vmodel-forward-freeze-contracts.test.ts` で pass/fail fixture と real repo green を固定する。

## 2. 不変条件

- `pair-freeze` の結果を置き換えない。より具体的な U13a gate として追加する。
- `L2` の prototype agreement は G2/PO/prototype/合意/確定 marker のいずれかを証跡として要求する。
- `L8` は全 L5 detail doc basename と GWT table を持たなければならない。

## 3. 受け入れ条件

- `bun run vitest run tests/vmodel-forward-freeze-contracts.test.ts tests/vmodel-pair.test.ts` が green。
- `bun run tsc --noEmit` が green。
- `ut-tdd doctor` または `bun run src/cli.ts doctor` で `forward-freeze-contracts - OK` が出る。

## U13 typed spec owned artifact

```yaml
spec:
  defines:
    - id: VMS-011
      kind: forward-freeze-contract-gate
      traces_from: [VMS-010]
      tests: [TVMS-011]
```

VMS-011 は U13a の L2/L5 forward freeze contract を doctor hard gate として実装する境界である。
