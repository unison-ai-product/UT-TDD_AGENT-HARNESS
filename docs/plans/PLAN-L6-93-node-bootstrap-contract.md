---
plan_id: PLAN-L6-93-node-bootstrap-contract
title: "PLAN-L6-93: sealed Node bootstrap function redesign"
kind: add-design
layer: L6
sub_doc: function-spec
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
    slot_label: "SE - sealed bootstrap関数契約"
  - role: qa
    slot_label: "QA - CAND-NODEBOOT Red/Green昇格境界"
parent_design: docs/plans/PLAN-L5-26-node-generation-activation.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
transition_direction: design_to_implementation
implementation_disposition: none
implementation_target: docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
generates:
  - artifact_path: docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L5-26-node-generation-activation.md
  requires: []
  references:
    - docs/plans/PLAN-L6-01-function-spec.md
    - docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
    - docs/test-design/harness/L7-unit-test-design.md
  blocks:
    - docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
review_evidence: []
---

# PLAN-L6-93: sealed Node bootstrap function redesign

## 1. Function boundary

`buildNodeGeneration`はreview済みtoolchain provenance、lock/dependency/source graph、subject revisionから
immutable generationとreceiptを生成する。`publishActivation`はglobal exclusive lease取得後にmax sequence
`N+1`のappend-only markerを追加する。`loadNodeGeneration`はvalidated markerの最大complete sequenceを選ぶ。

## 2. Fail-close

- 同version別npm CLI、digest/revision/path/symlink driftをprocess生成前に拒否する。
- marker sequence重複、generation欠落、receipt不一致、temp/torn/invalid markerをcurrentにしない。
- exact `dist/node-publish.lock/`以外のlease backend、distinct sequence逆順publish、lease busyを拒否する。
- stale lockはowner.json欠落時も永久fail-closeし、F0 recovery/steal/clear APIを持たない。
- 通常rollbackは同一revisionの旧generationを指す新markerだけを許可する。
- cross-revision rollback/target revision変更はunsupported。git revert後の新revision buildへrouteする。
- F0でautomatic GC、generation delete API、power-loss durable claimを拒否する。
- Node失敗時のBun/bunx/tsx/TS直実行/shell/native helper fallbackを禁止する。

## 3. L7開始条件

L7-458は本PLAN、L7 unit候補`CAND-NODEBOOT-001..016`、L8/L9 pairのtraceを参照する。
D0文書だけでは正式test IDまたはGreenを主張しない。

## 4. Cutover function contract

`initializeCutoverChain(input)`は空chainでのみ許可し、inventory/review/admission evidence setをexact検証して
genesisを作る。非空chainは`cutover-genesis-already-initialized`。`appendCutoverTransition(input)`は空chainを
`cutover-chain-uninitialized`で拒否し、validated chain、expected previous/current state、subject revision、
evidence receipt、review/admission receiptを受ける。preconditionはL6 confirmed、両receiptのrevision一致、
許可された隣接一方向遷移、previous chain digest一致である。postconditionは
`CutoverTransitionReceipt { previous_state, current_state, subject_revision, evidence_digest,
review_digest, admission_digest, evidence_set_digest, previous_receipt_digest, chain_digest }`をappendし、projectionが同じcurrent stateを返すこと。
invalid/skip/reverse/replayは`cutover-transition-invalid`、revision不一致は`cutover-revision-mismatch`、
review/admission不足は`cutover-admission-not-ready`、chain不一致は`cutover-chain-invalid`でfail-closeする。
`projectCutoverState(receipts)`はvalidated chainだけから状態を導出し、DB current値を入力正本にしない。

空chainは`uninitialized`を返しcommand開始を拒否する。genesisはnull previous fields、inventory evidence、
review/admission、genesis digestを検証してchain headを作る。`CutoverEdgeEvidence`はedgeをdiscriminatorとし、
edge別required evidenceのkind/count/producer/subject revision/digest/exit successをexact検証する。
wrong edge evidence、replay、skipはtyped failureとなる。pair oracleはL7
`CAND-CUTOVER-001..009`とL9 `CAND-NODEBOOT-207`である。evidence registryはL5 §3の5行をexactに使う。
