---
plan_id: PLAN-L7-418-plan-asset-v2-adapter-migration-ledger
title: "PLAN-L7-418 (add-impl): PLAN Asset v2 canonical adapter / migration ledger"
kind: add-impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-71-plan-asset-canonical-migration-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - PlanAsset/Revision/Evidence/Reservationとv1 adapter"
  - role: qa
    slot_label: "QA - U-PA-001..013 Red→Green"
generates:
  - artifact_path: docs/plans/PLAN-L7-418-plan-asset-v2-adapter-migration-ledger.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-418-plan-asset-v2-backfill.md
    artifact_type: markdown_doc
  - artifact_path: ut-tdd.project.json
    artifact_type: config
  - artifact_path: src/plan-asset/domain/plan-asset.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/domain/evidence-record.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/domain/reservation.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/adapters/legacy-plan-adapter.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/adapters/project-identity-loader.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/schema.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db.ts
    artifact_type: source_module
  - artifact_path: src/kernel/plan-alias.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/plan-asset/domain.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/project-identity-loader.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/ledger-schema.test.ts
    artifact_type: test_code
  - artifact_path: tests/harness-db-constraints.test.ts
    artifact_type: test_code
  - artifact_path: tests/dependency-drift.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-71-plan-asset-canonical-migration-contracts.md
  requires: []
  references:
    - docs/plans/PLAN-REVERSE-418-plan-asset-v2-backfill.md
---

# PLAN-L7-418

U-PA-001..013をRed freezeし、immutable aggregate/VO、canonical v1 adapter、collision migration ledger、採番予約、HEAD tracked repository identity loaderを実装する。情報損失と曖昧short IDはfail-closeする。DoDはlegacy全件変換、collision全件判断、旧revision不変、review、Reverse-418合流である。

planned deliverablesは`src/kernel`、`src/plan-asset/{domain,application,ports,adapters}`、reservation/migration schema、dry-run CLI、実行可能Red/Green testである。実体化した成果物はfrontmatter `generates`へ昇格する。

## 実装進捗

- U-PA-001..013: Redを観測後、domain/value object、legacy canonical adapter、曖昧alias fail-close、採番予約、HEAD tracked project identity provenance、ledger typed partial UNIQUE/append-only trigger/composite FK/path/version/schema・row digest fingerprintをGreen化済み。
- `state-db`のlegacy short alias解決は先頭一致を廃止し、canonical resolverのexact/unique規則へ統合済み。
- 未完了: ledger application transaction/reducer、全legacy PLAN移行・collision判断、dry-run CLI、Reverse-418合流。
