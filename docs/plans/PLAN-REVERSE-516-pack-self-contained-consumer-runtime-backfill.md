---
plan_id: PLAN-REVERSE-516-pack-self-contained-consumer-runtime-backfill
title: "PLAN-REVERSE-516: sealed consumer Node runtime backfill"
kind: reverse
layer: cross
confirmed_reverse_type: design
drive: agent
route_signal: reverse
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-08-27
updated: 2026-09-08
owner: PM / PO / Codex
parent_design: docs/plans/PLAN-L7-516-pack-self-contained-consumer-runtime.md
pair_artifact: docs/test-design/harness/L7-pack-self-contained-consumer-runtime-test-design.md
agent_slots:
  - role: tl
    slot_label: TL - consumer-local sealed runtime差分をL6-101へbackfillする
  - role: qa
    slot_label: QA - checkout削除、receipt、path、原子性のR3差分を再検収する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-516-pack-self-contained-consumer-runtime-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-516-pack-self-contained-consumer-runtime.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
    - docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    - docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md
    - docs/plans/PLAN-REVERSE-496-pack-independent-consumer-runtime-backfill.md
    - docs/plans/PLAN-L7-516-pack-self-contained-consumer-runtime.md
    - docs/test-design/harness/L7-pack-self-contained-consumer-runtime-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/420
review_evidence: []
workflow_phase: R1
status: draft
github_issue_id: 420
admission_receipt:
  schema_version: v2
  receipt_id: certificate:7e7a1f696196808281be8cb1363c7eb3
  command_id: command:issue420-runtime-adapter-reverse-r3-review-followup
  admitted_at: 2026-09-08T09:59:44.151Z
  source_digest: sha256:15ba3b799ee7309dbcf585217fc9c5d001e5b5f8b45b9824f8a1a44b705c259f
  decision_digest: sha256:d4ac54d00ebd4bdb07fc430ea7ae4485b39c7c1b9a21f58b65280eac3f13bb4f
  receipt_digest: sha256:0d20a7174593d4194bd94cdee9f19126827707008fc585dcfecd779c9a5efce8
  binding:
    path: docs/plans/PLAN-REVERSE-516-pack-self-contained-consumer-runtime-backfill.md
    plan_id: PLAN-REVERSE-516-pack-self-contained-consumer-runtime-backfill
    asset_id: plan:legacy:a791f4a13fda8d4baa8f510ef73e78491c5f3ea280c939fa5bd60e3fe325af8b
    revision: 3
    content_digest: sha256:15ba3b799ee7309dbcf585217fc9c5d001e5b5f8b45b9824f8a1a44b705c259f
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 420
    episode_id: E4-420-runtime-adapter-contract
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L7-516-pack-self-contained-consumer-runtime
    revision: 4
    digest: sha256:6e4e0d5516e78e7465d260c65482e3302c9304518eb264d39735d049c166a316
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-516-pack-self-contained-consumer-runtime
    target_revision: 4
    phase: forward_merge
  escape_reason: Issue420 existing consumer installer physical adapter contract
    proposal; implementation preserved; fresh pair review required
---

# PLAN-REVERSE-516: sealed consumer Node runtime backfill

## R0 予約

本Reverseは、`PLAN-L7-516`の実装後に判明したconsumer-local runtime identity、sealed Node
generation、wrapper解決、原子install/update/rollback、source/Pack checkout非依存の差分だけを
上流へ戻す。docs-only pair-freeze時点では実装・Green・backfill済みとは主張しない。

## R1 対象差分

実装後、次の契約だけを`PLAN-L6-101`へ照合する。

- PF5 sealed aggregateとL6-93 sealed build/Node parity receiptを、generation、revision、artifact、
  provenance、release、consumer identityの閉じたtupleで束縛すること。
- runtime rootのlayoutがconsumer-localであり、source repository、source worktree、local Pack
  checkout、global cache、`node_modules`内TypeScriptをruntime discoveryへ使わないこと。
- genericなconsumer `src/cli.ts` / `src/setup/index.ts`をHARNESSと誤認せず、identity/receiptの無い
  wrapper/hook起動を0にすること。
- Issue #420の変更所有を`src/setup/distribution.ts#buildConsumerReadinessPlan`へ固定し、consumer-local
  sealed generation、active marker、receipt chainの三者が同一identity/digestで一致する場合だけ
  `ready`とすること。`hasUtTddCli`単独のready、setup元Pack checkout/source path/generic sourceへの
  解決は許さず、欠落・identity mismatch・digest drift・外部解決をtyped `blocked`で返すこと。
- install/update/rollbackのport順序、private staging、atomic activation、prior state保持、deny時
  apply/write/process 0を実測すること。
- `atomicPublishActivationBundle`後のactive verify/receipt/history ack faultでは、markerだけをrestore
  せず、durable outbox operation stateをread-only reconcileすること。commit成否不明、partial commit、
  unknown/new stateは`indeterminate`/fail-closeとし、成功へ丸めないこと。
- marker、receipt、historyは同一consumer-local durable outbox operationのatomic publish単位へ束縛し、
  ack-loss/commit成否不明はread-only reconcileで判定すること。部分commit、unknown/new state、
  prior state不変性を確定できない状態を成功扱いせず、新write 0とすること。
- sealed activation bundleを完全fsync/sealした後、consumer-local single active pointerを同一filesystem
  のatomic rename/CAS一回で切り替える物理commit point、pointerからbundleだけを解決するreadiness/wrapper、
  orphan bundleのcleanup/reconcileをLinux/Windows双方で検証すること。
- bundle manifest/receiptへ`prior_bundle_digest`、`prior_history_tip_digest`、monotonic
  `history_sequence`を束縛し、genesisと「prior history完全prefix + exactly one operation record」を固定すること。
  truncate/reorder/fork/replay/sequence gap/duplicateはdenyする。
- bundle/staging/quarantine pathをconsumer namespace・operation_id・monotonic attempt・bundle digestの
  一意identityへ束縛し、既存path no-clobber、attempt mismatch/replay、stale quarantine/orphan下の次attempt
  をdenyすること。
- acquireConsumerLock後の全経路は`finally`で`releaseConsumerLock`をexactly once呼び、release throwは
  typed `indeterminate`としてprimary errorを保持すること。
- Linux/Windowsのcanonical path、symlink/junction/reparse、8.3 alias、権限不足、未解決path、
  reserved nameを同じconsumer identity境界へ戻すこと。
- setup元checkout/source worktree削除後もconsumer-local compiled ESMとreceiptだけで再現できること。

L6-93のNode generation/cutover schema、PF5のaggregate engine、#432 identity bootstrap、#414
remote publication、#418 canaryは本Reverseで再定義しない。

## R2〜R4 判定条件

- **R2**: `CANDIDATE-U-PACKNODE-001..015` / `CANDIDATE-P-PACKNODE-001` が同一PLAN revision・
  exact HEAD・実装成果物へ1:1 traceし、Linux/Windowsの実測証跡とreceipt identityを持つ。
- **R3**: 非著者reviewが`hasUtTddCli`だけの偽ready、generic source誤起動、申告digest信用、fallback、
  partial activation、activation/receipt/history ack-loss、unknown outbox state、lock release throw、
  activation後faultでのprior state復元、alias/permission escape、checkout削除後の起動をclaim-blind/
  spec-blindで攻撃し、全blockingをcitation付きで閉じる。
- **R4**: 不足が実証された場合だけ`PLAN-L6-101` §1〜§5へbackfillし、既存`CANDIDATE-PACKISO`
  契約を重複宣言せず、Forwardへ`gap-only`で再合流する。実装側のsource path、Pack remote、
  Bun retirement、#432を変更しない。

## 実装時点のR0 evidence（2026-09-04, exact-head baseline / partial）

`PLAN-L7-516`の実装成果物は PR #463 exact HEAD
`c472bbc6767b5a2d6f9cc52dee6d4830e22a4a7a` である。専用targetは17/17 Green、required CI
run `33837644210` も Linux/Windows/aggregate 3/3 Green、typecheckとBiomeも成功した。
filesystem laneはconsumer-local stagingをsealed bundleへrenameし、single active pointerを作成し、
別cwdからNode wrapperでcompiled entryを起動する。

R1〜R4の完了、全15 U候補/P候補の1:1 trace、Linux/Windows全境界、receipt-backed L6-93 producer、
rollback/history chain、external read/open/stat/process counter、非著者review、aggregate CIはまだ
証明していない。したがって本Reverseは`status: draft`/R0予約を維持し、未測定差分をbackfill対象として
残す。上記の実測は既存PACKISO/NODEBOOT候補の代替や全候補Greenの主張ではない。

## R0追加実測（2026-08-28, partial）

exact HEAD `c472bbc6767b5a2d6f9cc52dee6d4830e22a4a7a` の17 testsとrequired CI 3/3 Greenを
確認した。manifest canonical
digest、compiled ESM digest binding、consumer runtime root/realpath containment、Bunなしreadiness、
active pointerのexternal escape denyを追加測定した。一方、実bytesを供給するL6-93-owned
当時はNodeBootstrapReceipt producerが現branchにも`src/tests`にも無く、`PLAN-L6-93`がdraftで
READYなproducer owner Issue/PRを確認できなかった。現在はPR #507がmainへ統合され、producerは
利用可能になった。従ってR1〜R4、receipt-backed consumer接続、Linux/Windows全境界、rollback/
history prefix、external read/open/stat counter、closing review、aggregate CIは実装PRで検証する
未完了項目として残すが、producer欠落を理由としたHard blockは解除済みである。#420ではL6-93
producerを新設しない。

## R1: 実setup断線の再確認と契約補完候補（2026-09-08）

PR #463の部品実装と既存証跡は保持する。#418の独立fixtureで実setup後にPack checkoutを削除すると、
consumer wrapperはexit127となり、setupSourceCli絶対pathも残っていた。これは既存のPack非依存要求の未達である。
ConsumerNodeRuntimePortsの実filesystem adapterと4 payloadの生成経路は未実装で、setup callerへ未接続。
snapshotPriorActivePointerのvoidだけではCAS不能を意味せず、adapter private state保持で実装できる。

Forward revision 3で新設し、revision 4で補完した§11とpair test-designへ、既存ConsumerReceiptの再利用、循環のないpayload/digest、
lock内prior照合、read-only durable reconcileの契約補完候補を追加した。revision 3の4 payload構造はexact e72dcc8ad2b728b53389971b092d2ebffec45bc5で非著者PASS-WEAK/blocking 0。revision 4の補完はfresh review対象。
Node producer/receipt schema、PF5、Pack remote publicationは再所有せず、入力未供給をtyped denyで扱う。
このrevisionはR1の差分特定までであり、R2実装検証、R3非著者検収、R4 backfill、Issue420完了は未主張。
