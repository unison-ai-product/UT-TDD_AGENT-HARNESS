---
plan_id: PLAN-REVERSE-420-vmodel-contract-compiler-backfill
title: "PLAN-REVERSE-420: Vモデルcontract compiler実装の設計backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
status: confirmed
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-420-vmodel-contract-compiler-registry.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
backprop_scope:
  - layer: L4-basic-design
    decision: updated
    evidence_path: docs/design/harness/L4-basic-design/architecture.md
    reason: "vmodel-contract compiler/application/adapter境界をbuilding blockへ登録する。"
  - layer: L5-detailed-design
    decision: updated
    evidence_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    reason: "compiler registryのpackage、公開API、依存方向、移行waveを固定する。"
  - layer: L6-function-design
    decision: updated
    evidence_path: docs/design/harness/L6-function-design/function-spec.md
    reason: "aggregate、digest、例外契約、DbCを固定する。"
  - layer: L7-unit-test-design
    decision: updated
    evidence_path: docs/test-design/harness/L7-unit-test-design.md
    reason: "U-VMC正負例とdigest drift oracleを固定する。"
agent_slots:
  - role: tl
    slot_label: "TL - compiler/registry実装事実をcontractへbackfill"
review_evidence:
  - reviewer: codex-engine-wave-rereview
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-10T18:56:16+09:00"
    tests_green_at: "2026-07-10T18:55:57+09:00"
    verdict: approve
    scope: "compiler実装事実のL4/L5/L6/L7 backfillと正規artifact ownershipを独立レビュー。"
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/vmodel-contract-compiler.test.ts tests/right-arm-gate-planning.test.ts tests/right-lung-doc-governance.test.ts tests/vmodel-source-assets.test.ts tests/oracle-test-trace.test.ts tests/relation-graph-loader.test.ts tests/merged-plan-status.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T18:55:57+09:00"
        evidence_path: tests/vmodel-contract-compiler.test.ts
        output_digest: "sha256:3ed3a8512c7a23825594e4f6e61bfaf5bfee793a96f74dda06a1ca692a3e9a38"
        anchor_commit: 3d232e9cc187bc06006896dadc6774148a871a0b
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-420-vmodel-contract-compiler-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-420-vmodel-contract-compiler-registry.md
  requires:
    - docs/plans/PLAN-L7-420-vmodel-contract-compiler-registry.md
---

# PLAN-REVERSE-420

R0でloader/compilerを観測し、R1でDTO/digest差、R2でU/I-VMC、R3で手書き定数drift、R4でL5-18/L6-73/vmodel-contract.yamlへ合流する。

R4ではL4 architecture、L5 module decomposition、L6 function-spec、L7 unit-test-designへ実装事実を合流済みとする。
