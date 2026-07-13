---
plan_id: PLAN-L7-423-engine-swap-domain-objects-ports
title: "PLAN-L7-423 (add-impl): engine-swap domain objects / ports / repositories"
kind: add-impl
layer: L7
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-13
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-75-engine-swap-domain-method-port-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - kernel/domain/application/port/adapter移行"
  - role: qa
    slot_label: "QA - U-DOMAIN/cycle/CQS/size gate"
generates:
  - artifact_path: docs/plans/PLAN-L7-423-engine-swap-domain-objects-ports.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-423-engine-swap-domain-backfill.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/db-projection-coverage.ts
    artifact_type: source_module
  - artifact_path: src/shared/source-text.ts
    artifact_type: source_module
  - artifact_path: tests/dependency-drift.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-75-engine-swap-domain-method-port-contracts.md
  requires: []
  references:
    - docs/plans/PLAN-L7-417-source-disposition-profile-projection.md
    - docs/plans/PLAN-L7-418-plan-asset-v2-adapter-migration-ledger.md
    - docs/plans/PLAN-L7-419-forward-fsm-transition-workflow-cli.md
    - docs/plans/PLAN-L7-420-vmodel-contract-compiler-registry.md
    - docs/plans/PLAN-L7-422-repository-document-disposition-closure-gate.md
    - docs/plans/PLAN-REVERSE-423-engine-swap-domain-backfill.md
---

# PLAN-L7-423

U-DOMAINをRed freezeし、共通kernelとmodule-boundary/cycle/CQS移行を所有する。417/418/419/420/422が所有するdomain機能を再実装しない。互換re-export、public API owner、migration waveを守り、cycle 0、function 80行/CC12/nesting3をhard gateにする。DoDは全consumer移行、review、Reverse-423合流である。

## 実装観測

- U-DEPD-005でreal repository全module graphのcycle 0を固定した。
- `db-projection-coverage`が具象`HarnessDb`へ型逆依存していたため、query ownerの`DbIntrospectionPort`へ反転した。state-dbのprojection方向を維持し、7件として列挙されていた単一SCCをallowlistなしで解消した。
- `projection-writer.ts`のapplication orchestration分割は本PLANの残DoDとして継続し、cycle 0だけをgod object解消完了の代用にしない。

## migration wave

1. Red architecture gateでstate-dbの許可依存を`schema/kernel/shared/projection contracts`へ限定し、巨大projection module残存を検出する。
2. `normalizePath`と`LintResult`をneutral shared contractへ移し、一時re-exportを経てconsumerを移行する。
3. `ProjectionStore` / `ProjectionTransaction` / `ProjectionReadPort`を抽出し、state-dbをSQLite adapterへ限定する。
4. repository I/Oを`projection/adapters/repository-sources`へ移し、normalized `HarnessProjectionSourceBundle`をapplicationへ渡す。
5. plan/review/graph/catalog/telemetry/feedback/screen projectorをpure `bundle -> ProjectionEvent[]`として分割し、80行/CC12/nesting3を満たす。
6. `rebuildHarnessDb`をapplication commandへ移し、CLI/doctor composition rootでsource adapterとstoreを注入する。
7. drive registrationのrebuild fallbackをdoctor compositionへ移し、旧`state-db/projection-writer.ts` facadeを削除する。
8. U-DOMAIN、projection、db-currency、drive-db、dependency-drift、typecheck、full doctor、Reverse-423で収束を証明する。
