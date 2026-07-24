---
plan_id: PLAN-L6-93-node-bootstrap-contract
title: "PLAN-L6-93: sealed Node bootstrap function redesign"
kind: add-design
layer: L6
drive: fullstack
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-24
updated: 2026-07-24
owner: PO / TL
agent_slots:
  - role: se
    slot_label: SE - sealed bootstrap関数契約
  - role: qa
    slot_label: QA - CAND-NODEBOOT Red/Green昇格境界
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
status: draft
sub_doc: function-spec
github_issue_id: 152
admission_receipt:
  schema_version: v2
  receipt_id: certificate:0e85d614092a7b9d60d675ed85905748
  command_id: pr154-final-scope-l6-20260724
  admitted_at: 2026-07-24T09:00:00.000Z
  source_digest: sha256:ec2f104bf8e62c4cd8cefcf73146460e636bd70e153776aeab8ba7be12631f94
  decision_digest: sha256:324a62abc87270c5dcef149347d51fd33bfbecd77df8aec49cbaa2f8dff0847a
  receipt_digest: sha256:f7229883f9fd354231ae6e90e29c07a030f6934fe581fb127e709565ac9901eb
  binding:
    path: docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    plan_id: PLAN-L6-93-node-bootstrap-contract
    asset_id: plan:legacy:80a50dd958ae451ea13030276eb8c145a8fdc3104ec145560457f97a07594881
    revision: 3
    content_digest: sha256:ec2f104bf8e62c4cd8cefcf73146460e636bd70e153776aeab8ba7be12631f94
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 152
    episode_id: E4-152-node-control-plane-d0n
    projection_digest: sha256:bc3454a066b640893922b0ad77dd27ad8baa0091586d82d152df0fc6e8d06f0e
  origin:
    plan_id: PLAN-L6-01-function-spec
    revision: 2
    digest: sha256:17aa0a9879af76091a2bc03bd96019c185eeaaadff6fbecdfad53d255be5fa95
  reentry:
    target_plan_id: PLAN-L6-93-node-bootstrap-contract
    target_revision: 3
    phase: forward_merge
  escape_reason: PR 154 additive Node refinement and D0 trust correction
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

L7-458は本PLAN、L7 unit候補`CAND-NODEBOOT-001..020`、L8/L9 pairのtraceを参照する。
D0文書だけでは正式test IDまたはGreenを主張しない。

slice admissionは`admitNodeSlice(input)`で`d0_admitted → f0a_complete → f0b_complete →
f0c_complete → q0_complete`だけを進める。F0aはreview+admission済みD0 draft receipt、F0bはF0a custody receipt、
F0cはF0b sealed build receipt、Q0はF0c aggregate receiptをexactly one要求する。typed dependencyの
欠落、失敗、別revision、skip/replayはcandidate commitのmerge admissionで拒否する。gate test/schema/runtimeは
product changeより先にTDDし同一commitへ含める。Issue #153 envelopeが許可するのは
順序内の非activation build/verifyとQ0 fixture/detector workだけであり、production activation、
hook/runtime switch、Bun final deletion、cutoverはL6 confirmed+D0 admissionまで禁止する。

## 4. Cutover function contract

`initializeCutoverChain(input)`は空chain、`sequence=0`、`expected_previous_receipt_digest=null`でのみ許可し、inventory/review/admission evidence setをexact検証して
genesisを作る。非空chainは`cutover-genesis-already-initialized`。`appendCutoverTransition(input)`は空chainを
`cutover-chain-uninitialized`で拒否し、validated chain、expected previous/current state、subject revision、
evidence receipt、review/admission receiptを受ける。preconditionはL6 confirmed、両receiptのrevision一致、
許可された隣接一方向遷移、`sequence=latest+1`、`expected_previous_receipt_digest=latest.receipt_digest`である。postconditionは
`CutoverTransitionReceipt { schema_version, registry_id, transition_id, sequence, subject_revision,
previous_state, current_state, evidence_set_digest, review_digest, admission_digest,
previous_receipt_digest, receipt_digest }`をappendし、projectionが同じcurrent stateを返すこと。
別名`evidence_digest` / `chain_digest`は拒否する。全edgeでfresh review bundle/admissionを要求し、
top-level digestは非nullかつ対応evidence receipt `receipt_digest`とexact一致する。
invalid/skip/reverse/replayは`cutover-transition-invalid`、revision不一致は`cutover-revision-mismatch`、
review/admission不足は`cutover-admission-not-ready`、chain不一致は`cutover-chain-invalid`でfail-closeする。
`projectCutoverState(receipts)`はvalidated chainだけから状態を導出し、DB current値を入力正本にしない。

空chainは`uninitialized`を返しcommand開始を拒否する。genesisはnull previous fields、inventory evidence、
review/admission、genesis digestを検証してchain headを作る。`CutoverEdgeEvidence`はedgeをdiscriminatorとし、
edge別required evidenceのkind/count/producer/subject revision/digest/exit successをexact検証する。
wrong edge evidence、replay、skipはtyped failureとなる。pair oracleはL7
`CAND-CUTOVER-001..009`とL9 `CAND-NODEBOOT-207`である。evidence registryの唯一の正本はL5 design
`CUTOVER-EVIDENCE-REGISTRY-v1`であり、PLAN/L6はkind/producer IDを再定義しない。
inventory_frozen→node_shadowはproducer receiptごとのslice commitをsubjectとし、candidate HEADの
descendant closureを検証する。transition receiptのsubjectはcandidate HEADで、stale/replay/non-ancestorを拒否する。
registry row order、固定tuple、UTF-8 canonical JSON、decimal byte-length framing、SHA-256 lowercase hexによる
`evidence_set_digest`を要求し、duplicate、cross-OS drift、tuple mutationを拒否する。sealed edgeは
`PLAN-RECOVERY-16`と`PLAN-L7-452`のtyped evidenceを両方要求し、片方だけでは遷移しない。
`SliceEvidenceReceipt`自体もversion付き固定tupleを同じencodingで封印する。review bundleは
claim-blind/spec-blind各1 PASS、lane/reviewer/session/runtime family一意、artifact/revision一致、author独立を要求する。
chain entryは全evidence receiptを保持しchain-onlyで再検証できる。writerはexclusive lock内CASで単一atomic
appendし、CAS loser、fork、double genesis、crash partialを拒否する。
slice admissionとは別の`CutoverAdmissionReceipt`を全edgeでfresh発行し、genesisはvalidated Q0、
以後は直前cutover receiptをpriorに要求する。review/admission/evidenceは既存`EvidenceRecord` /
`EvidenceAttestationVerifierPort`のtrusted authority/key/signature bindingを必須とする。
physical writerは`.ut-tdd/harness.db` SQLiteの`BEGIN IMMEDIATE`、WAL、`synchronous=FULL`、
head/version CAS、UNIQUE制約、commit/fsync barrierを使い、loser/crashはrollback+retry 0とする。

`initializeCutoverChain`、`appendCutoverTransition`、`projectCutoverState`の将来実装先は
`src/runtime/cutover-transition.ts`、pair testは`tests/cutover-transition.test.ts`である。現在のD0 PRは
このfunctions→source→test生成契約だけをfreezeし、source/test artifactを実装済みとは主張しない。
zod schema正本は`src/schema/cutover-transition.ts`と`src/schema/node-slice-admission.ts`、
`admitNodeSlice` runtime/testは`src/runtime/node-slice-admission.ts` /
`tests/node-slice-admission.test.ts`である。
