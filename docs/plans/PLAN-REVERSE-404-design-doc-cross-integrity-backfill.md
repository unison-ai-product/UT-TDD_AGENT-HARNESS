---
plan_id: PLAN-REVERSE-404-design-doc-cross-integrity-backfill
title: "PLAN-REVERSE-404: design-doc-cross-integrity 検出能力の設計 back-fill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
status: confirmed
created: 2026-07-09
updated: 2026-07-09
owner: Codex
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
parent_design: docs/plans/PLAN-L7-404-design-doc-cross-integrity-gate.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
backprop_scope:
  - layer: L6-function-design
    decision: updated
    evidence_path: docs/design/harness/L6-function-design/function-spec.md
    reason: "設計 doc 横断の重複定義 / 循環依存検出を analyzeDesignDocCrossIntegrity として登録する。"
  - layer: L7-unit-test-design
    decision: updated
    evidence_path: docs/test-design/harness/L7-unit-test-design.md
    reason: "U-DESIGN-CROSS-* oracle で重複定義、doc 間循環、doctor gate 接続を固定する。"
  - layer: governance-schedule
    decision: updated
    evidence_path: docs/governance/vmodel-upgrade-schedule.md
    reason: "工程管理表に L6-59 / L7-404 の現在地を登録する。"
agent_slots:
  - role: tl
    slot_label: "TL - 設計 back-fill と実装 gate の整合確認"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-404-design-doc-cross-integrity-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-404-design-doc-cross-integrity-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L6-59-design-doc-cross-integrity-check.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/governance/vmodel-upgrade-schedule.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-404-design-doc-cross-integrity-gate.md
  requires:
    - docs/plans/PLAN-L7-404-design-doc-cross-integrity-gate.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T13:26:00+09:00"
    tests_green_at: "2026-07-09T13:26:00+09:00"
    verdict: approve
    scope: "PLAN-REVERSE-404。L7 実装で必要になった設計 doc 横断整合性検出能力を L6/L7/工程管理表へ back-fill した。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: lint
        command: "bun run src\\cli.ts plan lint --gate governance"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T13:26:00+09:00"
        evidence_path: docs/design/harness/L6-function-design/function-spec.md
        output_digest: "sha256:dbd805dc9dd4f35f2c042d097adedc96176e121ef2939511ad6eed4cff5bbed3"
        anchor_commit: 8ce5feb56aa4e4db61773490f97cf1744185992e
---

# PLAN-REVERSE-404: design-doc-cross-integrity 検出能力の設計 back-fill

## R0 Evidence

ZIP `cmd_check` 相当の横断検出は、HARNESS 既存 gate では参照切れ・孤立定義・module import cycle・
typed-spec trace closure に分散していた。設計 doc をノードにした重複定義 / 循環依存は、実装前に
L6 の検出契約と L7 oracle へ登録されていなかった。

## R1 Observed Gap

`PLAN-L6-43` の typed spec projection は ID 定義と relation を持つが、それを doc 単位に畳み込む
gate がなかった。`PLAN-L4-20` の document catalog は doc 対象集合を持つが、ID 定義粒度までは
単独で持たない。この 2 つを結合する設計が必要だった。

## R2 Alignment

本 back-fill は新規外部機能ではなく、Vモデル設計 doc の自己検査能力の補完である。module import
dependency drift と typed-spec trace closure は既存責務のまま残し、doc ノード級の整合性のみを
`design-doc-cross-integrity` が担う。

## R3 / R4 Outcome

L6 function-spec、L7 unit-test-design、工程管理表へ検出能力を登録し、PLAN-L7-404 の実装 gate と
双方向に接続した。これにより、工程表から DB projection / doctor gate へ現在地を追える。

## DoD

- [x] Root cause (doc ノード級検出の設計欠落) を記録した。
- [x] L6 / L7 / 工程管理表へ back-fill した。
- [x] PLAN-L7-404 と双方向 requires で接続した。
