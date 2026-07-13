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
    slot_label: "QA - U-PA-001..033 Red→Green"
generates:
  - artifact_path: docs/improvement-backlog.md
    artifact_type: doc_update
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
  - artifact_path: src/plan-asset/domain/legacy-migration.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/adapters/legacy-plan-adapter.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/adapters/project-identity-loader.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/adapters/legacy-plan-inventory.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/schema.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/plan-ledger.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/append-command.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/legacy-migration-ledger.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/transaction.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db.ts
    artifact_type: source_module
  - artifact_path: src/kernel/plan-alias.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/plan-asset/domain.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/legacy-migration.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/legacy-migration-ledger.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/project-identity-loader.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/legacy-inventory.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/ledger-schema.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/ledger-application.test.ts
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

U-PA-001..033をRed freezeし、immutable aggregate/VO、canonical v1 adapter、collision migration ledger、採番予約、HEAD tracked repository identity loaderを実装する。情報損失と曖昧short IDはfail-closeする。DoDはlegacy全件変換、collision全件判断、旧revision不変、review、Reverse-418合流である。

planned deliverablesは`src/kernel`、`src/plan-asset/{domain,application,ports,adapters}`、reservation/migration schema、dry-run CLI、実行可能Red/Green testである。実体化した成果物はfrontmatter `generates`へ昇格する。

## 実装進捗

- U-PA-001..022: Redを観測後、domain/value object、legacy canonical adapter、曖昧alias fail-close、採番予約、HEAD tracked project identity provenance、ledger typed schema/replay verifier、atomic reservation/receipt transaction、HEAD 741 PLAN inventory、lossless非互換YAMLのfail-closeをGreen化済み。
- U-PA-023/024/025/031: migration pure reducer、state transition、decision field matrix、immutable provenance replayを実行可能Red観測後Green化済み。
- ledger schema v2でderived migration identityとadopted `(target_asset_id,target_revision)`を分離し、pending/rejectedの架空PlanAsset生成を禁止、migrated/rekeyedのphantom revisionをcomposite FKで拒否するU-PA-023/028/029 DB oracleをGreen化済み。
- U-PA-026/027: `LegacyMigrationLedger.observe`でpending event/current/global receiptのatomic append、state conflict rollback、同command replay、異payload conflictをGreen化済み。
- U-PA-029: `LegacyMigrationLedger.reject`でdecided event/current/global receiptだけをatomic更新し、PlanAsset/revision/alias生成0をGreen化済み。
- U-PA-028: `LegacyMigrationLedger.adopt`でPlanAsset/revision 1/alias event+current/migratedまたはrekeyed event+current/global receiptを同一transactionで生成する。`migrated`はcollision/review provenanceを禁止し、`rekeyed`は両方を必須化するapplication oracle、composite revision target、全digest再検証をGreen化済み。
- dry-run inventory gateは741件全件についてdecisionを出力するだけでなく、A-187およびPLAN-L6-79採番SSoTから得た契約として、PLAN番号prefix一意性、catalog claimとtarget実体、reference target slot実在、委譲先設計実体、snapshot hash一致実体の取得元をfail-closeで検証する。foreign worktree上の未確定PLAN本文には依存せず、確定済HARNESS memoryの契約を入力境界とする。
- U-PA-034〜037: `LegacyMigrationDryRun` application objectと`plan migration-dry-run` CLIを追加。HEAD inventoryとのexactly-once bijection、source commit/blob/content digest、決定論的report digest、decision field matrixを自己証明する。非衝突700件はlossless migrated、20群41件は`REVIEWED_REKEY_DECISIONS`へPLAN IDとnumeric prefixを明示列挙し、full legacy IDをcanonical aliasとしてrekeyedにする。manifestの欠落・余剰・group不一致をfail-closeし、741 emitted / migrated 700 / rekeyed 41 / pending 0 / finding 0でGreen。
- dry-runの残Green条件はtarget/slot/delegation/snapshot provenance portを接続し、全741件の実体証明を完了することである。decision層だけのGreenをdry-run全体完成とは扱わない。
- U-PA-030: migration event/current/global receiptの双方向bijectionとstream/current集合一致をverifierへ追加し、event-only/receipt-only mutationをGreen化済み。
- U-PA-033: file-backed migration ledgerのclose/reopen後にcurrent state、event digest、command payload digest集合が完全一致するreconstruct oracleをGreen化済み。
- U-PA-032: observe 3境界とadoption 7境界へfault portを注入し、各例外後にmigration/receipt/asset/revision/alias全table delta 0をGreen化済み。U-PA-001..033の実行可能testはtodo 0。
- U-PA-026..030/032/033: atomic write-set、optimistic guard、global replay、双方向receipt、fault injection/reopen oracleはdesign freeze済み。実行可能Red testとschema/application Green化は未着手。
- HEAD `274adf14` inventoryは741件、collision 20群/41 PLAN、digest=`86a25dda63d29db9a6d02b6bacfd835e53762cdf416bd8df5b0d04b7d3caf718`。digestはrepository identity receipt、source commit、Git blob OID、source content、frontmatter/body、known/unknown field、collision projectionを拘束し、旧18群/37 PLAN固定値へ検出を合わせない。
- `state-db`のlegacy short alias解決は先頭一致を廃止し、canonical resolverのexact/unique規則へ統合済み。
- 未完了: 全legacy PLAN移行・collision判断、dry-run CLI、Reverse-418合流。
