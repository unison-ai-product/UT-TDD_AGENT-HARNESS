---
plan_id: PLAN-L6-93-node-bootstrap-contract
title: "PLAN-L6-93: sealed Node bootstrap function redesign"
kind: design
layer: L6
drive: fullstack
status: draft
route_signal: design_correction
route_mode: redesign
created: 2026-07-24
updated: 2026-07-24
owner: PO / TL
github_issue_id: 152
parent_design: docs/plans/PLAN-L5-26-node-generation-activation.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
supersedes:
  - PLAN-L6-01-function-spec
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
  requires:
    - docs/plans/PLAN-L5-26-node-generation-activation.md
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
- distinct sequenceの逆順publish、publish lease busy、recovery receipt無しのstale lease stealを拒否する。
- 通常rollbackは同一revisionの旧generationを指す新markerだけを許可する。
- cross-revision rollbackはapproved target certificateでexpected revisionを変更し、旧receiptを改竄しない。
- F0でautomatic GC、generation delete API、power-loss durable claimを拒否する。
- Node失敗時のBun/bunx/tsx/TS直実行/shell/native helper fallbackを禁止する。

## 3. L7開始条件

L7-458は本PLAN、L7 unit候補`CAND-NODEBOOT-001..012`、L8/L9 pairのtraceを参照する。
D0文書だけでは正式test IDまたはGreenを主張しない。
