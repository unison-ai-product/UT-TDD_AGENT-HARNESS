---
plan_id: PLAN-L5-26-node-generation-activation
title: "PLAN-L5-26: append-only Node generation activation redesign"
kind: design
layer: L5
drive: fullstack
status: draft
route_signal: design_correction
route_mode: redesign
created: 2026-07-24
updated: 2026-07-24
owner: PO / TL
github_issue_id: 152
parent_design: docs/plans/PLAN-L4-33-node-control-plane-redesign.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
supersedes:
  - PLAN-L5-03-internal-processing
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
  requires:
    - docs/plans/PLAN-L4-33-node-control-plane-redesign.md
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
`PLAN-L5-03`の一般内部処理を維持し、Node generation activation節だけを後継所有する。

## 2. Activation protocol

1. immutable generationをprivate tempへ構築し、全fileをsync/closeしてcomplete receiptを封印する。
2. writerは`open("wx")`の一意reservationで単調sequenceを予約する。
3. activation markerをtempへwrite、file sync、closeし、存在しない一意final名へ同一filesystem renameする。
4. readerは全final markerを検証し、sequence・generation・receiptが完全な最大markerだけを採用する。
5. temp、torn、invalid、reservation-only markerは無視し、crash時は直前complete markerを維持する。
6. rollbackは旧generationを指す新しいmarkerをappendする。履歴の上書き・削除ではない。

既存file置換、shell、native helper、Rust companionへ依存しない。GCはpublisherが所有し、実行中、
最新complete、rollback retention windowのgenerationを削除しない。

## 3. Pair

L8の`CAND-NODEBOOT-101..106`とpair-freezeし、競合writer、全crash barrier、rollback、GC競合を
F0 test同commitでRed実測するまで正式`IT-*`へ昇格しない。
