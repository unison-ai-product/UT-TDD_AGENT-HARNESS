---
plan_id: PLAN-L7-420-vmodel-contract-compiler-registry
title: "PLAN-L7-420 (add-impl): declarative V-model contract compiler / registry"
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
    slot_label: "SE - VModelContract/loader/compiler/generated registry"
  - role: qa
    slot_label: "QA - U/I-VMC Red→Greenとgenerated drift"
review_evidence:
  - reviewer: codex-engine-wave-rereview
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-10T18:56:16+09:00"
    tests_green_at: "2026-07-10T18:56:11+09:00"
    verdict: approve
    scope: "L0-L14/G0.5-G14 topology、right-arm registry/digest、L11/L13固有backlink、負例を独立再レビュー。P0/P1なし。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
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
      - kind: typecheck
        command: "bunx tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-10T18:56:11+09:00"
        evidence_path: src/vmodel-contract/application/contract-compiler.ts
        output_digest: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        anchor_commit: 3d232e9cc187bc06006896dadc6774148a871a0b
generates:
  - artifact_path: docs/plans/PLAN-L7-420-vmodel-contract-compiler-registry.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-420-vmodel-contract-compiler-backfill.md
    artifact_type: markdown_doc
  - artifact_path: src/vmodel-contract/application/contract-compiler.ts
    artifact_type: source_module
  - artifact_path: src/vmodel-contract/adapters/yaml-contract-loader.ts
    artifact_type: source_module
  - artifact_path: tests/vmodel-contract-compiler.test.ts
    artifact_type: test_code
  - artifact_path: docs/process/vmodel-contract.yaml
    artifact_type: yaml_config
dependencies:
  parent: docs/plans/PLAN-L6-73-vmodel-contract-compiler-right-arm-contracts.md
  requires:
    - docs/plans/PLAN-REVERSE-420-vmodel-contract-compiler-backfill.md
  references:
    - docs/plans/PLAN-L7-417-source-disposition-profile-projection.md
    - docs/plans/PLAN-L7-419-forward-fsm-transition-workflow-cli.md
    - docs/plans/PLAN-REVERSE-420-vmodel-contract-compiler-backfill.md
---

# PLAN-L7-420

U-VMC/I-VMCをRed freezeし、YAML loader、validated aggregate、deterministic compiler、generated registry/digestを実装する。手書き定数driftはfail-closeする。

## DoD

- [x] L0-L14とG0.5-G14をexactly-onceで検証する。
- [x] L8-L14のPLAN ID、gate、governance artifact、evidence manifestを同じaggregateから生成する。
- [x] L11/L13例外の固有backlinkを自己申告でなくcompiler不変条件として検証する。
- [x] source/generated digestを同一raw aggregateから決定論的に生成する。
- [x] U-VMC正例・重複・欠落・digest drift・例外backlink負例をGreen化する。
- [x] independent reviewとReverse-420を記録してconfirmed化する。full regression/doctorはPR release gateで再検収する。
