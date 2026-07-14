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
  - artifact_path: src/state-db/projections/poc-evaluations.ts
    artifact_type: source_module
  - artifact_path: src/projection/contracts/projection-store.ts
    artifact_type: source_module
  - artifact_path: src/projection/application/project-poc-evaluations.ts
    artifact_type: source_module
  - artifact_path: src/projection/domain/poc-evaluations.ts
    artifact_type: source_module
  - artifact_path: src/projection/domain/model-evaluations.ts
    artifact_type: source_module
  - artifact_path: src/projection/domain/plan-status.ts
    artifact_type: source_module
  - artifact_path: src/projection/application/project-model-evaluations.ts
    artifact_type: source_module
  - artifact_path: src/projection/domain/operational-metrics.ts
    artifact_type: source_module
  - artifact_path: src/projection/application/project-operational-metrics.ts
    artifact_type: source_module
  - artifact_path: src/projection/adapters/model-evaluation-config.ts
    artifact_type: source_module
  - artifact_path: src/state-db/sqlite-projection-store.ts
    artifact_type: source_module
  - artifact_path: src/state-db/sqlite-projection-rebuild.ts
    artifact_type: source_module
  - artifact_path: src/state-db/sqlite-transaction.ts
    artifact_type: source_module
  - artifact_path: tests/sqlite-projection-store.test.ts
    artifact_type: test_code
  - artifact_path: tests/model-evaluation-domain.test.ts
    artifact_type: test_code
  - artifact_path: tests/operational-metrics-domain.test.ts
    artifact_type: test_code
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
- PoC評価の集計規則は`src/projection/domain/poc-evaluations.ts`が所有する。`src/state-db/projections/poc-evaluations.ts`は旧importを壊さない互換re-exportであり、domain正本ではない。
- PoC用の意味的`PocEvaluationReadPort`と`ProjectionStore`をneutral projection contractへ抽出し、`read → domain → store`のapplication縦sliceを実装した。SQL構文はapplicationへ漏らさない。
- SQLite具象責務は`SqliteProjectionStore`、`runSqliteTransaction`、`clearRebuildableProjectionTables`へ分割した。旧`projection-writer.ts`はpublic facadeと全projectorの再構築順序を保つが、row正規化、secret fail-close、plan join分類、PoC read、transaction、再構築table消去は所有しない。
- model評価はopt-in repository config adapter、application command、pure event builder、grouped SQLite readへ分割した。成功statusはneutral domain SSoTへ移し、旧skill projection exportを維持した。N+1 queryを1 grouped queryへ置換し、token/costの非対称母集団とNULL非捏造をoracleで固定した。
- operational metricsはdrive/hook/workflowの意味fact read、pure policy、application eventへ分割した。99行のSQL/policy/persist混在をfacadeへ縮退し、drive 0.8境界、0母数、trouble/blocked/human/retry、stable order/IDを`U-DOMAIN-006`で自己証明する。

## 検出負債

- `DEBT-L7-423-01`: `recordFinding`直接経路は共通event正規化を通らない。finding payload用のsensitive-value oracleをRed化し、finding専用schema guardまたは共通guardへ収束させる。
- `DEBT-L7-423-02`: 単独の`record`はprojection row upsertとjoin finding upsertを一つのtransaction境界に束ねない。application commandのtransaction port移行時に故障注入テストを追加し、部分commit 0を証明する。
- 両負債はlegacy facade削除までのmigration wave内で解消する。現抽出のGreenを完了宣言や恒久免除に使わない。

## migration wave

1. Red architecture gateでstate-dbの許可依存を`schema/kernel/shared/projection contracts`へ限定し、巨大projection module残存を検出する。
2. `normalizePath`と`LintResult`をneutral shared contractへ移し、一時re-exportを経てconsumerを移行する。
3. `ProjectionStore` / `ProjectionTransaction` / `ProjectionReadPort`を抽出し、state-dbをSQLite adapterへ限定する。
4. repository I/Oを`projection/adapters/repository-sources`へ移し、normalized `HarnessProjectionSourceBundle`をapplicationへ渡す。
5. plan/review/graph/catalog/telemetry/feedback/screen projectorをpure `bundle -> ProjectionEvent[]`として分割し、80行/CC12/nesting3を満たす。
6. `rebuildHarnessDb`をapplication commandへ移し、CLI/doctor composition rootでsource adapterとstoreを注入する。
7. drive registrationのrebuild fallbackをdoctor compositionへ移し、旧`state-db/projection-writer.ts` facadeを削除する。
8. U-DOMAIN、projection、db-currency、drive-db、dependency-drift、typecheck、full doctor、Reverse-423で収束を証明する。
