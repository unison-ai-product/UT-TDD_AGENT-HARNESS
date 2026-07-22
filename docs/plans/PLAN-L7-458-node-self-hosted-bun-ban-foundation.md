---
plan_id: PLAN-L7-458-node-self-hosted-bun-ban-foundation
title: "PLAN-L7-458 (add-impl): Node self-hosted Bun permanent-ban foundation"
kind: add-impl
layer: L7
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-22
updated: 2026-07-22
owner: PO / Codex
github_issue_id: 134
parent_design: docs/plans/PLAN-L6-92-resource-kernel-function-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: "SE - scanner object、debt baseline、Node build/bootstrap、SQLite adapter"
  - role: qa
    slot_label: "QA - detector self-host、no-new/zero分離、Bun process 0、mutation oracle"
generates:
  - artifact_path: docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/bun-migration-debt.yaml
    artifact_type: config
  - artifact_path: src/lint/bun-permanent-ban.ts
    artifact_type: source_module
  - artifact_path: src/runtime/node-bootstrap.ts
    artifact_type: source_module
  - artifact_path: tests/bun-permanent-ban.test.ts
    artifact_type: test_code
  - artifact_path: tests/node-self-host-bootstrap.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-92-resource-kernel-function-contracts.md
  requires: []
  blocks: []
  references:
    - docs/adr/ADR-009-resource-kernel-native-custody-companion.md
    - docs/plans/PLAN-L4-32-resource-governed-execution-kernel.md
    - docs/plans/PLAN-L5-25-resource-kernel-physical-protocol.md
    - docs/test-design/harness/L7-unit-test-design.md
review_evidence: []
---

# PLAN-L7-458: Node self-hosted Bun permanent-ban foundation

## 1. Atomic slice

Bun ban detectorと、そのdetectorを実行するNode build/bootstrapを同じTDD sliceで実装する。detectorだけを先にBun上でGreenにすると「Bunを禁止する壁がBunへ依存する」循環になるため分割しない。既存Bunはallowlistでpassへ変換せず、`migration_debt` findingとして全件を保持する。

## 2. Gate semantics

- `no-new`: frozen inventory digestに対する新規・変更・owner/期限喪失findingをRedにする。既存production debtは可視の非zero countとして返す。
- `zero`: production pathのfindingが1件でもあればRed。最終cutoverまで意図的にRedを維持する。
- `coverage`: scanner対象、parse結果、unknown executable artifact、runtime observer gapを集約し、欠測時は両modeをRedにする。
- negative fixture: detector ID、fixture root、期待findingをtyped registryへ隔離し、production allowlistとして利用不能にする。

## 3. Object分割

`ManifestScanner`、`ModuleSpecifierScanner`、`ProcessArgvScanner`、`WorkflowHookScanner`、`PackScanner`、`CurrentDocScanner`、`RuntimeImageScanner`は短いpure objectとして`BanFinding`を返す。`BanInventory`がcanonical path、detector ID、evidence digestでsort/dedupeし、`BanPolicy`が`no-new | zero`を判定する。filesystem/process収集はportに隔離し、scannerへambient cwd/PATHを渡さない。

`NodeBootstrap`はreview済みlock graphからcompiled ESM entrypointを生成・照合し、Node executable、core digest、package-lock digest、build policyを`NodeBootstrapReceipt`へ封印する。Node失敗時にBun、tsx、bunx、TS直実行へfallbackしない。SQLite driverはport化し、transaction/WAL/type/busy/close semanticsを既存canonical corpusへ合わせる。

## 4. TDD order

1. `U-BUNBAN-001..012`と`U-NODEBOOT-001..012`をRed freezeする。
2. scanner pure objectsとdeterministic inventoryをGreen化する。
3. 現存Bun debt manifestを実scan結果から固定し、`no-new`だけをGreen、`zero`をRedにする。
4. Node clean install/build/compiled CLI/SQLite/targeted testをGreen化する。
5. 同じcompiled Node CLIでban auditをself-hostし、Bun executable/descendant 0 receiptを保存する。
6. mutation、Windows/Linux、blind cross-reviewを通す。

## 5. Slice acceptance

- [ ] Bun未導入clean checkoutでreview済みlock graphからNode buildが完了する。
- [ ] compiled Node CLIで`status --json`、ban audit、targeted testsが動く。
- [ ] `no-new`はGreenだが既存debt countを0に偽装せず、`zero`はRedを維持する。
- [ ] process receiptのBun executable/descendant countが0でobserver欠測がない。
- [ ] scanner自身、build、test runner、SQLite pathに新規Bun依存がない。
- [ ] 独立reviewとtested commitが一致する。

本PLANはfoundationであり、hook/wrapper/CI/Packの全切替とBun物理削除を完了扱いにしない。
