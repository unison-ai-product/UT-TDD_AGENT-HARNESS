---
plan_id: PLAN-L7-418-plan-asset-v2-adapter-migration-ledger
title: "PLAN-L7-418 (add-impl): PLAN Asset v2 canonical adapter / migration ledger"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-14
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-71-plan-asset-canonical-migration-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - PlanAsset/Revision/Evidence/Reservationとv1 adapter"
  - role: qa
    slot_label: "QA - U-PA-001..047 Red→Green / CLI fail-close"
generates:
  - artifact_path: docs/governance/vmodel-role-contracts.md
    artifact_type: design_doc
  - artifact_path: docs/improvement-backlog.md
    artifact_type: doc_update
  - artifact_path: docs/plans/PLAN-L7-418-plan-asset-v2-adapter-migration-ledger.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-418-plan-asset-v2-backfill.md
    artifact_type: markdown_doc
  - artifact_path: src/plan-asset/application/legacy-migration-dry-run.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/application/legacy-migration-decision-manifest.ts
    artifact_type: source_module
  - artifact_path: src/cli/plan-asset.ts
    artifact_type: source_module
  - artifact_path: tests/plan-asset/legacy-migration-dry-run.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: ut-tdd.project.json
    artifact_type: config
  - artifact_path: src/plan-asset/domain/plan-asset.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/domain/evidence-record.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/domain/evidence-policy.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/domain/evidence-types.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/domain/evidence-claims.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/domain/evidence-canonical.ts
  - artifact_path: src/plan-asset/ports/evidence-attestation.ts
  - artifact_path: src/plan-asset/adapters/hmac-evidence-attestation-authority.ts
  - artifact_path: src/plan-asset/kernel/hmac-evidence-attestation-verifier.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/domain/redacted-command-args.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/domain/reservation.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/application/reservation-service.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ports/clock.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ports/lease-token-key-ring.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ports/reservation-ledger.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/domain/legacy-migration.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/adapters/legacy-plan-adapter.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/adapters/project-identity-loader.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/adapters/legacy-plan-inventory.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/adapters/role-contract-registry.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/adapters/hmac-lease-token-key-ring.ts
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
  - artifact_path: tests/plan-asset/reservation-service.test.ts
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
review_evidence:
  - reviewer: claude-blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-07-14T00:30:00+09:00"
    tests_green_at: "2026-07-14T00:20:00+09:00"
    verdict: approve_after_fixes
    scope: "Codex 実装の PR #47 (wave2) を Claude blind-review 後、PO 巻き取り授権 (2026-07-14) 下でマージ。指摘 L-1 (plan-asset 系テストの live plan count 752/697 hardcode が HEAD 進行で顕在化) は tests/plan-asset/head-plan-doc-count.ts の HEAD 動的導出へ修正 (commit f2723dfa)。残る main baseline 再現失敗 (review-evidence/secret-scan/setup/doctor) は wave2 起因でないことを main 側で再現確認して帰属判定済み。worktree 検証で typecheck / biome / targeted 149 tests green 後に ff-merge。"
    worker_model: gpt-5.5-codex
    reviewer_model: claude-opus-4-8
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/plan-asset/ ほか targeted 149 tests (main + wave2 統合 worktree、typecheck/biome green 併走)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-14T00:20:00+09:00"
        evidence_path: tests/plan-asset/head-plan-doc-count.ts
        output_digest: "sha256:7a3595b4d3604406f56200883020542ac1ee6c83283f5ddcf28fd3a0d2f73998"
        anchor_commit: ef1142d89f76cbe233690dddc0cec160ae4d2c66
  - reviewer: claude-blind-reviewer-final
    review_kind: cross_agent
    reviewed_at: "2026-07-14T20:15:30+09:00"
    tests_green_at: "2026-07-14T20:15:13+09:00"
    verdict: pass
    scope: "HEAD 960161bfのHMAC attestation信頼境界、migration ledger、main互換、fixture secret、detached evidenceへ12件以上の攻撃を試行。条件付きPASSのvitest実走条件をdetached 127+49 testsで解除し、未反証attack 0。"
    worker_model: gpt-5.5-codex
    reviewer_model: claude-opus-4-8
    green_commands:
      - kind: unit_test
        command: "bun run scripts/run-vitest-snapshot.ts tests/plan-asset tests/harness-db-constraints.test.ts tests/dependency-drift.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-14T20:15:13+09:00"
        evidence_path: .ut-tdd/audit/A-145-l7-418-final-review-receipt.md
        output_digest: "sha256:d8d5904209490c60e039982ba4e95fb35c683ba1cc54ec2384c5f0c30e6fcec1"
        anchor_commit: 84ef5046
---

# PLAN-L7-418

U-PA-001..048をRed freezeし、immutable aggregate/VO、canonical v1 adapter、collision migration ledger、採番予約、署名付きtyped evidence、HEAD tracked repository identity loaderを実装する。情報損失と曖昧short IDはfail-closeする。DoDはlegacy全件変換、collision全件判断、旧revision不変、raw lease token非保存、evidence policy入力の型完備とproducer真正性検証、ledger schema v3移行、review、Reverse-418合流である。

planned deliverablesは`src/kernel`、`src/plan-asset/{domain,application,ports,adapters}`、reservation/migration schema、dry-run CLI、実行可能Red/Green testである。実体化した成果物はfrontmatter `generates`へ昇格する。

## 実装進捗

- U-PA-001..022: Redを観測後、domain/value object、legacy canonical adapter、曖昧alias fail-close、採番予約、HEAD tracked project identity provenance、ledger typed schema/replay verifier、atomic reservation/receipt transaction、HEAD PLAN全件inventory、lossless非互換YAMLのfail-closeをGreen化済み。
- U-PA-023/024/025/031: migration pure reducer、state transition、decision field matrix、immutable provenance replayを実行可能Red観測後Green化済み。
- ledger schema v2でderived migration identityとadopted `(target_asset_id,target_revision)`を分離し、pending/rejectedの架空PlanAsset生成を禁止、migrated/rekeyedのphantom revisionをcomposite FKで拒否するU-PA-023/028/029 DB oracleをGreen化済み。
- U-PA-026/027: `LegacyMigrationLedger.observe`でpending event/current/global receiptのatomic append、state conflict rollback、同command replay、異payload conflictをGreen化済み。
- U-PA-029: `LegacyMigrationLedger.reject`でdecided event/current/global receiptだけをatomic更新し、PlanAsset/revision/alias生成0をGreen化済み。
- U-PA-028: `LegacyMigrationLedger.adopt`でPlanAsset/revision 1/alias event+current/migratedまたはrekeyed event+current/global receiptを同一transactionで生成する。`migrated`はcollision/review provenanceを禁止し、`rekeyed`は両方を必須化するapplication oracle、composite revision target、全digest再検証をGreen化済み。
- dry-run inventory gateはHEAD PLAN全件についてdecisionを出力するだけでなく、A-187およびPLAN-L6-79採番SSoTから得た契約として、PLAN番号prefix一意性、catalog claimとtarget実体、reference target slot実在、委譲先設計実体、snapshot hash一致実体の取得元をfail-closeで検証する。foreign worktree上の未確定PLAN本文には依存せず、確定済HARNESS memoryの契約を入力境界とする。
- U-PA-034〜037: `LegacyMigrationDryRun` application objectと`plan migration-dry-run` CLIを追加。HEAD inventoryとのexactly-once bijection、source commit/blob/content digest、決定論的report digest、decision field matrixを自己証明する。非衝突件数は`HEAD全件 - reviewed rekey件数`として導出し、27群55件は`REVIEWED_REKEY_DECISIONS`へPLAN IDとnumeric prefixを明示列挙し、full legacy IDをcanonical aliasとしてrekeyedにする。manifestの欠落・余剰・group不一致をfail-closeし、`emitted=HEAD全件 / pending=0 / finding=0`をGreen条件とする。
- target/slot/delegation/snapshot provenance portを接続し、HEAD PLAN全件の実体証明を完了した。decision層だけのGreenではなく、独立Git objectと上流contract実体まで検証対象に含める。
- U-PA-038: confirmed/completed/accepted PLANの`generates[].artifact_path`をworking treeではなくHEAD treeへ突合する`HeadTargetRegistry`を追加。exact fileは非空blob、directory familyは配下に非空tracked blobが1件以上あることを要求する。file-only初版が4 directory familyをphantom扱いした誤検知をcommit前にRedで捕捉し、file/family両対応へ是正して当時HEAD 741件のfinding 0を回復した。
- A-187委譲実体監査で、現行`agent_slots`が`role + slot_label`のみでtyped `design_ref`を持たず受け皿実体を証明不能と確認した。IMP-162へ負債起票後、上流role contract正本を追加し、detectorをその設計へ追従させて解消した。label文字列から設計先を推測する実装や、検出を通すためのslot削除は禁止する。
- U-PA-039: dry-run recordの`sourceCommit + sourcePath`を独立Git oracleでblob OIDへ解決し、`git cat-file blob`の実bytes SHA-256が`sourceContentDigest`と一致することを再検証する。working tree再hashやreport内自己比較ではなく、commit-bound object取得元を証跡とする。
- U-PA-040: `vmodel-role-contracts.md`を7 roleの上流正本とし、HEADからstrict loadしたrole contractを全`agent_slots`へlossless projectionする。各recordは`role + slotLabel + contractRef`を保持し、未知role/label不正/contract target欠落をfail-closeする。独立Git oracleで全contract blobがsource commitに存在し非空であることを検証する。
- U-PA-041: HEADの`vmodel-item-target-ledger.md`にある全`target_kind=target_slot` edgeを、HEADの`vmodel-document-catalog.md`から構築したslot registryへ`resolveCanonicalTarget`で突合する。working tree catalogやdisplay claimを真実源にせず、slot欠落はdry-run global findingとしてfail-closeする。
- U-PA-042: `tests/cli-surface.test.ts`で`plan migration-dry-run --json`の公開契約を固定し、exit 0、`total=emitted=HEAD PLAN件数`、`migrated=total-rekeyed`、pending/finding 0をE2E検証する。
- U-PA-030: migration event/current/global receiptの双方向bijectionとstream/current集合一致をverifierへ追加し、event-only/receipt-only mutationをGreen化済み。
- U-PA-033: file-backed migration ledgerのclose/reopen後にcurrent state、event digest、command payload digest集合が完全一致するreconstruct oracleをGreen化済み。
- U-PA-032: observe 3境界とadoption 7境界へfault portを注入し、各例外後にmigration/receipt/asset/revision/alias全table delta 0をGreen化済み。U-PA-001..033の実行可能testはtodo 0。
- U-PA-026..030/032/033: atomic write-set、optimistic guard、global replay、双方向receipt、fault injection/reopen oracleをdesign freezeし、実行可能Red観測後にschema/applicationをGreen化済み。
- HEAD `274adf14` inventoryは741件、collision 20群/41 PLAN、digest=`86a25dda63d29db9a6d02b6bacfd835e53762cdf416bd8df5b0d04b7d3caf718`。digestはrepository identity receipt、source commit、Git blob OID、source content、frontmatter/body、known/unknown field、collision projectionを拘束し、旧18群/37 PLAN固定値へ検出を合わせない。
- `origin/main`取り込み後のHEAD `0b8893d9`では752件、collision 27群/55 PLANへ増加した。新規7群/14件も暗黙選択せずreview manifestへ明示追加し、現HEAD oracleへ追随した。
- main `29ce65c1`で再検証し、HEAD 760件、migrated 705、rekeyed 55、pending 0、finding 0へ決定論的に追随した。件数固定ではなくHEAD由来bijectionを契約とする。
- 独立監査でIMP-156のreservation token custody、EvidenceRecordのkind/cardinality/typed claims/producer/digest/supersession不足、L5 reservation schemaと実装のversion drift（IMP-167）を検出した。再レビューでproducer自己申告による偽CI証跡、nested policy ruleのTOCTOU、Cookie秘匿漏れ、鍵runtime property露出を検出した。U-PA-043〜048を追加Redとし、これらがGreenになるまでReverse-418とL7-419依存を閉じない。
- `state-db`のlegacy short alias解決は先頭一致を廃止し、canonical resolverのexact/unique規則へ統合済み。
- U-PA-001〜042の既存実装境界は完了した。U-PA-043〜048の追加境界は実装済みだが、detached HEAD Green、cross-runtime独立review、PR Ready化、Claude/PO acceptance、main mergeを実装完了と混同しない。
