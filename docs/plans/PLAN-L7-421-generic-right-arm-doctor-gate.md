---
plan_id: PLAN-L7-421-generic-right-arm-doctor-gate
title: "PLAN-L7-421 (add-impl): generic G8-G14 right-arm / document governance doctor gate"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-73-vmodel-contract-compiler-right-arm-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: se
    slot_label: "SE - contract-derived right-arm/right-lung gate"
  - role: qa
    slot_label: "QA - fake PLAN/link/gate/artifactとL11/L13負系"
review_evidence:
  - reviewer: codex-engine-wave-rereview
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-10T18:56:16+09:00"
    tests_green_at: "2026-07-10T18:56:11+09:00"
    verdict: approve
    scope: "contract-derived right-arm/right-lung、偽PLAN、層欠落、unknown status、L11/L13実PLAN backlink照合を独立再レビュー。P0/P1なし。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/vmodel-contract-compiler.test.ts tests/right-arm-gate-planning.test.ts tests/right-lung-doc-governance.test.ts tests/vmodel-source-assets.test.ts tests/oracle-test-trace.test.ts tests/relation-graph-loader.test.ts tests/merged-plan-status.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T18:55:57+09:00"
        evidence_path: tests/right-arm-gate-planning.test.ts
        output_digest: "sha256:2bbf22c3f583cec8beaa658998fe3d3ef6683f996d58b6d7ff7dd094acca9086"
        anchor_commit: 487ccd318a7e27f56ea35764d6204f35300d91d4
      - kind: typecheck
        command: "bunx tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-10T18:56:11+09:00"
        evidence_path: src/lint/right-arm-gate-planning.ts
        output_digest: "sha256:dc123b0f5e8822c4cd8c82a6f8e5c8da212fb3da6ecc9e459230dab55f4d159e"
        anchor_commit: 487ccd318a7e27f56ea35764d6204f35300d91d4
generates:
  - artifact_path: docs/plans/PLAN-L7-421-generic-right-arm-doctor-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-421-generic-right-arm-backfill.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/right-arm-gate-planning.ts
    artifact_type: source_module
  - artifact_path: src/lint/right-lung-doc-governance.ts
    artifact_type: source_module
  - artifact_path: tests/right-arm-gate-planning.test.ts
    artifact_type: test_code
  - artifact_path: tests/right-lung-doc-governance.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-73-vmodel-contract-compiler-right-arm-contracts.md
  requires:
    - docs/plans/PLAN-L7-420-vmodel-contract-compiler-registry.md
    - docs/plans/PLAN-REVERSE-421-generic-right-arm-backfill.md
  references:
    - docs/plans/PLAN-L7-416-active-upgrade-frontier-right-arm-gate.md
    - docs/plans/PLAN-L7-420-vmodel-contract-compiler-registry.md
    - docs/plans/PLAN-REVERSE-421-generic-right-arm-backfill.md
---

# PLAN-L7-421

contractのexpected PLAN ID/gate/governance artifact/evidence manifestからG8-G14を検査する。自己申告linkだけの偽PLAN、親backlink欠落、L11/L13検査漏れをfail-closeする。

## DoD

- [x] G8-G14の7層を名前・PLAN identity・gateでexactly-once検証する。
- [x] governance artifactとevidence manifestの宣言・実在・生成関係を照合する。
- [x] L11/L13の固有backlinkを実verify PLAN frontmatterまで照合する。
- [x] planned/completedを分離し、unknown/archive/accepted-before-freezeをfail-closeする。
- [x] right-lungの7層markerを構造的に検査し、単なる件数一致を許容しない。
- [x] independent reviewとReverse-421を記録してconfirmed化する。full regression/doctorはPR release gateで再検収する。
