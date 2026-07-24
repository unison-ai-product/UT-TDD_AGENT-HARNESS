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
github_issue_id: 152
admission_receipt:
  schema_version: v2
  receipt_id: certificate:52ddac71ee94bc72d51c079b8383b81b
  command_id: pr154-authorship-l6-20260724
  admitted_at: 2026-07-24T15:40:00.000Z
  source_digest: sha256:fa3bf09dfd7bed7eb8b119017dcfbd8359e8b175caf7789b4b3bbdb0dbeee7e3
  decision_digest: sha256:2bbeda2b622e8daca32aa7334841e037b2cb8c3dbe227ecb1d8541aa341fb26b
  receipt_digest: sha256:eec1457293b0029f9bc3e6bc266fce86a35c8775b51776aa8cfcf792d62d5ff3
  binding:
    path: docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    plan_id: PLAN-L6-93-node-bootstrap-contract
    asset_id: plan:legacy:80a50dd958ae451ea13030276eb8c145a8fdc3104ec145560457f97a07594881
    revision: 18
    content_digest: sha256:fa3bf09dfd7bed7eb8b119017dcfbd8359e8b175caf7789b4b3bbdb0dbeee7e3
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
  transition:
    direction: design_to_implementation
    implementation_disposition: none
    implementation_target:
      target_plan_id: PLAN-L6-93-node-bootstrap-contract
      target_revision: 18
  reentry:
    target_plan_id: PLAN-L6-93-node-bootstrap-contract
    target_revision: 18
    phase: forward_merge
  escape_reason: PR 154 authorship closure
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
`SliceEvidenceReceipt`は11-field pre-attestation tuple、record digest、nested attestation、wrapper receipt digestを封印する。
generic kindはtyped `EvidencePayloadObject`をobject receipt digestで取得してpayload bytesを再hashする。review bundleは
SliceEvidenceとpayload objectのkind/producer owner/attestation producer/payload schemaを
L5 closed discriminated unionへexact照合する。payloadはRFC 8785 canonical JSON→UTF-8→RFC 4648
base64url paddingなしに固定してdecoded bytesを再hashし、arbitrary bytes/schema spoof/
cross-kind/cross-owner/cross-semantic replayを拒否する。
subject revisionはalgorithm prefix付きGitObjectIdへ固定してouter/payloadをexact一致させる。payload object、
decoded payload、attested envelopeのschema literalと`payload_schema == schema_id`を要求する。
F0c/Q0/aggregateはOS lane subject/run/attempt/outcome、expected/executed case set、全lane outcomeから
successとcoverage欠測0を再導出し、content digestをlookup keyに使わない。
Q0 expected setはproducer payloadでなく同subjectのimmutable attested CaseManifestObjectを正本とする。
正本pathは`docs/test-design/harness/L8-integration-test-design.md`、artifact IDは
`NODE-Q0-CASE-MANIFEST-v1`とし、exact 1 marker pair間のexact 1 JSON objectだけを抽出する。
duplicate/unknown fieldを拒否し、RFC 8785 canonical object UTF-8 bytesからartifact digestを再計算する。
raw Markdown UTF-8 LF、backtick込みmarker exact行、前後空白0、間のnonblank JSON exact 1行、
required/allowed 3 fields exactを要求する。DBは`evidence_type`単一discriminatorとし、Q0 refは
`edge_kind='q0.case-manifest'`, `ordinal=0` exact 1を要求する。
Case IDはUTF-8 code-point昇順unique array、set digestは
`SHA-256(lowerhex)(UTF-8(RFC8785 canonical JSON(array)))`とし、source artifact digestをsubject時点の
canonical test-design bytesから再計算する。core/outer owner一致、closed mapの`ci`、subject単位の同digest冪等・
異digest競合を要求する。q0.authoring/q0.runtime-no-fallbackは同一outer digestをtyped evidence refで参照し、
missing/orphan/split manifestを拒否する。
ReceiptDigest raw 64 lowerhexとContentDigest `sha256:`付き64 lowerhexを分離する。artifact digest preimageは
marker間single parsed JSONのRFC 8785 UTF-8 bytesだけとし、DB subjectはsigned payloadからgenerated導出する。
strict NOT NULL tableへの移行はdecode/copy/count/digest/swap/indexを単一transactionで完遂する。
ReviewBundleはprovider-attested CandidateAuthorshipReceiptをnested参照し、全writer setsとreviewerのdisjointを
再導出する。D0 top-level 5 inputsは維持する。projectionはsingle read snapshotからstagingへ全投影後atomic publishする。
aggregateはclosed profileのprofile revision、required lane IDs/set digestとobserved setをexact照合する。
共通GitObjectIdを全receipt subject/HEADへ適用しraw hexを拒否する。tracked/L6/reviewを含む全schema versionをliteral v1へ閉じる。
ReviewLane coreは12 fields/self除外11-field、SliceAdmissionは8/self除外7-field ordered preimageへ固定する。
claim-blind/spec-blind各1 PASSとartifact/revision一致を要求する。bundle/lane execution modeはactual admissionと
一致させ、hybridはprovider/runtimeを分離、codex/claude-onlyは異model/session/identity、standaloneはhuman 2名を要求する。
chain entryは全evidence receiptを保持しchain-onlyで再検証できる。writerはexclusive lock内CASで単一atomic
appendし、CAS loser、fork、double genesis、crash partialを拒否する。
ReviewBundle coreはexact 7 fields/self除外6-field ordered preimageを持ち、ReviewLane/Bundle coreは
producer/record digest/nested attestationを持つexact `AttestedReceiptEnvelope`で保存する。
SliceAdmission coreも同じenvelopeへ格納してraw coreをtyped unionへ保存しない。ReviewBundle→lane、
SliceEvidence→ReviewBundle、D0→ReviewBundle、Q0 predecessorの全参照はouter envelope
`receipt_digest`へ統一し、core digestはenvelope内部検証だけに使う。
slice admissionとは別の`CutoverAdmissionReceipt`を全edgeでfresh発行し、genesisはvalidated Q0、
以後は直前cutover receiptをpriorに要求する。review/admission/evidenceは既存`EvidenceRecord` /
`EvidenceAttestationVerifierPort`のtrusted authority/key/signature bindingを必須とする。
CutoverAdmissionにexecution modeを封印し、bundle/lane/actual admission modeとexact一致させる。
CutoverAdmissionのproducer owner、EvidenceProducer、authority IDを分離し、5 edge closed map及び
`authority_id == attestation.authorityId`を要求する。SliceAdmission core/outer ownerもexact一致させる。
edge別allowed authority ID/keyVersionをclosed照合し、別trusted CI authority replayを拒否する。
physical writerは`.ut-tdd/ledger/cutover-ledger.db` SQLiteの`BEGIN IMMEDIATE`、WAL、`synchronous=FULL`、
head/version CAS、UNIQUE制約、commit/fsync barrierを使い、loser/crashはrollback+retry 0とする。

`initializeCutoverChain`、`appendCutoverTransition`、`projectCutoverState`の将来実装先は
`src/runtime/cutover-transition.ts`、pair testは`tests/cutover-transition.test.ts`である。現在のD0 PRは
このfunctions→source→test生成契約だけをfreezeし、source/test artifactを実装済みとは主張しない。
zod schema正本は`src/schema/cutover-transition.ts`と`src/schema/node-slice-admission.ts`、
`admitNodeSlice` runtime/testは`src/runtime/node-slice-admission.ts` /
`tests/node-slice-admission.test.ts`である。
