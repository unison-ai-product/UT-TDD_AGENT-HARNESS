---
plan_id: PLAN-L5-26-node-generation-activation
title: "PLAN-L5-26: append-only Node generation activation redesign"
kind: add-design
layer: L5
sub_doc: internal-processing
drive: fullstack
status: draft
route_signal: design_correction
route_mode: redesign
created: 2026-07-24
updated: 2026-07-24
owner: PO / TL
github_issue_id: 152
agent_slots:
  - role: se
    slot_label: "SE - append-only activation物理protocol"
  - role: qa
    slot_label: "QA - crash/競合/lock永久停止oracle"
parent_design: docs/plans/PLAN-L4-33-node-control-plane-redesign.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
transition_direction: design_to_implementation
implementation_disposition: none
implementation_target: docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
generates:
  - artifact_path: docs/plans/PLAN-L5-26-node-generation-activation.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/internal-processing.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L4-33-node-control-plane-redesign.md
  requires: []
  references:
    - docs/plans/PLAN-L5-03-internal-processing.md
    - docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    - docs/test-design/harness/L8-integration-test-design.md
  blocks:
    - docs/plans/PLAN-L6-93-node-bootstrap-contract.md
review_evidence: []
---

# PLAN-L5-26: append-only Node generation activation redesign

## 1. 差替え境界

Issue #152のL4-33を、Node標準filesystem APIだけでWindows/POSIXへ実装可能な物理protocolへ降ろす。
`PLAN-L5-03`を一般内部処理のpredecessor/referenceとして維持し、Node generation activationの差分だけを
本PLANが所有する。

## 2. Activation protocol

1. immutable generationをprivate tempへ構築し、全fileをsync/closeしてcomplete receiptを封印する。
2. writerはexact `dist/node-publish.lock/`をatomic `mkdir`だけで取得する。`open("wx")`等の代替backendは禁止する。
3. lease取得後にmax sequence `N`を読み、`N+1`を割り当てる。同時writerはretryせずfail-closeする。
4. activation markerをtempへwrite、file sync、closeし、存在しない一意final名へ同一filesystem renameする。
5. readerは全final markerを検証し、sequence・generation・receiptが完全な最大markerだけを採用する。
6. temp、torn、invalid markerは無視する。crash残留lockはowner.json欠落時も保持し、F0にrecovery/steal/clear APIを作らずpublishを永久blockする。readerはcomplete markerを引き続き利用できる。
7. F0 rollbackは同一revisionの旧generationを指す新markerだけ。cross-revisionはunsupportedで、git revert後の新revision buildを使う。

既存file置換、shell、native helperへ依存しない。F0ではautomatic GCとgeneration deletion APIを禁止し、
全immutable generationを保持する。reader lease/reclamationは後続PLANへdeferする。

process crashとpower lossを別oracleにする。POSIXは可能な場合parent directoryをsyncする。Windows Node-only
F0bは最新markerのpower-loss persistenceも旧marker存在も保証しない。検証可能complete markerが1件以上なら
最大sequenceを選び、0件ならfail-closeする。
power-loss durable activationはResource Kernel bundle側trust floorへ委譲する。

## 3. Cutover transition processing

1. 最新`CutoverTransitionReceipt`をdigest chain込みで検証し、projection値を入力正本にしない。
2. edge別の必要evidenceは直後の厳密registryだけをSSoTとし、各transitionは対応rowを完全一致で満たす。
3. 次receiptはprevious/current、subject revision、evidence/review/admission/evidence set digest、
   previous receipt digestをcanonical encodingしてchain digestを生成しappendする。
4. invalid state、非隣接遷移、reverse、skip、別revision replay、digest欠落/不一致は書込み前にfail-closeする。
5. state projectionはvalidated receipt chainをfoldして再構築し、receiptなしの直接更新を拒否する。

edge evidenceの唯一のcanonical registryは
`docs/design/harness/L5-detailed-design/internal-processing.md`の`CUTOVER-EVIDENCE-REGISTRY-v1`である。
本PLANは表を複製せず、同registryのlexical kind/producer ID、count、revision/ancestry、digest、success条件を
規範参照する。wrong-edge、stale/replay、non-ancestor、skipはfail-closeする。

## 4. Pair

L8の`CAND-NODEBOOT-101..106`とpair-freezeし、競合writer、全crash barrier、rollback、GC禁止を
検証する。各候補はL7-458のcandidate ownership表に定めるowner sliceでtestとimplementationを同一commitへ
追加し、Red実測するまで正式`IT-*`へ昇格しない。
