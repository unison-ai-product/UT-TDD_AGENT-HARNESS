---
plan_id: PLAN-L7-423-engine-swap-domain-objects-ports
title: "PLAN-L7-423 (add-impl): engine-swap domain objects / ports / repositories"
kind: add-impl
layer: L7
drive: fullstack
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-10-06
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-75-engine-swap-domain-method-port-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: SE - kernel/domain/application/port/adapter移行
  - role: qa
    slot_label: QA - U-DOMAIN/cycle/CQS/size gate
generates:
  - artifact_path: docs/plans/PLAN-L7-423-engine-swap-domain-objects-ports.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-423-engine-swap-domain-backfill.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/db-projection-coverage.ts
    artifact_type: source_module
  - artifact_path: src/shared/source-text.ts
    artifact_type: source_module
  - artifact_path: tests/shared-source-text.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-store-contract.test.ts
    artifact_type: test_code
  - artifact_path: src/state-db/projections/poc-evaluations.ts
    artifact_type: source_module
  - artifact_path: src/projection/contracts/projection-store.ts
    artifact_type: source_module
  - artifact_path: src/projection/application/project-poc-evaluations.ts
    artifact_type: source_module
  - artifact_path: src/projection/domain/poc-evaluations.ts
    artifact_type: source_module
  - artifact_path: src/projection/domain/plan-status.ts
    artifact_type: source_module
  - artifact_path: src/projection/domain/operational-metrics.ts
    artifact_type: source_module
  - artifact_path: src/projection/application/project-operational-metrics.ts
    artifact_type: source_module
  - artifact_path: src/projection/adapters/repository-plan-sources.ts
    artifact_type: source_module
  - artifact_path: src/projection/domain/plan-projection.ts
    artifact_type: source_module
  - artifact_path: src/state-db/sqlite-projection-store.ts
    artifact_type: source_module
  - artifact_path: src/state-db/sqlite-projection-rebuild.ts
    artifact_type: source_module
  - artifact_path: src/state-db/sqlite-transaction.ts
    artifact_type: source_module
  - artifact_path: tests/sqlite-projection-store.test.ts
    artifact_type: test_code
  - artifact_path: tests/operational-metrics-domain.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-plan-projector.test.ts
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
    - docs/plans/PLAN-L7-467-repository-document-disposition-closure-gate.md
    - docs/plans/PLAN-REVERSE-423-engine-swap-domain-backfill.md
review_evidence:
  - reviewer: claude-blind-reviewer
    review_kind: cross_agent
    reviewed_at: 2026-07-14T11:10:00+09:00
    tests_green_at: 2026-07-14T11:05:00+09:00
    verdict: approve
    scope: "Codex 実装の PR #53 (wave3) を Claude blind-review 後、PO 巻き取り授権 (2026-07-14)
      下で main へ retarget・統合検証してマージ (merge commit c7b6c004)。projection
      engine-swap (domain/application/contracts 分離 + sqlite-projection-store) を
      typecheck (tsc exit 0) / biome (458 files clean) / targeted+regression 10
      suites
      (plan-asset・projection-writer・dependency-drift・model-evaluation・operation\
      al-metrics・sqlite-projection-store・spec-ir・sub-doc-schema-integrity・revie\
      w-evidence) exit 0 で確認。未クローズ note M-1: operational metrics の NULL-mode
      合算という挙動変更に依存する consumer 有無は PO 確認推奨。"
    worker_model: gpt-5.5-codex
    reviewer_model: claude-opus-4-8
    green_commands:
      - kind: unit_test
        command: bun run vitest run tests/plan-asset/ tests/projection-writer.test.ts
          tests/dependency-drift.test.ts tests/model-evaluation*.test.ts
          tests/operational-metrics-domain.test.ts
          tests/sqlite-projection-store.test.ts
          tests/spec-ir-projections.test.ts
          tests/sub-doc-schema-integrity.test.ts tests/review-evidence.test.ts
          (main+wave3 統合ツリー)
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: 2026-07-14T11:05:00+09:00
        evidence_path: tests/sqlite-projection-store.test.ts
        output_digest: sha256:b350374330754e9872a1c337efadba1decbdfd646152bca3bc95d219991e1825
        anchor_commit: c7b6c0046cf12602b7e8c7a2237eb00b1ed11da0
status: confirmed
github_issue_id: 789
admission_receipt:
  schema_version: v2
  receipt_id: certificate:f5d2f9a37f087a8b24282231a2be4780
  command_id: plan-revise:issue-789:legacy-423:2:retire-exec:rechain-3
  admitted_at: 2026-10-06T07:10:33.140Z
  source_digest: sha256:d0987251dd1af0d2d0a533e541cc75da077ca10bf6514d2f1cbeed15aa578471
  decision_digest: sha256:7afedf121a06086cc4d744ff2c7ae8690d1eb3e88452968a54aad904bd27dfbd
  receipt_digest: sha256:c4613f1075f71699d93b2b3e8924a7b3c7785703f8c2d35f227e418dbc340593
  binding:
    path: docs/plans/PLAN-L7-423-engine-swap-domain-objects-ports.md
    plan_id: PLAN-L7-423-engine-swap-domain-objects-ports
    asset_id: plan:legacy:cd4fbbe70850280e912cb74ec26a630b119fa415f99a113fe9cf0a8136256c82
    revision: 2
    content_digest: sha256:d0987251dd1af0d2d0a533e541cc75da077ca10bf6514d2f1cbeed15aa578471
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 789
    episode_id: E4-789-token-ingest-retirement
    projection_state: unprojected
  origin:
    plan_id: PLAN-L6-789-token-ingest-retirement
    revision: 1
    digest: sha256:6e321c50a2d970b43e360753ff86de89b2e43e21d6832c5565a5e4ec8b34b142
  transition:
    direction: design_to_implementation
    implementation_disposition: none
  reentry:
    target_plan_id: PLAN-L7-423-engine-swap-domain-objects-ports
    target_revision: 2
    phase: forward_merge
  escape_reason: "Issue #789: PLAN-L6-789 §4 PR-1 による部分退役。撤去した model evaluation
    artifact を generates から外し、部分退役注記を入れる。status は変えない。"
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
- PLAN projectionは`repository-plan-sources` adapterとpure `plan-projection` domainへ移管した。facadeはcaptured sourceのwrite列をstoreへ渡すだけとし、path順・legacy decision fallback・source hashの決定性を`projection-plan-projector.test.ts`で固定する。残るsource bundleとapplication commandは次waveで同じ境界へ移す。
- L6 blind-reviewで構造ID例外の曖昧さが検出されたため、projection rowのprimary key/`*_id`も列名だけではsecret guardを免除しないruntime境界へ強化した。既存の`U-DOMAIN-007`完了主張は撤回し、branded `ProjectionIdFactory`と任意cast拒否が実装されるまでcandidate Redを維持する。
- L7 claim-blind reviewで、helper外のraw `BEGIN`配下から将来projection storeを呼ぶとre-entrant depthを共有できないこと、およびsavepoint rollback/release自体の失敗時に原errorを保持するoracleがないことを検出した。現consumerに衝突経路はないが、将来回帰を防ぐarchitecture/故障注入負債として明示する。

## 検出負債

- `DEBT-L7-423-01`: `recordFinding`直接経路は共通event正規化を通らない。finding payload用のsensitive-value oracleをRed化し、finding専用schema guardまたは共通guardへ収束させる。
- `DEBT-L7-423-02`: 単独の`record`はprojection row upsertとjoin finding upsertを一つのtransaction境界に束ねない。application commandのtransaction port移行時に故障注入テストを追加し、部分commit 0を証明する。
- `DEBT-L7-423-03`: 現runtime guardはID列を含む全stringを検査するが、検査済みcomponentからのみ生成できるbranded `ProjectionIdFactory`と任意cast拒否は未実装である。source bundle/application command導入時にID生成portへ収束させ、compile-time負例とruntime負例の両方で閉じる。
- `DEBT-L7-423-04`: projection write consumerのouter transactionを`ProjectionTransactionPort`へ限定するarchitecture gateと、nested savepointのrollback/release故障時に原error・outer rollback・depth復元を同時に証明するfault oracleがない。raw `BEGIN`配下からstoreを呼ぶfixtureとrelease失敗fixtureをRed化し、silent nested transactionとerror maskingを拒否する。
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

## 部分退役注記 (2026-10-06、PLAN-L6-789)

`PLAN-L6-789-token-ingest-retirement` (Issue #789、PO 承認 2026-09-30) により、本 PLAN の model evaluation 部分は退役した。formal supersede は token ingest の起点契約である `PLAN-L7-57` の 1 件だけで、本 PLAN は supersede 対象にしない (PLAN-L6-789 §3.1-3.3)。

- `generates` から次の 4 件を外した。実装 PR (`PLAN-L7-789-token-ingest-retirement-execution`) が撤去した artifact であり、残すと `plan-artifact-existence` が phantom を出す: `src/projection/domain/model-evaluations.ts`、`src/projection/application/project-model-evaluations.ts`、`src/projection/adapters/model-evaluation-config.ts`、`tests/model-evaluation-domain.test.ts`。
- 上記に対応する L7 oracle (model evaluation domain/application/config/SQLite read) は L7 unit test design で撤回した。

PoC evaluation / operational metrics / plan projection などの他の domain object と port は継承する。status は変えない。
