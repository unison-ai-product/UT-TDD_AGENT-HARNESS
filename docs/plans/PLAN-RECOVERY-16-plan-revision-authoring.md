---
plan_id: PLAN-RECOVERY-16-plan-revision-authoring
title: "PLAN-RECOVERY-16: legacy PLAN revision authoring recovery"
kind: recovery
layer: cross
drive: agent
route_signal: regression_dev
route_mode: recovery
created: 2026-07-17
updated: 2026-07-22
owner: PO / TL
backprop_decision: required
backprop_decision_reason: Redesign supersessionとplan admissionを同時に満たすrevision
  authoring契約が欠落しており、L6 admission contractとL7実装へ戻す必要がある。
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: TL - revision authoring / Redesign bundle atomicity
  - role: se
    slot_label: SE - ledger transaction / CLI / publisher integration
  - role: qa
    slot_label: QA - stale base / replay / fault injection oracle
  - role: aim
    slot_label: AIM - revision asset identity / provenance integrity review
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md
    artifact_type: markdown_doc
  - artifact_path: scripts/git-hooks/authoring-recovery-gate.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/cli/plan-authoring-recovery.ts
    artifact_type: source_module
  - artifact_path: src/cli/plan-revise.ts
    artifact_type: source_module
  - artifact_path: src/cli/plan-redesign.ts
    artifact_type: source_module
  - artifact_path: src/cli/forward-escape-issue.ts
    artifact_type: source_module
  - artifact_path: src/cli/plan-adopt-genesis-chain.ts
    artifact_type: source_module
  - artifact_path: src/cli/genesis-adoption-production.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/authoring-recovery-db-evidence.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/node-authoring-artifact-publisher.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/node-plan-authoring-recovery-assessor.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/node-plan-authoring-recovery-executor.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/node-plan-authoring-recovery-runner.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/node-plan-redesign-runner.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/node-plan-revision-runner.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/issue-projection-evidence-resolver.ts
    artifact_type: source_module
  - artifact_path: src/github/node-gh-forward-escape-issue-port.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/forward-escape-issue-projection-runner.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/node-forward-escape-ledger-view.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/node-issue-projection-evidence-resolver.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-authoring-command-runner.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-authoring-command-port.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-authoring-recovery-port.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-content-binding.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-redesign-command-assembler.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-revision-command-assembler.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-revision-ledger-adapter.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/trusted-git-blob-resolver.ts
    artifact_type: source_module
  - artifact_path: src/git/trusted-git-blob-resolver.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/trusted-repository-identity-resolver.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/authoring-command-group.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/domain/plan-content-digest.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/authoring-recovery-db-evidence.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/authoring-operation-provenance.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/authoring-recovery-gate.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/application/node-genesis-adoption-runner.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/application/genesis-projection-dispatcher.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/adapters/sqlite-genesis-adoption-projection-adapter.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/genesis-adoption-transaction.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/genesis-route-binding.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/genesis-projection-outbox.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/plan-redesign-bundle.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/plan-revision-bootstrap.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/plan-revision-ledger.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/revision-visibility.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/schema.ts
    artifact_type: source_module
  - artifact_path: src/state-db/index.ts
    artifact_type: source_module
  - artifact_path: tests/authoring-recovery-gate.test.ts
    artifact_type: test_code
  - artifact_path: tests/authoring-recovery-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/node-authoring-artifact-publisher.test.ts
    artifact_type: test_code
  - artifact_path: tests/node-plan-authoring-recovery-runner.test.ts
    artifact_type: test_code
  - artifact_path: tests/node-plan-redesign-runner.test.ts
    artifact_type: test_code
  - artifact_path: tests/node-plan-revision-runner.test.ts
    artifact_type: test_code
  - artifact_path: tests/issue-projection-evidence-resolver.test.ts
    artifact_type: test_code
  - artifact_path: tests/forward-escape-issue-cli.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-plan-adopt-genesis-chain.test.ts
    artifact_type: test_code
  - artifact_path: tests/genesis-adoption-production.test.ts
    artifact_type: test_code
  - artifact_path: tests/node-gh-forward-escape-issue-port.test.ts
    artifact_type: test_code
  - artifact_path: tests/trusted-git-blob-resolver.test.ts
    artifact_type: test_code
  - artifact_path: tests/node-issue-projection-evidence-resolver.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/authoring-command-group.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/ledger-schema.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/genesis-adoption-transaction.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/node-genesis-adoption-runner.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/genesis-adoption-tracked-contract.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/genesis-adoption-production-chain.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/genesis-projection-dispatcher.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/genesis-projection-outbox.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/sqlite-genesis-adoption-projection-adapter.test.ts
    artifact_type: test_code
  - artifact_path: tests/state-db.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/support/genesis-adoption-fixture.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/plan-redesign-bundle.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/plan-revision-bootstrap.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/plan-revision-ledger.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-authoring-command-runner.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-content-binding.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-redesign-cli.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-redesign-command-assembler.test.ts
    artifact_type: test_code
  - artifact_path: tests/trusted-repository-identity-resolver.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-revise-cli.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
  requires: []
  references:
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L4-basic-design/data.md
    - docs/design/harness/L5-detailed-design/module-decomposition.md
    - docs/design/harness/L5-detailed-design/physical-data.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/test-design/harness/L8-integration-test-design.md
    - docs/test-design/harness/L9-system-test-design.md
    - docs/plans/PLAN-L7-435-drive-plan-admission-impl.md
    - docs/plans/PLAN-L7-441-plan-draft-recovery-v4.md
    - docs/plans/PLAN-L7-421-test-hygiene-live-tree-fence.md
    - docs/plans/PLAN-L7-89-plan-errata-supersession-gate.md
    - docs/plans/PLAN-L6-88-snapshot-runner-performance-redesign.md
review_evidence:
  - reviewer: claude-cross-reviewer
    review_kind: cross_agent
    reviewed_at: 2026-07-21T11:40:00+09:00
    tests_green_at: 2026-07-21T11:38:17+09:00
    verdict: superseded
    scope: "HISTORY ONLY — rev4後に未解決のauthoring recovery/redesign
      crash境界が判明したため承認効力を失った旧証跡。PR #103 HEAD dfddefeb の独立cross-review PASS。stale
      base/replay binding、artifact
      identity、通常例外rollback、Windows/Linux差異を攻撃し、未反駁attack 0。CI run
      29796108885でLinux全回帰、Windows scoped回帰、両OS doctor、aggregate gateがGreen。"
    worker_model: gpt-5.6-sol
    reviewer_model: claude-opus-4-8
    green_commands:
      - kind: integration_test
        command: "GitHub Actions harness-check-linux: bun run test"
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-07-21T11:38:13+09:00
        evidence_path: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/29796108885/job/88527660556
        output_digest: sha256:aab28f05dad284d803c0d101faa12e2acb34d226940e5441c6c3abb77dcf9859
      - kind: integration_test
        command: "GitHub Actions harness-check-windows: bun run test:windows"
        runner: ci
        scope: targeted
        exit_code: 0
        completed_at: 2026-07-21T11:36:16+09:00
        evidence_path: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/29796108885/job/88527660496
        output_digest: sha256:aab28f05dad284d803c0d101faa12e2acb34d226940e5441c6c3abb77dcf9859
      - kind: integration_test
        command: "GitHub Actions harness-check: require Linux and Windows success"
        runner: ci
        scope: gate
        exit_code: 0
        completed_at: 2026-07-21T11:38:17+09:00
        evidence_path: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/29796108885/job/88528379352
        output_digest: sha256:aab28f05dad284d803c0d101faa12e2acb34d226940e5441c6c3abb77dcf9859
status: draft
github_issue_id: 102
admission_receipt:
  schema_version: v2
  receipt_id: certificate:3a108064eb0826d1896ed7d15c74cb0f
  command_id: plan-recovery-16-20260721-07
  admitted_at: 2026-07-21T17:40:00+09:00
  source_digest: sha256:68fd8a18645fff0e14d9afa66fa9e8b42da6ad5ce88ee6cc1e8ba2feef7f1001
  decision_digest: sha256:c86be4b8d923ea831812912946f56e8f1858da84ecb10c014e5826d57ffdd98d
  receipt_digest: sha256:76c2b4a4b1b946b6df57ed71628e6f5acc85a51e24b3531fbb937dea2eb49c5e
  binding:
    path: docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md
    plan_id: PLAN-RECOVERY-16-plan-revision-authoring
    asset_id: plan:890b18d79d85d8d7cc2591c7146af5e2
    revision: 5
    content_digest: sha256:68fd8a18645fff0e14d9afa66fa9e8b42da6ad5ce88ee6cc1e8ba2feef7f1001
  route:
    signal: regression_dev
    mode: recovery
  issue:
    provider: github
    issue_id: 102
    episode_id: E4-102
    projection_digest: sha256:ccf42fa059eaf5950bf84337b180b1541dc68333caa7770ff7570786cf42b110
  origin:
    plan_id: PLAN-L6-86-drive-plan-admission-contract
    revision: 1
    digest: sha256:cac70ec0cf630a20c1180839dfa7bb3e0b98fc6911448bd9336bd827de5923fc
  reentry:
    target_plan_id: PLAN-L6-86-drive-plan-admission-contract
    target_revision: 2
    phase: forward_merge
  escape_reason: "Issue #102 rev4 approval is superseded by unresolved authoring
    recovery and redesign crash boundaries; rev5 reopens the PLAN without an
    implementation-complete claim"
---

# PLAN-RECOVERY-16: legacy PLAN revision authoring recovery

## 1. 再現と根因

Issue #98 のRedesignで新規PLANの正規receiptを発行し、supersedes先へ後継back-referenceを
追加すると、`plan-supersession`はGreenになる一方、`plan admission-check`は
`plan-admission-legacy-direct-edit`で拒否する。`plan draft`は新規asset revision 1だけを
生成し、既存PLANをrevision N+1として発行するCLI/ledger経路がない。

domainの`PlanAsset.revise()`はstale base拒否と連番を既に持つ。欠落はapplication、ledger、
tracked receipt、CLIの接続である。検出器を弱めず、設計どおりのauthoring経路を追加する。

## 2. Recovery契約

`ut-tdd plan revise --manifest <path>`をrevision authoringの唯一経路とする。manifestは
`command_id`、`plan_id`、recorded time、admission、次source、tracked projectionに加え、
baseのasset ID、revision、revision digest、source commit/blob/content digest、projection tail
digestを必須にする。active aliasとassetはledger/HEADから再解決し、自己申告だけで選ばない。

legacy PLANがledger未adoptの場合は、指定HEAD blobをlossless revision 1として同じwriter
transactionへbootstrapし、その直後にrevision 2をappendする。任意seedでasset IDを作らず、
repository identityとplan IDから既存migration規約どおり導出する。adopt済みassetは最新revisionを
再構築し、`PlanAsset.revise()`へ接続する。

## 3. Transaction / Saga

新設`PlanRevisionLedgerTransaction`は`BEGIN IMMEDIATE`内でcommand replay、asset、active alias、
最新revision、base digestを再検証し、N+1 revision、admission event/receipt、append command receiptを
一括appendする。単純revisionではreservation/new asset/alias eventを作らない。alias変更は別commandとする。

既存`PlanDraftService`のjournal/publisher/renderer境界はgeneric `PlanAuthoringService`へ抽出して
create/reviseで共有する。`TrackedReceiptRenderer`は可変revision bindingを維持し、source PLANと
tracked projectionを同時stage/publish/restoreする。publish直前にもsource/projection preimage digestを
再検証する。通常例外はDB/fileとも旧状態へ戻す。process kill後の完全収束はPLAN-L7-441へ依存し、
本PLANだけでcrash-safeを過大主張しない。

Redesign bundleはreplacement PLANの`supersedes`とorigin revisionのback-referenceを同一command
groupへ束縛し、片肺publishを許さない。#98ではPLAN-L4-31 revision 2とPLAN-L6-88 receipt/projectionが
揃った場合だけForward reentryをGreenとする。

## 4. TDD工程

| Step | Red oracle | Green target |
|---|---|---|
| 1 | legacy rev1→rev2、adopt済N→N+1、stale revision/digest/alias | revision ledger transaction |
| 2 | same command replay、changed payload conflict、全write境界fault rollback | ledger adapter / canonical digest |
| 3 | strict manifest、HEAD blob/preimage/projection tail drift | `plan revise` assembler / Node runner |
| 4 | source+projection publish/restore、receipt revision exact binding | generic authoring Saga / renderer |
| 5 | Redesign origin+replacement bundle、片肺fault、admission/supersession両Green | bundle coordinator / #98 reentry |

## 4.1 Issue #129 legacy genesis adoption

既存のlegacy PLANがPlanAsset台帳に存在しないために、Issue E4 projectionとPLAN admissionが
互いを前提として起票不能になる循環を、`plan adopt-genesis-chain`で一度だけ解消する。
対象はtrusted HEADに存在するlegacy PLAN revision 1に限定し、repository identity、source
commit/blob/content digest、Issue preimage、origin/reentry、drive model、branchを同じcommandへ
束縛する。`route_tuple_digest`はorigin/reentryを含むcanonical routeから導出し、callerの任意値を
採用しない。

local ledger appendとIssue custodyを原子的に確定した後、remote projectionはdurable outboxへ
pendingを記録してから実行する。remote失敗は`recovery_required`として残し、同一commandの
再実行だけが一度だけ`projected`へ収束できる。process再起動後にもpendingを再開できなければ
完了とはしない。CLIはproduction custody/outbox adapterを構成できた場合だけ公開し、fake runner
だけのsurfaceを完成扱いしない。

tracked route transaction oracleは `PLAN-L4-31 -> PLAN-L6-88` と
`PLAN-L6-83 -> PLAN-L7-452` のHEAD blobを使い、local atomicity、route binding、replayを検証する。
これをproduction実chainとは呼ばない。production chain oracleはNode runner、Plan Ledger、HARNESS DB、
Issue projection portを通過し、採用asset、Issue custody、Forward reentry、重複remote write禁止を検証する。
`PLAN-L4-31 -> PLAN-L6-88` の完了判定は未発行L6-88を捏造せず、#102のrevision authoringと
Redesign bundleを経てL4-31 revision 2 / L6-88 admissionが揃った後続実行に限定する。

### 4.1.1 stacked closure手順

PR #130はmechanism PR、PR #117はmain負債を閉じるclosure PRとして責務を分ける。
PR #130のbaseは`work/recovery-16-pr103-evidence`（PR #117 head）なので、PR #130をmainへ
直接retarget、squash、cherry-pickしない。PR #130 exact HEADでLinux/Windows/aggregate、PLAN ownership、
claim-blind/spec-blind reviewがGreenになった後、通常mergeでPR #117 branchへ合流する。合流commitを
新しいtrusted HEADとして、古いHEADのmanifest、blob OID、Issue preimageを再利用しない。

closureは次の順序で実行する。

1. **L6-83 genesis**: 合流後HEADのL6-83 blobからmanifestを生成し、genesis custody専用のcanonical
   `redesign` Issue preimageへ束縛して`plan adopt-genesis-chain`を実行する。Issue #129はmechanismの
   tracking Issueであり、本文をL6-83 route contractへ差し替えてcustody Issueとして流用しない。
   Plan Ledgerのasset/revision/admission/custody/outboxとHARNESS DBのE2/E4、remote metadata commentを
   command ID単位で照合する。
2. **L7-452 Forward authoring**: L6-83 revision 1をoriginとして、L7-452用の通常`add-feature` Issueを
   Forward escape経路でE4へ採用する。L7-452はgenesis transactionの第二assetとして捏造せず、
   plan revision authoring経路で発行・review・confirmする。L6-83のgenesis receipt、L7-452 Issue E4、
   L7-452 authoring receiptの三段をtraceで結ぶ。
3. **L4-31 genesis**: 合流後HEADのL4-31 blobを別command/custody Issueでrevision 1へ採用する。
   L6-83と同じIssue番号、command ID、route receiptを共有しない。
4. **L4-31 revision 2 + L6-88**: Issue #102のrevision authoringを通し、既存Redesign bundleの同一
   command groupでL4-31 revision 2のback-referenceとL6-88 revision 1/admissionを発行する。
   Issue #98のE4、supersession receipt、両artifact projectionが揃ってから#98をGreenとする。
5. PR #117のPLAN-L7-452 / PLAN-RECOVERY-16をexact combined HEADでreview・confirmし、main負債2件、
   Linux/Windows/aggregateを再計測する。Green後だけPR #117をmainへ通常mergeする。

### 4.1.2 multi-asset判定

genesis transactionのmulti-asset化は不要である。genesisの責務はlegacy origin 1 assetのrevision 1
採用とcustody/outboxのatomic appendであり、Forward targetの発行まで同じSQLite transactionへ入れると、
Issue E4・review・設計freezeを迂回する。L6-83→L7-452はgenesis receiptから通常Forward authoringへ
接続するSagaで閉じる。L4-31→L6-88は既存Redesign bundleがL4 revision 2とreplacement revision 1の
multi-member atomicityを既に担当する。必要なのはcross-command traceとrecovery convergenceであり、
genesis transactionの責務拡張ではない。

### 4.1.3 GitHub comment案（未送信）

- **Issue #129**: 「PR #130の完了条件をmechanism Greenに限定する。tracked route oracleを実chainと
  呼ばず、PR #117 combined HEADでL6-83 production adoption、L7-452通常Forward authoring、L4-31
  adoptionを実行する。Issue #129本文はcustody preimageへ流用しない。」
- **Issue #102**: 「L4-31 revision 1 genesis後、revision authoring + Redesign bundleでL4-31 revision 2と
  L6-88を同一command group発行する。genesisだけでは#102 ACを満たさない。」
- **Issue #98**: 「性能Redesignの完了証拠はIssue E4、L4-31 revision 2、L6-88 admission、supersession、
  performance/safety oracle。PR #130のmechanism Greenを#98完了と数えない。」

## 5. DoD

PR #130単体は次のmechanism ACまでを判定し、実repository/remote closureを完了したと主張しない。

- [ ] trusted HEAD、repository identity、Issue contract/preimage、origin/reentryをmanifestへ束縛し、driftをremote起動前に拒否する。
- [ ] local genesis appendとpending outboxがatomicで、command-specific dispatcherが別Plan/HARNESS DBをcloseしながらprojected/recovery_requiredへ収束する。
- [ ] tracked route transaction oracleとproduction composition oracleを名称・証拠種別で区別する。

次はPR #130をPR #117へ合流したcombined HEAD上の後続closure ACであり、PR #130単体のGreenへ算入しない。

- [ ] legacy PLANをbase blob/digest/revisionへ束縛してrevision N+1として発行できる。
- [ ] stale base、digest drift、alias ambiguity、revision gap、receipt不整合をwrite前にfail-closeする。
- [ ] revision、admission event/receipt、append receipt、source、projectionを通常例外時all-or-nothingにする。
- [ ] replayは同payloadだけ同receiptを返し、command ID再利用は拒否する。
- [ ] revised PLANのembedded receipt、tracked projection、ledgerが同一asset/revision/content digestを持つ。
- [ ] direct edit拒否を維持し、revision command postimageだけadmission Greenになる。
- [ ] Redesign supersessionのorigin correctionとreplacementを片肺にしない。
- [ ] #98のPLAN-L4-31 revision 2 / PLAN-L6-88でadmissionとsupersessionが両方Greenになる。
- [ ] PLAN-L7-441未完のprocess-kill境界を明示し、通常例外のatomicityをcrash convergenceと混同しない。
- [ ] L6-83 genesis receipt→L7-452用add-feature Issue E4→L7-452 authoring receiptがcombined HEADでtrace Greenになる。
- [ ] `PLAN-L4-31 -> PLAN-L6-88`は#102のrevision authoring完了後、L4-31 revision 2とL6-88 admissionを実artifactでGreenにする（tracked route transactionだけで代替しない）。
