---
plan_id: PLAN-RECOVERY-16-plan-revision-authoring
title: "PLAN-RECOVERY-16: legacy PLAN revision authoring recovery"
kind: recovery
layer: cross
drive: agent
route_signal: regression_dev
route_mode: recovery
created: 2026-07-17
updated: 2026-09-15
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
  - artifact_path: src/plan-admission/plan-ledger-rehydrator.ts
    artifact_type: source_module
  - artifact_path: src/cli/plan-revise.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/node-plan-revision-runner.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-content-binding.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-revision-command-assembler.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-revision-ledger-adapter.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/plan-revision-bootstrap.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/plan-revision-ledger.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/sealed-lineage-local-migration.ts
    artifact_type: source_module
  - artifact_path: tests/node-plan-revision-runner.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-content-binding.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/plan-revision-bootstrap.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/plan-revision-ledger.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/sealed-lineage-local-migration.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-revise-cli.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
  requires: []
  references:
    - docs/plans/PLAN-L7-435-drive-plan-admission-impl.md
    - docs/plans/PLAN-L7-441-plan-draft-recovery-convergence.md
    - docs/plans/PLAN-L7-89-plan-errata-supersession-gate.md
    - docs/plans/PLAN-RECOVERY-17-redesign-bundle-reentry.md
review_evidence:
  - reviewer: claude
    review_kind: cross_agent
    reviewed_at: 2026-07-27T13:45:00+09:00
    tests_green_at: 2026-07-27T12:25:26+09:00
    verdict: pass
    worker_model: gpt-5.6-sol
    reviewer_model: claude-opus-4-8
    scope: "revision authoring core (plan revise CLI / runner / ledger transaction /
      bootstrap / content binding) を Codex 実装・Claude 非author で検証。snapshot runner
      で 5 test files / 75 tests green を Codex 記録 (12:25) と Claude 独立再実測 (13:41)
      の 2 回一致確認。Opus blind-review で digest 再計算・receipt chain 72 records・
      無関係変更なしを確認 (issue #157 記録)。"
    green_commands:
      - kind: unit_test
        command: bun scripts/run-vitest-snapshot.ts
          tests/node-plan-revision-runner.test.ts
          tests/plan-content-binding.test.ts
          tests/plan-asset/plan-revision-bootstrap.test.ts
          tests/plan-asset/plan-revision-ledger.test.ts
          tests/plan-revise-cli.test.ts
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: 2026-07-27T12:25:26+09:00
        evidence_path: .ut-tdd/audit/PLAN-RECOVERY-16-3558da2f-revision-core-snapshot.log
        output_digest: sha256:9712ccc6ebf017bb0311854a795c0e11d12f5cf570017a8bbbe9b3d7edf45def
        anchor_commit: 7f25c06d8f2b3fde9180aa8907f22f1561c9345b
status: confirmed
github_issue_id: 102
admission_receipt:
  schema_version: v2
  receipt_id: certificate:3bf790ecebfa3a8548f4d62be7414052
  command_id: plan-revise:issue-541:recovery-16:7
  admitted_at: 2026-09-16T20:20:00+09:00
  source_digest: sha256:5130a75c5712ce2e948c62ad5d429510dfffeee03d3ba8d63e30aecd285a0f22
  decision_digest: sha256:0c602385dfe6a8424d499cca7898473adf1b099ffe8b726f21112627913af488
  receipt_digest: sha256:db55bc5c88211eceaa426d60b5548a4405364eb5d011474eea857e2f85539772
  binding:
    path: docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md
    plan_id: PLAN-RECOVERY-16-plan-revision-authoring
    asset_id: plan:rebase:74ca026f9a0b72dca6f4fb164dd4e8f43c9ea3c9b31c4db21dec38a66d9d7d57
    revision: 7
    content_digest: sha256:5130a75c5712ce2e948c62ad5d429510dfffeee03d3ba8d63e30aecd285a0f22
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
  escape_reason: "Issue #541 (PR #607 Codex Sol FLAG 3件是正): 再水和対象を embedded
    admission_receipt へ全項目束縛し最新sequence条件で一意化、integrity mismatch/lineage
    ambiguityをwrite-0 fail-closeに改め、fallbackをauthority不在に限定する契約改訂 (revision
    5、docs-only)"
---

# PLAN-RECOVERY-16: legacy PLAN revision authoring recovery

## Status

confirmed。revision authoring core (CLI / runner / ledger transaction / bootstrap /
content binding) は main へ merge 済みで、5 test files / 75 tests green を 2 回
(Codex 実測 2026-07-27 12:25 / Claude 独立再実測 13:41) 確認した。根拠:
`.ut-tdd/audit/PLAN-RECOVERY-16-3558da2f-revision-core-snapshot.log`。

未完だった Redesign bundle / #98 Forward reentry のスコープは
`docs/plans/PLAN-RECOVERY-17-redesign-bundle-reentry.md` へ移管した (同 PLAN の
admission receipt が origin として本 PLAN revision 3 を記録しており、本 revision が
その back-reference である)。

本 confirm は direct edit ではなく、本 PLAN 自身が復旧した正規経路で発行した:
歴史系譜 (asset `plan:890b18d79d85d8d7cc2591c7146af5e2`、terminal revision 3) は
clean checkout から ledger 復元不能 (Issue #157 実測) のため
`SealedLineageLocalMigration` により `historical_sealed_unrehydratable` で seal し、
HEAD 本文を successor asset revision 1 として genesis 移行した上で、
`ut-tdd plan revise --manifest` により本 revision を append した (Issue #143 方向、
PO 案 A 採択 2026-07-27)。

revision 4 (Issue #541、2026-09-15): §2 に決定的再水和の正規化と seal fallback の
発動条件を追記した。旧解釈 (legacy asset は seal + successor genesis が唯一経路) は本
revision が supersede する。Issue #541 の契約は本 revision に従い、`plan:legacy:` asset の
再水和対応 (node-plan-revision-runner の除外解除) を実装 PR で行う。

revision 5 (Issue #541、2026-09-15、PR #607 Codex Sol FLAG 3 件の是正): 再水和の対象を
HEAD embedded admission_receipt への全項目束縛と最新 sequence 条件で一意化し、
integrity mismatch と lineage ambiguity を fallback ではなく write-0 fail-close に改め、
fallback を authority 不在 (embedded receipt 不在 / 対応 record 不在) に限定した。
§4 Step 6 と §5 の oracle を個別判定へ分解した。

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

決定的再水和の対象 asset と terminal record は自己申告で選ばず、HEAD 本文の embedded
`admission_receipt` から一意に決める。tracked projection
(`docs/governance/plan-admission-receipts.json`) に、HEAD embedded receipt の
receipt_id / command_id / receipt_digest / decision_digest / source_digest / binding
(path / plan_id / asset_id / revision / content_digest) の全項目と一致する record が
ちょうど 1 件あり、その record が同じ plan_id / path を持つ全 record (asset を問わない)
の中で最新 sequence であるとき、`plan-ledger-rehydrator` はその asset / revision を
projection の表記のまま worktree ローカル ledger へ再構築する。これは「推測復元」に
該当しない正規経路であり、asset prefix (`plan:<sha>` / `plan:legacy:` / `plan:rebase:`)
で区別しない。本段落は「active alias と asset を ledger / HEAD から再解決し自己申告だけ
で選ばない」の ledger 不在時の具体化であり、alias 解決や revision の推測は行わない。
再水和に成功した asset は legacy bootstrap 経路 (revision 1 起点) にも seal /
successor genesis にも進めず、それらの write は 0 とする。

一致 record が存在するのに、HEAD content digest と record の content_digest、
canonical payload digest と manifest base の revision_digest、HEAD embedded receipt の
各項目と record、の いずれかが不一致の場合、または一致 record より新しい同 plan_id /
path の record が存在する場合 (lineage ambiguity) は、integrity 違反として ledger /
source / projection への write 0 で fail-close する。これらは fallback の発動条件ではない。

seal + successor genesis への fallback は、tracked ファイルだけで独立に検証できる
authority 不在の場合に限る: (a) HEAD 本文に embedded `admission_receipt` が存在しない、
または (b) HEAD embedded receipt の receipt_id を持つ record が projection に 1 件も
存在しない。これ以外の理由で seal + successor genesis を選ぶことは禁止する。
tracked history が clean checkout から復元不能な場合は、推測で DB row を捏造せず
`SealedLineageLocalMigration` で歴史系譜を `historical_sealed_unrehydratable` として seal し、
HEAD 本文を successor asset revision 1 として genesis 移行する (Issue #143)。seal と
successor genesis は同一 writer transaction で確定し、片肺状態を作らない。

## 3. Transaction / Saga

新設`PlanRevisionLedgerTransaction`は`BEGIN IMMEDIATE`内でcommand replay、asset、active alias、
最新revision、base digestを再検証し、N+1 revision、admission event/receipt、append command receiptを
一括appendする。単純revisionではreservation/new asset/alias eventを作らない。alias変更は別commandとする。

既存`PlanDraftService`のjournal/publisher/renderer境界はgeneric `PlanAuthoringService`へ抽出して
create/reviseで共有する。`TrackedReceiptRenderer`は可変revision bindingを維持し、source PLANと
tracked projectionを同時stage/publish/restoreする。publish直前にもsource/projection preimage digestを
再検証する。通常例外はDB/fileとも旧状態へ戻す。process kill後の完全収束はPLAN-L7-441へ依存し、
本PLANだけでcrash-safeを過大主張しない。

Redesign bundleの原子性契約 (replacement `supersedes` とorigin back-referenceの同一command group
束縛、#98 Forward reentry) は PLAN-RECOVERY-17 へ移管した。

## 4. TDD工程

| Step | Red oracle | Green target |
|---|---|---|
| 1 | legacy rev1→rev2、adopt済N→N+1、stale revision/digest/alias | revision ledger transaction |
| 2 | same command replay、changed payload conflict、全write境界fault rollback | ledger adapter / canonical digest |
| 3 | strict manifest、HEAD blob/preimage/projection tail drift | `plan revise` assembler / Node runner |
| 4 | source+projection publish/restore、receipt revision exact binding | generic authoring Saga / renderer |
| 5 | Redesign origin+replacement bundle、片肺fault、admission/supersession両Green | (PLAN-RECOVERY-17 へ移管) |
| 6 | 各 asset prefix (`plan:<sha>` / `plan:legacy:` / `plan:rebase:`) で embedded receipt 一致 terminal record から再水和 → N+1 発行、成功時の legacy bootstrap / seal / successor genesis write 0、rev N→N+1 の previous_record_digest 連続性。負系: content digest 不一致・canonical payload digest 不一致・embedded receipt 項目不一致・より新しい同 plan_id record (lineage ambiguity) をそれぞれ write 0 fail-close。fallback 系: embedded receipt 不在・対応 record 不在のときだけ seal 経路が選ばれる | rehydrator / Node runner (Issue #541) |

## 5. DoD

- [x] legacy PLANをbase blob/digest/revisionへ束縛してrevision N+1として発行できる。
      根拠: `tests/plan-asset/plan-revision-bootstrap.test.ts` (20 passed) /
      `tests/plan-asset/plan-revision-ledger.test.ts` (13 passed)、
      `.ut-tdd/audit/PLAN-RECOVERY-16-3558da2f-revision-core-snapshot.log`。
- [x] stale base、digest drift、alias ambiguity、revision gap、receipt不整合をwrite前にfail-closeする。
      根拠: `tests/node-plan-revision-runner.test.ts` (28 passed、drift/alias/receipt oracle 群)。
- [x] revision、admission event/receipt、append receipt、source、projectionを通常例外時all-or-nothingにする。
      根拠: fault injection 境界テスト (bootstrap 9 境界 / migration 8 境界含む)。
- [x] replayは同payloadだけ同receiptを返し、command ID再利用は拒否する。
      根拠: `tests/plan-asset/plan-revision-ledger.test.ts` replay/conflict oracle。
- [x] revised PLANのembedded receipt、tracked projection、ledgerが同一asset/revision/content digestを持つ。
      根拠: `tests/node-plan-revision-runner.test.ts` U-PA-REV-016 ほか CAS binding oracle。
- [x] direct edit拒否を維持し、revision command postimageだけadmission Greenになる。
      根拠: `tests/plan-content-binding.test.ts` (3 passed) + 本 confirm 自体を
      `plan revise` postimage として発行した実績。
- [x] Redesign supersessionのorigin correctionとreplacementを片肺にしない。
      (PLAN-RECOVERY-17 へ移管。同 PLAN の DoD が引き継ぐ。)
- [x] #98のPLAN-L4-31 revision 2 / PLAN-L6-88でadmissionとsupersessionが両方Greenになる。
      (PLAN-RECOVERY-17 へ移管。同 PLAN の DoD が引き継ぐ。)
- [x] PLAN-L7-441未完のprocess-kill境界を明示し、通常例外のatomicityをcrash convergenceと混同しない。
      根拠: §3 の明示宣言 (crash-safe を過大主張しない) を維持。
- [x] plan:legacy: asset (実データ: PLAN-L6-93 rev 27) を tracked projection から再水和し
      revision 28 を発行できる。根拠: U-PA-REV-049 と U-PA-REV-057 の実Git object / 正規 CLI 実測 (Issue #541)。
- [x] integrity mismatch 3 軸 (content / canonical payload / embedded receipt 項目) と
      lineage ambiguity が個別の oracle で write 0 fail-close し、seal 経路へ落ちない。根拠: U-PA-REV-040 / 050 / 051 / 052 (Issue #541)。
- [x] fallback は embedded receipt 不在・対応 record 不在の 2 条件でのみ選ばれ、
      再水和成功時は legacy bootstrap / seal / successor genesis の write が 0 である。根拠: U-PA-REV-045 / 049 / 057 (Issue #541)。
