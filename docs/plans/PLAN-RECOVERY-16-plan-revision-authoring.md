---
plan_id: PLAN-RECOVERY-16-plan-revision-authoring
title: "PLAN-RECOVERY-16: legacy PLAN revision authoring recovery"
kind: recovery
layer: cross
drive: agent
route_signal: regression_dev
route_mode: recovery
created: 2026-07-17
updated: 2026-07-21
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
  - artifact_path: scripts/git-hooks/pre-push
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/cli/plan-authoring-recovery.ts
    artifact_type: source_module
  - artifact_path: src/cli/plan-revise.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/node-atomic-draft-publisher.ts
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
  - artifact_path: src/plan-admission/plan-authoring-command-runner.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-content-binding.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-revision-command-assembler.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-revision-ledger-adapter.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/authoring-command-group.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/authoring-recovery-gate.ts
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
  - artifact_path: tests/authoring-recovery-gate.test.ts
    artifact_type: test_code
  - artifact_path: tests/authoring-recovery-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/node-authoring-artifact-publisher.test.ts
    artifact_type: test_code
  - artifact_path: tests/node-plan-authoring-recovery-runner.test.ts
    artifact_type: test_code
  - artifact_path: tests/node-plan-revision-runner.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/authoring-command-group.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/ledger-schema.test.ts
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
  - artifact_path: tests/plan-revise-cli.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
  requires: []
  references:
    - docs/design/harness/L4-basic-design/data.md
    - docs/design/harness/L5-detailed-design/physical-data.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/test-design/harness/L8-integration-test-design.md
    - docs/plans/PLAN-L7-435-drive-plan-admission-impl.md
    - docs/plans/PLAN-L7-441-plan-draft-recovery-convergence.md
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

## 5. DoD

- [ ] legacy PLANをbase blob/digest/revisionへ束縛してrevision N+1として発行できる。
- [ ] stale base、digest drift、alias ambiguity、revision gap、receipt不整合をwrite前にfail-closeする。
- [ ] revision、admission event/receipt、append receipt、source、projectionを通常例外時all-or-nothingにする。
- [ ] replayは同payloadだけ同receiptを返し、command ID再利用は拒否する。
- [ ] revised PLANのembedded receipt、tracked projection、ledgerが同一asset/revision/content digestを持つ。
- [ ] direct edit拒否を維持し、revision command postimageだけadmission Greenになる。
- [ ] Redesign supersessionのorigin correctionとreplacementを片肺にしない。
- [ ] #98のPLAN-L4-31 revision 2 / PLAN-L6-88でadmissionとsupersessionが両方Greenになる。
- [ ] PLAN-L7-441未完のprocess-kill境界を明示し、通常例外のatomicityをcrash convergenceと混同しない。
