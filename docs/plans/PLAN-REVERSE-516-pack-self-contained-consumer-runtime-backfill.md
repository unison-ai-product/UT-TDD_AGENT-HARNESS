---
plan_id: PLAN-REVERSE-516-pack-self-contained-consumer-runtime-backfill
title: "PLAN-REVERSE-516: sealed consumer Node runtime backfill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: agent
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
status: draft
created: 2026-08-27
updated: 2026-08-27
owner: PM / PO / Codex
parent_design: docs/plans/PLAN-L7-516-pack-self-contained-consumer-runtime.md
pair_artifact: docs/test-design/harness/L7-pack-self-contained-consumer-runtime-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - consumer-local sealed runtime差分をL6-101へbackfillする"
  - role: qa
    slot_label: "QA - checkout削除、receipt、path、原子性のR3差分を再検収する"
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
- acquireConsumerLock後の全経路は`finally`で`releaseConsumerLock`をexactly once呼び、release throwは
  typed `indeterminate`としてprimary errorを保持すること。
- Linux/Windowsのcanonical path、symlink/junction/reparse、8.3 alias、権限不足、未解決path、
  reserved nameを同じconsumer identity境界へ戻すこと。
- setup元checkout/source worktree削除後もconsumer-local compiled ESMとreceiptだけで再現できること。

L6-93のNode generation/cutover schema、PF5のaggregate engine、#432 identity bootstrap、#414
remote publication、#418 canaryは本Reverseで再定義しない。

## R2〜R4 判定条件

- **R2**: `CANDIDATE-U-PACKNODE-001..014` / `CANDIDATE-P-PACKNODE-001` が同一PLAN revision・
  exact HEAD・実装成果物へ1:1 traceし、Linux/Windowsの実測証跡とreceipt identityを持つ。
- **R3**: 非著者reviewが`hasUtTddCli`だけの偽ready、generic source誤起動、申告digest信用、fallback、
  partial activation、activation/receipt/history ack-loss、unknown outbox state、lock release throw、
  activation後faultでのprior state復元、alias/permission escape、checkout削除後の起動をclaim-blind/
  spec-blindで攻撃し、全blockingをcitation付きで閉じる。
- **R4**: 不足が実証された場合だけ`PLAN-L6-101` §1〜§5へbackfillし、既存`CANDIDATE-PACKISO`
  契約を重複宣言せず、Forwardへ`gap-only`で再合流する。実装側のsource path、Pack remote、
  Bun retirement、#432を変更しない。
