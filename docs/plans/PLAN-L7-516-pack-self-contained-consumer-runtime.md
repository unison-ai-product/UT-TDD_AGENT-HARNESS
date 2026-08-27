---
plan_id: PLAN-L7-516-pack-self-contained-consumer-runtime
title: "PLAN-L7-516 (add-impl): sealed self-contained consumer Node runtime"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: confirmed
created: 2026-08-27
updated: 2026-08-27
owner: PM / PO / Codex
parent_design: docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
pair_artifact: docs/test-design/harness/L7-pack-self-contained-consumer-runtime-test-design.md
next_pair_freeze: L7
transition_direction: design_to_implementation
implementation_disposition: none
implementation_target: src/setup/consumer-node-runtime.ts
agent_slots:
  - role: se
    slot_label: "SE - sealed generationのconsumer-local materializeとidentity束縛を実装する"
  - role: qa
    slot_label: "QA - checkout削除、hostile path、原子更新、Linux/Windows負系を実測する"
  - role: tl
    slot_label: "TL - L6-93/L6-101/L7-496の責務境界とreceipt/port順序を非著者検収する"
generates:
  - artifact_path: docs/plans/PLAN-L7-516-pack-self-contained-consumer-runtime.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/consumer-node-runtime.ts
    artifact_type: source_module
  - artifact_path: scripts/build-consumer-runtime.mjs
    artifact_type: source_module
  - artifact_path: tests/consumer-node-runtime.test.ts
    artifact_type: test_code
  - artifact_path: src/setup/distribution.ts
    artifact_type: source_module
  - artifact_path: src/setup/templates.ts
    artifact_type: source_module
  - artifact_path: src/setup/index.ts
    artifact_type: source_module
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
  - artifact_path: tests/distribution-acceptance.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
  requires:
    - PLAN-L6-101-pack-independent-multi-consumer-acceptance
    - PLAN-L7-496-pack-independent-consumer-runtime
  blocks: []
  references:
    - docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    - docs/plans/PLAN-L6-102-release-promotion-rollback-gate.md
    - docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
    - docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md
    - docs/plans/PLAN-REVERSE-496-pack-independent-consumer-runtime-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/415
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/420
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/432
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/415
github_issue_id: 420
backprop_decision: required
backprop_decision_reason: "consumer-local sealed runtimeのidentity・原子更新・checkout非依存をL6受入へ戻すため。"
review_evidence: []
---

# PLAN-L7-516: sealed self-contained consumer Node runtime

## 1. 位置づけと目的

Issue #420 は、PR #415 で明らかになった「setup元Pack checkoutの`src/cli.ts`へ実行時に戻る」
断線を、consumer内だけで完結するNode runtimeへ置き換える実装前のpair-freezeである。
`PLAN-L6-101`のconsumer隔離、`PLAN-L7-496`のconsumer-local namespace・digest admission・PF5
port再利用を前提とし、sealed Node generationをconsumerのruntime rootへ原子的に配置する。

実装開始時点でPR #430（PLAN-L6-93 §5のNode/bootstrap契約）はmainへmerge済みであり、同契約を
入力として継承する。L6-93のfrontmatter状態やschemaはこのPLANで変更せず、#432 identity bootstrap
や#414 publicationを依存解消の根拠にしない。

本PLANは、配置・identity・receipt・hook解決・原子更新・rollback・負系oracleを凍結する。
実装、#432のtracked project identity bootstrap、#414のremote publication、source側の残余Bun
cleanupはこのsliceに含めない。Bunを起動する経路、Bun API、Bun fallback、`run-bun.ts`、
`node_modules`内TypeScriptの実行を新たに導入してはならない。

`PLAN-L6-93`の現行§5にあるsealed build receipt／Node parity receiptのtupleを入力契約として
再利用する。L6-93がconfirmedになり、実装開始に必要なNode generation receiptが利用可能になる
までは本PLANの実装PRを起動しない。L6-93のreceipt schemaやcutover chainを本PLANで再定義しない。

## 2. 正本とsealed runtime identity

### 2.1 入力の正本

入力は、PF5が成功として返したsealed release aggregateと、L6-93が封印した同一 generationの
NodeBootstrapReceiptだけである。manifest、control manifest、consumer receiptの申告digestを
計算入力として信用せず、artifact path・mode・size・content bytesからconsumer側で再計算する。
次のtupleを全て同一値として照合し、一つでも欠ける・変異する・別generationと混ざる場合は
`consumer_runtime_identity_mismatch`でfail-closeする。

| identity | 必須束縛 |
| --- | --- |
| Node generation | `generation_id`、`subject_revision`、`artifact_digest`、sealed build policy |
| provenance | Node/npm executable identity、package-lock digest、source/dependency graph digest、compiled ESM digest |
| release | release identity、materializer version、artifact-set digest、control-manifest digest |
| consumer | product namespace、canonical `consumerRoot`、canonical `runtimeRoot`、install operation、attempt |

L6-93 §5.4の`retirement_subject`は、consumer runtimeの撤去を判定する値へ流用しない。
consumer install/update/rollbackのreceiptにはconsumer operationのsubjectを別フィールドで持たせ、
Node generationの4要素tupleと混同しない。receiptのdigestは、canonical JSON bytesから再計算し、
宣言値をlookup keyとして使わない。

### 2.2 consumer-local layout

`consumerRoot`と`runtimeRoot`は`PLAN-L7-496`のcanonical containment規則に従い、canonical化した
空間で一度だけ検証する。runtimeの正規layoutは次で固定する。callerが任意のsource root、
Pack checkout、worktree、global cacheを差し込む入力は持たせない。

```text
<consumerRoot>/.ut-tdd/
  bin/ut-tdd.mjs                         # Nodeで起動する薄い解決wrapper
  runtime/
    bundles/<operation_id>/attempt-<attempt>-<bundle_digest>/
      ut-tdd.mjs                         # sealed compiled ESM本体
      node-bootstrap-receipt.json        # L6-93 receiptの検証済み写像
      marker.json                         # bundle内のconsumer active marker projection
      consumer-receipt.json               # bundle内のreceipt projection
      history.jsonl                       # bundle内のhistory projection
      operation-state.json                # durable operation state
      bundle-manifest.json                # 全bytes/digest/identityのmanifest
    activation/active.json               # bundleを指すconsumer-local single active pointer
    staging/<operation_id>/attempt-<attempt>/ # private staging（attempt identity付き）
    quarantine/<operation_id>/attempt-<attempt>-<bundle_digest>/ # fault/orphan隔離（no-clobber）
```

bundle、staging、quarantineのpathはcanonical consumer namespace、operation_id、monotonic attempt、
およびsealed bundle digest（確定前のstagingはattempt）から決定し、同一operation_idの次attemptと
既存orphan/stale quarantineが衝突しないidentityとする。既存pathはno-clobberで、同じattemptや
digestを再利用せずtyped denyする。sealed orphan bundle/quarantineはactive pointerから解決せず、
cleanup/reconcile ownerだけが読み取り、再利用・上書き・暗黙retryを行わない。

### 2.2.1 bundle history chain

各sealed bundleの`bundle-manifest.json`とconsumer receiptは、`prior_bundle_digest`、
`prior_history_tip_digest`、単調増加する`history_sequence`を同一consumer namespaceで束縛する。
genesis bundleは`history_sequence=0`、prior digestは明示的なgenesis sentinel、history tipはその
canonical genesis recordのdigestとする。genesis以降のinstall/update/rollback/retryは、直前bundleの
bytesを変更せず、new historyがprior history bytesの完全prefixにちょうど一つのoperation recordを
追加したものになる場合だけ受理する。truncate、reorder、fork、replay、sequence gap、duplicate、
prior digest/tip driftはtyped denyとし、active pointerの切替やlaunchを行わない。

`bin/ut-tdd.mjs`はsingle active pointerを読み、そのpointerが指すsealed immutable activation
bundleのmanifest、marker/receipt/history projection、generation ID、consumer namespace、Node
authorityを検証してから、`process.execPath`でcompiled ESMを起動する。active pointer以外の
generation/bundle、staging、履歴を解決候補にせず、orphan sealed bundleは非activeとしてcleanup/
reconcile対象にする。
current working directory、`PATH`、環境変数の絶対path、setup元checkout、source repository、
source worktree、global `node_modules`を解決候補にしない。active marker・generation・receiptの
いずれかが欠落・不一致なら、processを起動せずtyped `consumer_runtime_absent`または
`consumer_runtime_identity_mismatch`を返す。

### 2.3 readiness判定の変更所有 (#420)

Issue #420で変更するruntime本体の主targetは`src/setup/consumer-node-runtime.ts`である。readiness
判定の追加owned implementation surfaceは既存の`src/setup/distribution.ts#buildConsumerReadinessPlan`
であり、両者を同一PLAN revisionへ束縛する。wrapper、Claude/Codex hook、
setup callerはこの関数が返すplanを消費するだけで、`hasUtTddCli`、package binの存在、source
checkoutの存在、任意pathの解決結果から独自にreadyを導出しない。PF5/L6-93はsealed aggregate
とNode receiptを検証する正本であり、consumer readinessの判定を代行しない。

consumerのruntime readinessは、次の三つがconsumer-local空間で読み取れ、同一のsealed
generation identityとcanonical digestでreceipt chainまで一致した場合だけ`ready`（既存DTOでは
`ok=true`）とする。

1. immutableなconsumer-local sealed generationとcompiled ESM
2. consumer identityに束縛された`runtime/activation/active.json` single active pointer
3. pointerが指すbundle内でgeneration、active marker、Node/bootstrap、consumer operationを連鎖検証
   できるreceipt/history projectionとoperation state

欠落は`consumer_runtime_absent`、identity tupleの不一致は
`consumer_runtime_identity_mismatch`、generation/marker/receiptの再計算digest driftは
`consumer_runtime_digest_mismatch`としてtyped `blocked`を返す。setup元Pack checkout、source
repository/worktree、global cache、genericな`src/cli.ts` / `src/setup/index.ts` / 任意の
`node_modules` TypeScriptへ解決しようとした場合も`consumer_runtime_external_path`または
`consumer_runtime_resolution_denied`としてblockedにし、read/open/stat、write、process launchを
行わない。`hasUtTddCli`は観測用の非権威フィールドであり、`true`だけではreadyにならず、sealed
runtimeが整合するかどうかを迂回しない。逆にこのlegacyフラグの単独値からblocked/readyを
決めない。

## 3. hook解決とhostile consumer境界

setupが生成するClaude/Codex hookの正規起動先は、consumer内の`node .ut-tdd/bin/ut-tdd.mjs`
だけである。hook serializerはsetup元の絶対path、`UT_TDD_SOURCE_CLI`、`SETUP_SOURCE_CLI`、
`src/cli.ts`、`src/setup/index.ts`、`node_modules/ut-tdd/src/cli.ts`を埋め込まない。
本PLANは既存hookの全runtime配線を再実装せず、runtime wrapperが解決先を一つに閉じる契約を
所有する。

consumerに次のような正当そうな製品ファイルが存在しても、HARNESS identityが無ければ実行しない。

```text
<consumerRoot>/src/cli.ts
<consumerRoot>/src/setup/index.ts
<consumerRoot>/node_modules/ut-tdd/src/cli.ts
```

これらへsentinelを置いたhostile fixtureを作り、wrapper/hookがsentinelを一度も実行しないこと、
compiled ESM generationが封印済みの場合だけconsumer-local本体が起動することをoracleにする。
TypeScriptのNode `node_modules` type-stripping経路、TS直実行、Bun/bunx/tsx、shell、setup元
checkoutへのfallbackは、存在確認だけでなく起動試行0として検証する。

## 4. install / update / rollbackの原子契約

runtime adapterは既存PF5のadmission/staging/apply/restore portを再利用し、新しいpublication
engineやglobal lockを作らない。正常系のport順序は次の一通りに固定する。

```text
readConsumerIdentity
→ verifySealedAggregate
→ verifyNodeGeneration
→ acquireConsumerLock
→ snapshotPriorActivePointer
→ createPrivateStaging
→ writeGenerationAndReceipt
→ fsyncStaging
→ sealActivationBundle
→ atomicRenameActivePointerCAS
→ verifyActiveBundle
→ reconcileDurableOperation
→ releaseConsumerLock
```

各read/verifyが失敗した場合、lock、staging、generation write、bundle publish、
process launchは0とする。lock取得後、activation前のfaultではprivate stagingへのwriteは許可するが、
fault時にdestroyまたはconsumer-local quarantineし、
primary errorを保持してprior stateを変更しない。`snapshotPriorActivePointer`はactivation前に
pointerの存在しない状態を含むbyte-for-byte snapshot、canonical pointer digest、prior
`generation_id`/`attempt`を固定する。single active pointerの更新は正常系で一回だけで、既存active
pointerを上書き編集せず、sealed bundleを同一filesystemへ完全fsync/sealしてから新pointerを指す
atomic rename/CASとして一回だけ切り替える。これを物理commit pointとする。

activation後の`verifyActiveBundle`またはpointer rename ackのfaultは、marker・receipt・historyを
含むsealed immutable bundleとdurable operation stateを同一publish単位として扱う。pointerだけを
restoreしてreceipt/historyを残す補償、別directoryの3-fileを個別atomicにする主張は禁止する。
ack-loss/commit成否不明はoperation stateをread-only reconcileして、single committed bundleと
single active pointerの組、または全体未commitだけを確定する。reconcileで新writeを行わず、
unknown/new state、bundleの部分commit、CAS不一致、reverify失敗は`indeterminate`（fail-close）
として一次faultを保持し、process launchを0にする。

updateはprior bundleを削除せず、新bundleを完全fsync/sealしてreceipt/history projectionが検証済み
になってからsingle active pointerを
一度だけ切り替える。rollbackは同一consumer namespaceに既に記録されたprior attested generation
だけを選び、generation bytesを変更せず新しいsealed bundleとactive pointerを原子的に記録する。
未記録generation、別consumer、digest変異、異なるNode generation tupleは拒否する。L6-93の
cutover chainを巻き戻す操作、cross-revision cutover、force pointer mutationは行わない。

上記のpublish/reconcileはactivationを成功とみなすためのretryではない。正常系はbundle sealと
active pointer切替一回、fault時のreconcileはread-only一回とする。pre-commit deny/faultはpublic
active-pointer publish write、apply、launchを0にし、private staging writeだけを許可してfault時に
destroy/quarantineし、active pointer、launch、history-visible stateを不変とする。commit済みack-lossはsingle committed bundleと
pointerをread-only reconcileで確定して新write 0とする。commitまたはprior state不変性を確定
できないunknown/partial stateは`indeterminate`/fail-close、成功扱い・launch 0とする。

lock取得後の全分岐（正常終了、activation前fault、bundle publish後fault、primary error、
indeterminateを含む）は`finally`で`releaseConsumerLock`をexactly once呼ぶ。releaseがthrowした
場合はtyped `indeterminate`を返し、先行したprimary errorを置換せず保持する。

## 5. path・権限・OS境界

次の境界はLinux/Windows双方で同じidentity規則を用い、OS固有差はpath adapter内へ隔離する。

- `runtimeRoot`が`consumerRoot`のcanonical childでない、root自身、nested escape、home、Temp、
  OneDrive、未解決path、reserved name、canonicalize不能はfail-closeする。
- symlink/junction/reparse pointがcanonical root外へ解決する場合は拒否する。同一実体を指す入口は
  canonical pathへ正規化して一度だけ判定し、字面のprefix判定をidentityにしない。
- Windows 8.3 aliasはcanonical化後に同一consumer rootへ一致する場合だけ同一入力として扱う。
  別rootを指すalias、alias経由のescape、canonical化不能は拒否する。Linuxのcase-sensitive、
  Windowsのcase-insensitive比較は既存L7-496のadapter規則を再利用する。
- runtime root、staging、activation marker、receiptへのread/write/rename/fsync権限不足は、
  部分公開せずtyped permission/indeterminate failureにする。
- pathにspacesがあっても拒否理由にせず、shell文字列ではなくargv/path object境界で扱う。

## 6. 破壊的checkout削除E2E

実装PRでは一時fixture内でsetup元Pack checkoutとsource worktreeを用意し、sealed generationと
consumer-local runtimeをinstallした後、setup元checkout、source repository参照、local Pack
checkoutを物理的に削除する。その後、consumer rootを別cwdから再起動し、Claude/Codex hookと
`node .ut-tdd/bin/ut-tdd.mjs`を実行する。

成功条件は、compiled ESMとconsumer receiptだけで起動でき、削除したpathへのread/open/statが0、
consumer root外へのwriteが0、A/B別consumerのprocess・bytes・mode・path・DB・Memory・PLAN・
receipt・historyが不変であることである。generation/receiptを一つでも欠損・改変したfixtureは
起動0で、silent fallbackではなくtyped reasonを返す。実fixtureは一時ディレクトリだけを対象とし、
開発用repositoryや実ユーザーデータを削除しない。

## 7. TDD / trace / Reverse

pair artifactの`CANDIDATE-U-PACKNODE-001..015`と`CANDIDATE-P-PACKNODE-001`を、実装PRで同番号の
`U-PACKNODE-*` / `P-PACKNODE-*`へ昇格する。各候補は一つの契約軸、実測command、exact PLAN
revision、exact HEAD、Linux/Windows結果へ1:1 traceし、既存`CANDIDATE-PACKISO-001..007`と
`CAND-NODEBOOT-021..030`を再宣言しない。

R1では`PLAN-L6-101`のsource非依存・A/B隔離と`PLAN-L7-496`のadmission再利用を照合する。
R2ではsealed generation identity、wrapper境界、原子port順序、破壊的checkout削除E2Eを同じ
implementation revisionへ束縛する。R3では非著者のclaim-blind/spec-blind reviewで、generic
consumer sourceの誤起動、receipt申告digestの信用、権限/alias/permission failure、partial
activation、fallbackを攻撃する。R4では不足差分だけを`PLAN-L6-101`へbackfillし、L6-93のschema、
PF5、#432、#414、Pack remote publicationを重複所有しない。

## 8. 非Scopeと開始条件

### 非Scope

- #432 tracked project identityの作成・commit方針・provider parity
- #414 remote Pack publication、tag/release、channel pointer、human publication authority
- source側のBun残余（`build` script、`bun.lock`、source workflow、`bun:sqlite`）の撤去
- #418 Pack-only canary、stable promotion、Cloudflare、Execution Episode、worktree physical cleanup
- `PLAN-L6-93`のNode generation/cutover schemaや、PF5のaggregate/admission engineの再実装

### 実装開始条件

1. `PLAN-L6-101`と`PLAN-L7-496`がconfirmed/completedであること。
2. `PLAN-L6-93 §5`のsealed build receiptとNode parity receiptが、同一4要素tupleへ束縛された
   canonical evidenceとして利用可能であること。
3. #432のidentity bootstrapを前提にせず、consumer identity入力が既存契約で供給できること。
4. pair-freezeの非著者PASS、CI Green、Reverse R0が揃うまでproduction sourceを変更しないこと。

## 9. 完了条件

1. compiled ESM、Node/npm provenance、generation/artifact/release/consumer identityが一つの
   検証可能なreceipt chainへ束縛される。
2. wrapper/hookがconsumer-local active generationだけを解決し、source/Pack/worktree/
   `node_modules` TypeScript/Bun/shell fallbackを持たない。
3. install/update/rollbackの物理commit pointが、完全fsync/seal済みの単一immutable activation
   bundleとconsumer-local single active pointerを同一filesystemのatomic rename/CAS一回で束縛する。
   pre-commit deny/faultはpublic active-pointer publish write・apply・launchが0で、private staging
   writeは許可してfault時にdestroy/quarantineし、active pointer・launch・history-visible stateを不変とする。commit済みack-lossはsingle
   committed bundle/pointerをread-only reconcileして新write 0、unknown/partialまたはprior state
   不変性を確定できない状態は`indeterminate`/fail-close、成功扱い・launch 0とする。全lock経路の
   releaseはexactly onceで、release faultはprimary error保持のtyped `indeterminate`とする。
4. generic `src/cli.ts` hostile fixture、Pack checkout削除、A/B隔離、異version、Linux/Windowsの
   symlink/junction/8.3/permission/path boundaryが実測される。
5. TypeScript、Biome、専用unit/system test、PLAN lint、scoped doctor、Linux/Windows/aggregate CI、
   非著者closing review、Reverse R1〜R4、正規receipt gateが同一PLAN revision/exact HEADへ束縛される。

docs-only pair-freeze時点では、上記の実装・Green・独立配布を主張しない。
