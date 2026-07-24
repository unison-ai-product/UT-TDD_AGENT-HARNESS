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
github_issue_id: 152
parent_design: docs/plans/PLAN-L6-93-node-bootstrap-contract.md
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
  - artifact_path: docs/governance/node-toolchain-provenance.json
    artifact_type: json_config
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
  parent: docs/plans/PLAN-L6-93-node-bootstrap-contract.md
  requires:
    - docs/plans/PLAN-L6-93-node-bootstrap-contract.md
  blocks: []
  references:
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/plans/PLAN-L4-33-node-control-plane-redesign.md
    - docs/plans/PLAN-L5-26-node-generation-activation.md
    - docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    - docs/plans/PLAN-REVERSE-458-node-self-hosted-bun-ban-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - package.json
    - src/cli.ts
    - src/state-db/index.ts
    - scripts/run-vitest-snapshot.ts
review_evidence: []
---

# PLAN-L7-458: Node self-hosted Bun permanent-ban foundation

本PLANはIssue #152のD0-N設計を正本とし、Issue #153の一時bootstrap envelopeを恒久的なwaiverへ転用しない。Resource Kernel / Rust companionの設計・実装は別sliceであり、本PLANの開始条件でもF0のblockerでもない。

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

`NodeBootstrap`はreview済みlock graphからcompiled ESM entrypointを生成・照合し、実際に起動したNode/npm executable identity、external dependency closure、core digest、package-lock digest、build policy、subject revisionを`NodeBootstrapReceipt`へ封印する。CLIとreceiptは同一immutable generationへ置き、append-only activation markerで公開する。readerはvalidated markerの最高complete sequenceだけを採用し、途中失敗や並行readerへpartial generationを見せない。Node失敗時にBun、tsx、bunx、TS直実行へfallbackしない。

## 4. TDD order

1. `CAND-BUNBAN-001..020`、unit `CAND-NODEBOOT-001..012`、integration `CAND-NODEBOOT-101..106`、system `CAND-NODEBOOT-201..208`を候補oracleとしてfreezeする。各候補は対応するtest codeと実装をF0/Q0の同一commitへ追加し、Red実測を記録した場合だけ対応する`U-*` / `IT-*` / `ST-*`へ正式昇格する。D0文書だけでは一件も正式test IDを名乗らない。
2. CIのreview済みseed Node `24.13.0` / npm `11.6.2`で最小compiled test hostをbuildし、`NodeBootstrapReceipt`をRed→Green化する。seedはbootstrapのためだけに使い、production entrypointと証拠対象は`tsc`生成のcompiled ESMに限定する。
3. そのcompiled Node test hostでscanner pure objectsとdeterministic inventoryをRed→Green化する。
4. 現存Bun debt manifestを実scan結果から固定し、delta guard結果とoverall `NonCompliant`を同時に保存する。既存debtがある状態をPass/Greenと呼ばない。
5. Node CLI/SQLite/targeted testをGreen化し、同じcompiled Node CLIでban auditをself-hostする。
6. Bun executable/descendant 0とobserver heartbeat/drop countをreceiptへ保存し、mutation、Windows/Linux、blind cross-reviewを通す。

### 4.1 Node bootstrap候補トレース（設計Red）

現mainには`tests/node-self-host-bootstrap.test.ts`、`src/runtime/node-bootstrap.ts`、
`scripts/build-node.mjs`、`package-lock.json`、`tsconfig.node.json`が未着地である。
したがって以下は`CAND-NODEBOOT-001..005`の設計Redであり、Green又は正式`U-*`と主張しない。
対応test codeと実装を同じF0 sliceへ追加し、Red実測後にだけ正式昇格する。

| 候補ID | 実装／境界 | Red oracle |
|---|---|---|
| `CAND-NODEBOOT-001` | `NodeBootstrapReceipt`が実Node/npm identity、compiled ESM CLI、external dependency closure、`package-lock.json`、build policy、subject revisionを単一receiptで封印する | 正常receiptをloadし、各digest、`compiled-esm-only`、candidate revisionを照合 |
| `CAND-NODEBOOT-002` | ambient processからentrypointを推測せず、receipt欠落をfail-closeする | `node-bootstrap-receipt-missing`を検証 |
| `CAND-NODEBOOT-003` | compiled CLI／Node executable／lock graphのsealed byte driftを個別に拒否する | 3 mutation caseが各digest mismatchを検証 |
| `CAND-NODEBOOT-004` | Stop `db-refresh`はsealed Node executableとcompiled CLIだけを起動し、Windows processをhiddenにする | spawn argv、`detached`、`stdio=ignore`、`windowsHide=true`を検証 |
| `CAND-NODEBOOT-005` | receipt欠落・stale時はprocess生成前に停止し、別runtimeやTS直実行へfallbackしない | missing/staleの両caseでspawn call 0を検証 |
| `CAND-NODEBOOT-006` | generation publish途中のcrash・競合でもCLI/receiptの異世代を観測させない | 各fault barrierと並行readerで旧完全generationまたは新完全generationだけを観測 |
| `CAND-NODEBOOT-007` | env自己申告でnpm identityを偽装できない | 実npm executable/version/digestとenv不一致をprocess生成前に拒否 |
| `CAND-NODEBOOT-008` | 別commitのreceiptをreplayできない | `subject_revision` mutationとcandidate HEAD不一致を拒否 |
| `CAND-NODEBOOT-009` | version文字列が同じ別npm CLI、または改竄npm CLIへ差替える | reviewed distribution provenanceのexpected CLI digest不一致で拒否 |
| `CAND-NODEBOOT-010` | POSIX marker write/sync/close/unique rename前後でcrashする | 最高complete markerが旧または新generationだけを返しtemp/reservationをreconcile |
| `CAND-NODEBOOT-011` | Windows marker write/sync/close/unique rename前後でcrash・writer競合を注入する | 既存marker不変または新marker append、partial activation 0、Bun/shell/native helper fallback 0 |
| `CAND-NODEBOOT-012` | publish成功後cleanup失敗、append rollback、実行中generationへのGCを競合させる | 履歴を巻き戻さずcleanup debtを記録し、検証済み旧generationへの新markerだけを許可、live generationを保持 |

予定実装トレースは`src/runtime/node-bootstrap.ts`、`scripts/build-node.mjs`、
`src/state-db/stop-refresh.ts`、compiled Nodeを呼ぶhook設定、CLI wrapper、snapshot runnerへ接続する。
これらが未着地の現在はNode bootstrap境界もRedであり、既存Bun test Greenを代替証拠にしない。

## 5. Slice acceptance

- [ ] Bun未導入clean checkoutでreview済みlock graphからNode buildが完了する。
- [ ] compiled Node CLIで`status --json`、ban audit、targeted testsが動く。
- [ ] delta guardとoverall complianceを別fieldで返し、既存debtがある間はaggregateを`NonCompliant` Redに保つ。
- [ ] process receiptのBun executable/descendant countが0でobserver欠測がない。
- [ ] scanner自身、build、test runner、SQLite pathに新規Bun依存がない。
- [ ] 独立reviewとtested commitが一致する。

本PLANはfoundationであり、hook/wrapper/CI/Packの全切替とBun物理削除を完了扱いにしない。

## 6. Issue #153 bootstrap envelopeのslice別gate

同じgate案をIssue #153の[review FLAG follow-up](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/153#issuecomment-5065921409)へ記録した。GitHubコメント単独を正本にせず、本節と差異が出た場合は設計修正を先に行う。

- **D0-N**: candidate IDだけを持ち、plan/frontmatter/readability/traceがGreen。current Bunとtarget Nodeを区別し、実装Greenを主張しない。
- **F0-A**: toolchain provenance、same-version npm substitute、dependency closure、subject revision、両OS pointer faultを実testと同一commitでRed→Green化し、claim-blind/spec-blindがPASS。
- **F0-B**: Node Linux/Windowsと既存harness Linux/Windowsを同一HEAD/run attemptでaggregateし、failure/cancel/skipを非successにする。
- **Q0**: compiled Node CLIでfixture authoringとreceipt verifyを行い、Bun/bunx/tsx/TS/shell process 0を独立観測する。
- 全sliceでcandidate-owned CI Redは0とする。Issue #153が許容できるのは継承main負債`PLAN-RECOVERY-16` / `PLAN-L7-452`だけであり、上記gate、detector、receipt、reviewをwaiveしない。
