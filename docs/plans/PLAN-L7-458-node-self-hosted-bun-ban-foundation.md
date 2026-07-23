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
updated: 2026-07-23
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
    slot_label: "QA - detector self-host、delta/compliance分離、Bun process 0、mutation oracle"
generates:
  - artifact_path: docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/bun-migration-debt.yaml
    artifact_type: config
  - artifact_path: src/lint/bun-permanent-ban.ts
    artifact_type: source_module
  - artifact_path: src/runtime/node-bootstrap.ts
    artifact_type: source_module
  - artifact_path: src/runtime/runtime-image-observer.ts
    artifact_type: source_module
  - artifact_path: scripts/build-node.mjs
    artifact_type: script
  - artifact_path: package-lock.json
    artifact_type: config
  - artifact_path: tsconfig.node.json
    artifact_type: json_config
  - artifact_path: tests/bun-permanent-ban.test.ts
    artifact_type: test_code
  - artifact_path: tests/node-self-host-bootstrap.test.ts
    artifact_type: test_code
  - artifact_path: tests/runtime-image-observer.test.ts
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
    - package.json
    - src/cli.ts
    - src/state-db/index.ts
    - scripts/run-vitest-snapshot.ts
review_evidence: []
---

# PLAN-L7-458: Node self-hosted Bun permanent-ban foundation

## 1. Atomic slice

Bun ban detectorと、そのdetectorを実行するNode build/bootstrapを同じTDD sliceで実装する。detectorだけを先にBun上でGreenにすると「Bunを禁止する壁がBunへ依存する」循環になるため分割しない。既存Bunはallowlistでpassへ変換せず、`migration_debt` findingとして全件を保持する。

## 2. Gate semantics

- `delta guard`: frozen inventory digestに対する新規・変更・owner/期限喪失findingをRedにする。差分が無くてもoverall complianceをGreenにしない。
- `compliance`: `Compliant | NonCompliant | Indeterminate`の三値。既存production debtが1件でもあれば`NonCompliant`、coverage欠測なら`Indeterminate`で、どちらもaggregate Red。
- `zero`: production pathのfindingが1件でもあればRed。最終cutoverまで意図的にRedを維持する。
- `coverage`: scanner対象、parse結果、unknown executable artifact、runtime observer gapを集約し、欠測時は両modeをRedにする。
- negative fixture: detector ID、fixture root、期待findingをtyped registryへ隔離し、production allowlistとして利用不能にする。

## 3. Object分割

`ManifestScanner`、`ModuleSpecifierScanner`、`RuntimeGlobalScanner`、`ProcessArgvScanner`、`WorkflowHookScanner`、`PackScanner`、`CurrentDocScanner`、`RuntimeImageScanner`は短いpure objectとして`BanFinding`を返す。`BanInventory`がcanonical path、detector ID、evidence digestでsort/dedupeし、`DeltaGuard`と`CompliancePolicy`を別objectとして判定する。filesystem/process収集はportに隔離し、scannerへambient cwd/PATHを渡さない。

`NodeBootstrap`はreview済みlock graphからcompiled ESM entrypointを生成・照合し、Node executable、core digest、package-lock digest、build policyを`NodeBootstrapReceipt`へ封印する。Node失敗時にBun、tsx、bunx、TS直実行へfallbackしない。SQLite driverはport化し、transaction/WAL/type/busy/close semanticsを既存canonical corpusへ合わせる。

## 4. TDD order

1. `CAND-BUNBAN-001..020`と`CAND-NODEBOOT-001..012`を候補oracleとしてfreezeする。実装sliceのtest codeと同じcommitにあるNode bootstrap境界だけを`U-NODEBOOT-001..005`へ正式昇格し、未実装のban scannerと`CAND-NODEBOOT-006..012`は候補のまま維持する。
2. CIのreview済みseed Node `24.13.0` / npm `11.6.2`で最小compiled test hostをbuildし、`NodeBootstrapReceipt`をRed→Green化する。seedはbootstrapのためだけに使い、production entrypointと証拠対象は`tsc`生成のcompiled ESMに限定する。
3. そのcompiled Node test hostでscanner pure objectsとdeterministic inventoryをRed→Green化する。
4. 現存Bun debt manifestを実scan結果から固定し、delta guard結果とoverall `NonCompliant`を同時に保存する。既存debtがある状態をPass/Greenと呼ばない。
5. Node CLI/SQLite/targeted testをGreen化し、同じcompiled Node CLIでban auditをself-hostする。
6. Bun executable/descendant 0とobserver heartbeat/drop countをreceiptへ保存し、mutation、Windows/Linux、blind cross-reviewを通す。

### 4.1 Node bootstrap実装トレース（部分Green）

`tests/node-self-host-bootstrap.test.ts`と同じ実装sliceで、候補oracleのうち実test codeを持つ範囲だけを
`U-NODEBOOT-001..005`へ正式昇格した。正式IDは5件だが、`U-NODEBOOT-003`がsealed byteの3変異を
parameterized caseとして実行するため、テスト実数は7件である。

| 正式ID | 実装／境界 | TDD evidence |
|---|---|---|
| `U-NODEBOOT-001` | `NodeBootstrapReceipt`がNode executable、compiled ESM CLI、`package-lock.json`、build policyを単一receiptで封印する | 正常receiptをloadし、各digestと`compiled-esm-only`を照合 |
| `U-NODEBOOT-002` | ambient processからentrypointを推測せず、receipt欠落をfail-closeする | `node-bootstrap-receipt-missing`を検証 |
| `U-NODEBOOT-003` | compiled CLI／Node executable／lock graphのsealed byte driftを個別に拒否する | 3 mutation caseが各digest mismatchを検証 |
| `U-NODEBOOT-004` | Stop `db-refresh`はsealed Node executableとcompiled CLIだけを起動し、Windows processをhiddenにする | spawn argv、`detached`、`stdio=ignore`、`windowsHide=true`を検証 |
| `U-NODEBOOT-005` | receipt欠落・stale時はprocess生成前に停止し、別runtimeやTS直実行へfallbackしない | missing/staleの両caseでspawn call 0を検証 |

実装トレースは`src/runtime/node-bootstrap.ts`、`scripts/build-node.mjs`、
`src/state-db/stop-refresh.ts`、compiled Nodeを呼ぶhook設定、CLI wrapper、snapshot runnerへ接続する。
これはNode bootstrap境界の部分Greenであり、ban scanner、runtime image observer、SQLite canonical corpus、
clean checkout、Linux/Windows CI、Bun process 0の証拠ではない。

## 5. Slice acceptance

- [ ] Bun未導入clean checkoutでreview済みlock graphからNode buildが完了する。
- [ ] compiled Node CLIで`status --json`、ban audit、targeted testsが動く。
- [ ] delta guardとoverall complianceを別fieldで返し、既存debtがある間はaggregateを`NonCompliant` Redに保つ。
- [ ] process receiptのBun executable/descendant countが0でobserver欠測がない。
- [ ] scanner自身、build、test runner、SQLite pathに新規Bun依存がない。
- [ ] 独立reviewとtested commitが一致する。

本PLANはfoundationであり、hook/wrapper/CI/Packの全切替とBun物理削除を完了扱いにしない。
