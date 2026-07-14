---
plan_id: PLAN-L7-417-source-disposition-profile-projection
title: "PLAN-L7-417 (add-impl): source disposition / semantic catalog / profile projection"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-70-source-catalog-profile-resolver-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - catalog/profile domainとprojection実装"
  - role: qa
    slot_label: "QA - U-DISP/U-PROFILE/I-DISP Red→Green"
generates:
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/plans/PLAN-L7-417-source-disposition-profile-projection.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-417-source-disposition-profile-backfill.md
    artifact_type: markdown_doc
  - artifact_path: src/disposition/domain/document-disposition-catalog.ts
    artifact_type: source_module
  - artifact_path: src/disposition/adapters/strict-markdown-table.ts
    artifact_type: source_module
  - artifact_path: src/disposition/adapters/tracked-vmodel-loader.ts
    artifact_type: source_module
  - artifact_path: src/disposition/domain/authoring-provenance.ts
    artifact_type: source_module
  - artifact_path: src/disposition/domain/target-resolver.ts
    artifact_type: source_module
  - artifact_path: src/disposition/adapters/tracked-target-registry.ts
    artifact_type: source_module
  - artifact_path: src/disposition/adapters/git-authoring-provenance.ts
    artifact_type: source_module
  - artifact_path: src/disposition/ports/authoring-provenance.ts
    artifact_type: source_module
  - artifact_path: src/profile/domain/resolver.ts
    artifact_type: source_module
  - artifact_path: src/profile/adapters/tracked-profile-loader.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-tables-vmodel.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-table-builders.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-catalog.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-indexes.ts
    artifact_type: source_module
  - artifact_path: tests/harness-db-constraints.test.ts
    artifact_type: test_code
  - artifact_path: tests/vmodel-schema.test.ts
    artifact_type: test_code
  - artifact_path: tests/vmodel-migration.test.ts
    artifact_type: test_code
  - artifact_path: tests/disposition/catalog.test.ts
    artifact_type: test_code
  - artifact_path: tests/disposition/strict-markdown-table.test.ts
    artifact_type: test_code
  - artifact_path: tests/disposition/tracked-authoring-loader.test.ts
    artifact_type: test_code
  - artifact_path: tests/disposition/authoring-provenance.test.ts
    artifact_type: test_code
  - artifact_path: tests/disposition/git-authoring-provenance.test.ts
    artifact_type: test_code
  - artifact_path: tests/disposition/target-resolver.test.ts
    artifact_type: test_code
  - artifact_path: tests/disposition/tracked-target-registry.test.ts
    artifact_type: test_code
  - artifact_path: tests/profile/resolver.test.ts
    artifact_type: test_code
  - artifact_path: tests/profile/tracked-loader.test.ts
    artifact_type: test_code
  - artifact_path: src/state-db/vmodel-projections.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/state-db/migration.ts
    artifact_type: source_module
  - artifact_path: src/state-db/spec-ir-projections.ts
    artifact_type: source_module
  - artifact_path: src/lint/db-projection-coverage.ts
    artifact_type: source_module
  - artifact_path: src/doctor/db-projection.ts
    artifact_type: source_module
  - artifact_path: tests/disposition/projection.test.ts
    artifact_type: test_code
  - artifact_path: src/lint/design-language.ts
    artifact_type: source_module
  - artifact_path: tests/design-language.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-70-source-catalog-profile-resolver-contracts.md
  requires: []
  references:
    - docs/plans/PLAN-REVERSE-417-source-disposition-profile-backfill.md
    - docs/governance/vmodel-item-target-ledger.md
review_evidence:
  - reviewer: "Codex design reviewer"
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-10T22:00:00+09:00"
    tests_green_at: "2026-07-10T21:59:50+09:00"
    verdict: approve
    worker_model: gpt-5
    reviewer_model: gpt-5
    scope: "HEAD 73ca9cf4とReverse-417を独立read-only review。tamper false-green、profile manifest、U-PROFILE trace/explicit overlay、target resolver、DB constraint closureを再検査し、Critical 0 / Important 0でAPPROVE。検収・merge権限は委譲されていない。"
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/coding-rules.test.ts tests/design-language.test.ts tests/improvement-backlog.test.ts tests/db-projection-coverage.test.ts tests/harness-db-constraints.test.ts tests/disposition/strict-markdown-table.test.ts tests/disposition/tracked-authoring-loader.test.ts tests/disposition/catalog.test.ts tests/disposition/projection.test.ts tests/disposition/target-resolver.test.ts tests/disposition/tracked-target-registry.test.ts tests/profile/resolver.test.ts tests/profile/tracked-loader.test.ts tests/vmodel-schema.test.ts tests/vmodel-migration.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T21:59:50+09:00"
        evidence_path: tests/profile/resolver.test.ts
        output_digest: "sha256:22b4499a487b8ce9d886b141f3c1bcd2ff86a3e2d79b30b586eeb1c4649cbd30"
        anchor_commit: 73ca9cf4a03b15e83cb42b2e55cf4370337bc0a4
---

# PLAN-L7-417

U-DISP/U-PROFILEをRed freeze後、catalog/profile domain、authoring loader、DB projectorをsmall moduleで実装する。manifest宣言件数との整合を検証し、109/163/21/8を恒久定数化しない。DoDはtargeted/full regression、rebuild identity差0、cross-agent review、Reverse-417合流である。

planned deliverablesは`src/disposition/{domain,application,ports,adapters}`、`src/profile/{domain,application,ports,adapters}`、DB schema/projection、実行可能Red/Green test、item-target ledger validationである。実体作成と同時にfrontmatter `generates`へ昇格する。

2026-07-10 Red/Green waveではpure catalog/profile domain、strict table parser、tracked 109/21/163 catalog loaderを実装した。
DB schema/projector、profile tracked loader、provenance receipt、I-DISP-001/rollback、pure canonical target resolver、
既存profile entryのversioned migration/constraint、constraint coverage detector、pending finding projectionは実装済み。残る
target registry adapterによる実authoring全edge existence検査まで実装済み。Reverse-417合流とfull regressionが未完了であり、
独立reviewとtargeted regressionを完了し、Reverse-417へ合流した。

Red freezeは`U-DISP-001..005`、query純粋性/安定順序、`U-PROFILE-001..005`を同一contract revisionで先行し、
domain Green後に`I-DISP-001`（PK/digest/finding identity fixed point）とinvalid authoring rollbackをRed化する。
schema registry制約、strict loader、source/item target非推論、document `doc_type_id` profile境界を縮退させない。

## Acceptance Criteria

- [x] tracked 109/21/163 catalogと8 profile/26 decisionをlosslessに投影する。
- [x] provenance、canonical target、typed DB constraint、migrationをfail-closeで検証する。
- [x] `I-DISP-001` fixed-pointとtamper rollbackをfalse-greenなしで証明する。
- [x] `U-PROFILE-001..005`と設計oracleの意味を一致させる。
- [x] independent read-only reviewでCritical/Important 0を確認する。
- [x] Reverse-417へR0-R4実装事実と再現commandを合流する。
