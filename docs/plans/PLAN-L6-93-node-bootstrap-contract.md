---
plan_id: PLAN-L6-93-node-bootstrap-contract
title: "PLAN-L6-93: sealed Node bootstrap function redesign"
kind: add-design
layer: L6
drive: fullstack
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-24
updated: 2026-08-31
owner: PO / TL
agent_slots:
  - role: se
    slot_label: SE - sealed bootstrap関数契約
  - role: qa
    slot_label: QA - CAND-NODEBOOT Red/Green昇格境界
parent_design: docs/plans/PLAN-L5-26-node-generation-activation.md
pair_artifact: docs/test-design/harness/L7-node-toolchain-provenance-test-design.md
next_pair_freeze: L7
transition_direction: design_to_implementation
implementation_disposition: none
implementation_target: docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
generates:
  - artifact_path: docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/node-toolchain-provenance-registry-v1.json
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-node-toolchain-provenance-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L5-26-node-generation-activation.md
  requires: []
  references:
    - docs/plans/PLAN-L6-01-function-spec.md
    - docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/design/harness/L5-detailed-design/node-toolchain-provenance-registry-v1.json
    - docs/test-design/harness/L7-node-toolchain-provenance-test-design.md
    - docs/plans/PLAN-L7-462-bun-runtime-withdrawal.md
  blocks:
    - docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
review_evidence:
  - reviewer: codex
    review_kind: cross_agent
    reviewed_at: "2026-08-27T03:30:12Z"
    tests_green_at: "2026-08-27T03:17:17Z"
    verdict: "§5 旧 Bun 配布経路の処遇契約 freeze に対する非著者 closing review 成立 (PASS / blocking 0)。PLAN 全体の confirm ではないため status は draft"
    worker_model: claude-opus-5
    reviewer_model: gpt-5.6-sol
    effort: low
    plan_revision: 2cd9640c9388bd7624e921b18a8702e9ec9e61c0
    subject_head: 2cd9640c9388bd7624e921b18a8702e9ec9e61c0
    evidence_path: docs/test-design/harness/L7-unit-test-design.md
    anchor_commit: 2cd9640c9388bd7624e921b18a8702e9ec9e61c0
    scope: >-
      PR #430 exact HEAD 2cd9640c に対する非著者 closing review。著者 family は claude、
      reviewer family は codex。canonical request
      rv1-8aa6ba19798e516c67fd771cec70ea9eb2214dbdf0bd9bf215c549283ec0626b の receipt が
      verdict=PASS / blocking 0 / reviewerFamily=codex を記録している。対象は §5 の
      wrapper 検出契約と CANDIDATE-NODEBOOT-021..030 の r1〜r8 FLAG 是正の閉塞のみで、
      PLAN-L6-93 全体の confirm、Bun retirement の完了、Issue #134/#411 の完了は主張しない。
      先行して mint された rv1-55b815ea… は author_family を codex と誤申告しており無効。
      当該 request は自己 review を強制する構造だったため使用せず、正しい author_family=claude で
      再 mint した上記 identity のみを正本とする (Issue #437 / Issue #439)。
    citations:
      - ".ut-tdd/review/receipts/8aa6ba19798e516c67fd771cec70ea9eb2214dbdf0bd9bf215c549283ec0626b.json"
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/33035309149"
      - "docs/test-design/harness/L7-unit-test-design.md: CANDIDATE-NODEBOOT-021..030"
    green_commands:
      - kind: unit_test
        command: "GitHub harness-check run 33035309149 (harness-check-linux / harness-check-windows / harness-check aggregate)"
        runner: ci
        scope: full
        exit_code: 0
        completed_at: "2026-08-27T03:17:17Z"
        evidence_path: docs/test-design/harness/L7-unit-test-design.md
        output_digest: "sha256:bab243e124dec46e8be98ef149482f0bcbbcd05bf59f01f78f41a6ff84a87c6f"
        anchor_commit: 2cd9640c9388bd7624e921b18a8702e9ec9e61c0
      - kind: vmodel_lint
        command: "node src/cli.ts plan lint docs/plans/PLAN-L6-93-node-bootstrap-contract.md"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-27T03:17:17Z"
        evidence_path: docs/plans/PLAN-L6-93-node-bootstrap-contract.md
        output_digest: "sha256:edc5d7c882bfa3e78ce485e6264893da2b35e6ab78ec83b2ee5334e326934976"
        anchor_commit: 2cd9640c9388bd7624e921b18a8702e9ec9e61c0
status: draft
sub_doc: function-spec
github_issue_id: 152
admission_receipt:
  schema_version: v2
  receipt_id: certificate:f7efb74757a4f49afa8b883d930cedd5
  command_id: pr154-trust-boundary-l6-20260724
  admitted_at: 2026-07-24T17:10:00.000Z
  source_digest: sha256:3c8030fa3d772ca8b7dd6f45d0c5076a6d04443a82a5c4230560490d3a09f1b7
  decision_digest: sha256:0319964350e137078c4526993df2313d608b02ba677372227484793269a5de32
  receipt_digest: sha256:65b25f470553027bc796b38e89be60439b00f8de9518afc7eeeea336df23579a
  binding:
    path: docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    plan_id: PLAN-L6-93-node-bootstrap-contract
    asset_id: plan:legacy:80a50dd958ae451ea13030276eb8c145a8fdc3104ec145560457f97a07594881
    revision: 27
    content_digest: sha256:3c8030fa3d772ca8b7dd6f45d0c5076a6d04443a82a5c4230560490d3a09f1b7
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
      target_revision: 27
  reentry:
    target_plan_id: PLAN-L6-93-node-bootstrap-contract
    target_revision: 27
    phase: forward_merge
  escape_reason: PR 154 trust boundary closure
---

# PLAN-L6-93: sealed Node bootstrap function redesign

## 1. Function boundary

`buildNodeGeneration`はreview済みtoolchain provenance、lock/dependency/source graph、subject revisionから
immutable generationとreceiptを生成する。`publishActivation`はglobal exclusive lease取得後にmax sequence
`N+1`のappend-only markerを追加する。`loadNodeGeneration`はvalidated markerの最大complete sequenceを選ぶ。

Issue #499 の provenance 入力は、L5 の
`NODE-TOOLCHAIN-PROVENANCE-REGISTRY-v1`
(`docs/design/harness/L5-detailed-design/node-toolchain-provenance-registry-v1.json`) を唯一の閉じた正本とする。
registry は pair-freeze 時点で観測した `linux-x64` / `windows-x64` の公式 Node v24.13.0 archive、archive 内の
Node/npm CLI relative path と file SHA-256、Node/npm version、`packageManager`/`engines`/lock identity、Git blob custody を
固定する。非著者レビュー完了までは `pair_frozen_pending_review` とし、`darwin-*` は typed `unsupported_os` である。
公式 archive の存在だけから macOS 対応を推論しない。canonical digest は RFC 8785 JCS の registry object
(self digest field を除外) とし、tracked source は宣言 revision の Git blob OID と raw-byte SHA-256を両方検証する。
registry 自身の outer blob は宣言した source revision から解決せず、consumer receipt の
`subject_revision`（registry landing commit）と `registry_blob.blob_oid` / `registry_blob.content_sha256`
のtupleへ束縛して検証する。
registry と pair の mutation oracle は `docs/test-design/harness/L7-node-toolchain-provenance-test-design.md` に固定し、
runtime verifier の設計・実装へ先行して方式を追加しない。`package.json` の engines identity custody は `node` と `npm` に限定する。`engines.bun` は
`PLAN-L7-488` §2.3 で削除済みであり、registry には収録せず (captured ではなく)、Node toolchain の support/activation authority でもない。

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
欠落、失敗、別revision、skip/replayはcandidate commitのmerge admissionで拒否する。prerequisite receiptの
`subject_revision`はtarget candidate HEADとのexact equalityを要求せず、当該receiptが束縛するcanonical merge commitが
candidate HEADのancestorであることをGit object graphだけから検証する。ただしancestor判定の前に、verifierは
対象canonical merge commit（D0/F0a）からcandidate HEADまでの**完全な履歴**を確認しなければならない。
`git rev-parse --is-shallow-repository` が `false`、shallow boundary が空、promisor/filtered object が無く、
`git rev-list --objects --missing=print <d0-merge> <f0a-merge> <candidate-head>` に欠落オブジェクトが無いことを
全て満たさない場合は、ancestor判定を実行せず typed reject `history_incomplete` とする。完全履歴を確認した後の
非祖先は `not_ancestor` とし、canonical merge commitを含まないfork、canonical predecessorを含まないstale
HEAD、別edge/別producerへのreceipt流用、同一target slice・同一candidate HEADの二重admission、canonical
predecessorを置換しようとするstale receiptはそれぞれ固有のtyped rejectとして、process生成とreceipt書込みの
前にfail-closeする。後続candidateが同じimmutable predecessor receiptを参照すること自体はreplayではない。

PR #154以前にはslice admission runtimeが存在せず、merged F0a PR #192にも`f0a_complete` receiptがないため、
F0bの最初のcandidateに限りL5 `NODE-SLICE-LEGACY-BACKFILL-REGISTRY-v1`の固定2行から次の二receiptを
atomicかつexactly once生成してよい。発行・admitの**command authority**はF0b owner #484のadmission kernelだけである。
kernelはreceipt producerを兼務せず、各L5 rowの正規producerを検証する。

1. `legacy.d0-admission` → `LegacyD0AdmissionBackfillReceiptV1`: D0 source HEAD
   `8b339ec75dffd72ef4701431305065986e01b2ea`、merge commit
   `f38974da31eb243f53c7cae392a3108a1db765dd`、および同commitの
   `docs/governance/plan-admission-receipts.json`からcommand ID
   `pr154-d0-admission-l4-20260724`〜`...-l7-20260724`をこの順に抽出した**exact 4行**を封印する。
   D0 JCS preimageはwrapper objectを持たないbare JSON arrayで、array要素は上記4行、各record objectの
   fieldは`sequence`, `previous_record_digest`, `record_digest`, `command_id`, `receipt_id`,
   `receipt_digest`, `decision_digest`, `binding`だけ、`binding`のfieldは`path`, `plan_id`, `asset_id`,
   `revision`, `content_digest`だけとする（schema/records wrapper、outer digest、Git派生行は含めない）。
   RFC 8785/JCSを再帰適用し、UTF-8（BOMなし、末尾改行なし）でSHA-256化する。4行集合のJCS digestは
   `sha256:d883335e37dc6595b5fcd47dd69bbcf8d89969338a109af0c2e5514049b07807`であり、
   各`binding.path`は同じsource commitのGit blobへ別途束縛する。独立した
   `AttestedTrackedReceiptRecord` wrapper artifactはこの履歴に存在しないため、存在したとは主張せず、
   このGit固定setだけを一回限りのbackfill evidenceとする。
2. `legacy.f0a-custody` → `LegacyF0aCustodyBackfillReceiptV1`: F0a source HEAD
   `76d0f9c7219a8290fc809b5036d6d02f9b05fb88`、tree
   `1b63e413ad4f6500cc02e8df36391d0de0571b92`、merge commit
   `12aadde9ff56e8b39c0813b988384e2e5eed00ab`、predecessor `legacy.d0-admission` integrity digest
   `sha256:d883335e37dc6595b5fcd47dd69bbcf8d89969338a109af0c2e5514049b07807`、および
   下記8 pathのGit rowだけを封印する。reviewer family/model、verdict、review record、custody admitted
   をtupleへ含めず、F0aの閉包digestはこの8 rowから決定的に再計算する。

両source HEADが各merge commitのparent closureにあり、F0a merge commitがD0 merge commitをancestorに持ち、
F0b candidate HEADが両merge commitをancestorに持つことを、完全履歴を確認した後に検証する。自己申告SHA、GitHub本文、
merge済みという事実だけでevidenceを補完しない。D0 JSONから4行を決定的に再構成するコマンドは、
`git show f38974da31eb243f53c7cae392a3108a1db765dd:docs/governance/plan-admission-receipts.json` の出力を
JSONとして読み、`records` を `command_id` の4つの固定値へ完全一致・順序固定で抽出し、各 `binding.path` を同じ
commitから `git cat-file -p <commit>:<binding.path>` で読み、blob OIDとcontent digestを再計算する処理である。
F0aのrepository-resident evidenceは、immutable source HEAD/treeの次の8 Git rowだけから再構成する。
canonical preimageはRFC 8785/JCSの**bare array**（wrapper objectなし）であり、array要素は`path`のUnicode
code-point昇順、各rowのkey順は`blob_oid`, `content_digest`, `path`に固定する。`blob_oid`は40桁lowercase
hex、`content_digest`は`sha256:` + 64桁lowercase hex、canonical bytesはUTF-8（BOMなし・末尾改行なし）とする。
source HEADから再計算したdigestは`sha256:96e326f3e5b88aede486da9f363fd03c06a7c1297a55c58ff92706ae8cfd6ff7`であり、
この値はPR #192のimmutable Git objectsから独立検証済みである。対象pathは`.node-version`、`bun.lock`、
`docs/governance/repository-structure.md`、`package-lock.json`、`package.json`、`src/lint/toolchain-pin.ts`、
`tests/hook-native-launcher.test.ts`、`tests/toolchain-pin.test.ts`のexact 8件だけである。行の追加・欠落・順序、
path/blob/content digestの一要素変異、別source/tree/merge、Git blob不在は全て再構成不能としてtyped
`legacy_evidence_unavailable`で停止し、review recordやattested recordを推測・生成しない。D0についても4行、
4 distinct path、4 distinct record/receipt digest、全blob実在を同じimmutable source commitから確認する。
registry ID、row ID、二receipt digest、
command authority、receipt producer、source/merge SHAのいずれかが既存記録と異なる再発行、partial一件だけの生成、
別F0aへの一般化、削除後の再mintは拒否する。通常のF0a以降はこのbackfill routeを持たず、`admitNodeSlice`の
通常receiptだけを使う。backfill schema/kernel/testはF0b owner #484がproduct changeより先にTDDし、同じcandidate
commitへ含める。

gate test/schema/runtimeは
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
IdentityDigest、bundle/authorship/PR base exact equality、trusted work eventによるbase..subject全product
path/commit coverageを要求する。WorkProvenanceEvent exact core/outer、event digest array、ordinal typed edge exact Nを要求する。
genesisはfirst receipt sequence 0、CAS後head sequence 0/version 1へ遷移しNULLへ戻さない。
WorkEventはnormalized touched_paths arrayとSessionIdentityDigestを持ち、first-parent diff exact setを照合する。
merge commitを拒否し、head CAS expected sequenceとMAX receipt sequenceを同一transactionで照合する。
SessionIdentityReceipt outer envelopeをWorkEvent/ReviewLaneがexact 1参照し、全tracked changed pathsを除外0で
照合する。head digestもMAX sequence row receipt digestと一致させる。
ManagedSessionAttestation verifierをcomposition rootのclosed trust registryへ接続し、UT-TDD managed session
authorityだけを検証する。外部provider署名を仮定せず、WorkEvent/laneとsession provider/runtimeを一致させる。
managed trust registry 3 row/revision/issued_at window、wrong authority/key、forgery、provider bindingとstable subject
identity bindingを要求する。
SessionIdentity exact10/self9、combined payload、outer二段検証、identity.session edge exact1を要求する。
immutable v1/revision 1のみを使い、expiryで全admissionをfail-closeする。active signing-key compromiseの自動検出、
rotation、revocationはD0実行経路に含めない。侵害の外部security incident報告時は該当authorityを運用停止し、
managed-session verification/admission/cutoverを全面fail-closeして既存receiptをmerge/activation根拠に使わない。
再開にはsecurity/PO承認の別ADR/PLAN、新registry ID v2、再review/reissueを要求し、immutable v1を書き換えない。
これはmachine Green oracle又はhistorical determinism claimではなく高影響運用境界である。
aggregateはclosed profileのprofile revision、required lane IDs/set digestとobserved setをexact照合する。
共通GitObjectIdを全receipt subject/HEADへ適用しraw hexを拒否する。tracked/L6/reviewを含む全schema versionをliteral v1へ閉じる。
ReviewLane coreは12 fields/self除外11-field、SliceAdmissionは8/self除外7-field ordered preimageへ固定する。
claim-blind/spec-blind各1 PASSとartifact/revision一致を要求する。bundle/lane execution modeはactual admissionと
一致させ、hybridはprovider/runtimeを分離、codex/claude-onlyは異model/session/identity、standaloneはhuman 2名を要求する。
chain entryは全evidence receiptを保持しchain-onlyで再検証できる。writerはexclusive lock内CASで単一atomic
appendし、CAS loser、fork、double genesis、crash partialを拒否する。
ReviewBundle coreはexact 8 fields/self除外7-field ordered preimageを持ち、ReviewLane/Bundle coreは
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

## 5. 旧Bun配布経路の処遇 (削除禁止条項の保護範囲)

### 5.1 保護対象の定義

L4 §2 の「Node parity receipt前にcurrentを削除しない」が保護するのは**再現可能なrollback
成立性**である。したがって保護対象は次の2つに限る:

1. **再現可能なbuild経路** = `package.json`の`build` script。同一revisionから同一手順で
   配布物を再生成できること。
2. **source実行経路** = `node src/cli.ts`。wrapperの既定経路。

**保護対象外**: `dist/`に残置された任意のbinaryへの**silent dispatch**。これはrollbackの
保全ではなく「HEADと無関係なcodeが`ut-tdd`として実行される」非決定性であり、条項の目的
(安全な後退可能性) をむしろ損なう。rollbackは「明示build + 生成物の明示実行 (wrapper非経由)」
で成立し、wrapperのcompiled-first分岐はrollback成立の必要条件ではない。

### 5.2 freezeする処遇 (F0期間中)

- **維持**: `package.json`の`build` script (`bun build --compile`)。**§5.4の2 receipt
  (sealed build receipt と Node parity receipt) が双方とも成立するまで**rollback手段として
  保持する。片側成立での撤去は禁止であり、撤去境界は§5.4が唯一の正本である。
- **撤去**: `scripts/ut-tdd` / `scripts/ut-tdd.ps1`のcompiled-first分岐。wrapperは
  `node src/cli.ts`を無条件にexecするthin dispatcherとする。
- **禁止の追加**: §5.2.1のwrapper検出契約を`runtime-portability` lintがfail-closeする。

#### 5.2.1 wrapper allowlist契約 (実装PRが方式を発明しないための確定仕様)

**方式はallowlistであり、禁止構文の列挙 (denylist) ではない。**
lintは`scripts/ut-tdd` / `scripts/ut-tdd.ps1`の2ファイルのみを対象とし、
**ファイル全文がcanonical textと完全一致しない場合にfail-close**する。
comment行・空行を含めて全文が固定であり、**自由記述の余地は無い**。
判定はテキスト解釈を一切伴わない**byte列の集合帰属**である (下記「比較手順」)。
データフロー追跡も構文解析も要らない。

**POSIX `scripts/ut-tdd` のcanonical text (全文)**

```sh
#!/usr/bin/env sh
# UT-TDD thin POSIX entrypoint (ADR-001). Node source CLI only; no compiled dispatch.
set -e
exec node "$(dirname -- "$0")/../src/cli.ts" "$@"
```

**PowerShell `scripts/ut-tdd.ps1` のcanonical text (全文)**

```powershell
# UT-TDD thin Windows PowerShell entrypoint (ADR-001). Node source CLI only; no compiled dispatch.
$ErrorActionPreference = "Stop"
& node (Join-Path (Split-Path -Parent $PSScriptRoot) "src\cli.ts") @args
exit $LASTEXITCODE
```

**比較手順 (byte単位、r5 review 指摘)**: lintは対象ファイルを**raw bytesとして読む**
(text decodeもUnicode正規化も行わない)。ファイルごとにcanonical byte列を定義し、
そこから受理集合を導く。

**BOMの扱いは2ファイルで非対称である** (r7 review 指摘)。同一規則を当てると誤る:

| file | 先頭BOM | 理由 |
|---|---|---|
| `scripts/ut-tdd` | **禁止** (BOM無しがcanonical) | `EF BB BF`が`#!`より前に来るとshebangが成立せず、kernelがinterpreterを解決できない。技術的にBOMは置けない |
| `scripts/ut-tdd.ps1` | **必須、ちょうど1個** (`EF BB BF`) | Windows PowerShell 5.1はBOM無しをANSIとして誤読する。`.ps1`はUTF-8 BOM必須という既存の運用規約に従う |

`.ps1`のBOMは**現状と異なる**: `origin/main`の`scripts/ut-tdd.ps1`は先頭が`23 20 55` (`# U`) で
BOMを持たない。実装PRはBOMを付与する。canonical textがASCIIのみなので現状でも実害は出ていないが、
全文固定の契約下では「たまたまASCIIだから安全」という暗黙の前提を残さず、規約側へ寄せる。

canonical byte列を次のとおり定義する。`T_posix` / `T_ps1` は§5.2.1のcanonical text (全文) を
UTF-8・LF改行・**末尾に終端LFをちょうど1個**持つ形でencodeした列とする:

```
C_posix = T_posix                     (BOM無し)
C_ps1   = EF BB BF || T_ps1           (BOM 1個を前置)
```

各fileについて、`C0` を `C` から終端LFを除いた列、`CRLF(x)` を `x` の**BOMを除く部分**の
全LFをCRLFへ置換した列とすると、**受理するbyte列は次の4つだけ**である:

```
C, C0, CRLF(C), CRLF(C0)
```

file bytesがこの4つのいずれとも一致しなければfail-close。これにより
lone CR、NUL、末尾の追加空行、行末trailing whitespace、Unicode正規化差異 (NFC/NFD)、
homoglyph、zero-width文字、UTF-8として不正なbyte列、**および`.ps1`のBOM欠落・BOM重複・
`scripts/ut-tdd`へのBOM混入・別encoding (UTF-16 LE/BE等) への差し替え**は、
**個別規則を書かずに**すべて不一致として落ちる (どれもそのfileの4列のいずれでもないため)。
「末尾改行の有無」という曖昧な文言は使わない — 終端LFは0個か1個のいずれかであり、
2個以上は受理しない。

**canonical byte列`C`の信頼源** (r6 review 指摘): `C`は**lint source内のimmutable byte literal**
を唯一の正本とする。外部fixtureファイルを読んで期待値とすることを禁止する — fixtureを正本にすると、
wrapperとfixtureを同一PRで同時に書き換えることでfail-openでき、「実装PRが方式を発明しない」という
本節のfreezeが成立しないためである。同じ理由で、`C`をwrapper自身や生成物から導出してはならない
(期待値が対象に追随すると検出が恒真になる)。`C`の変更は本PLANの改訂を要する。

**comment行を自由記述にしない理由** (r4 review 指摘): comment行は意味的に不活性ではない。
POSIXではcanonical shebangより前に別の`#!`行を置けば別interpreterが選択され得るし、
PowerShellの`#requires -Modules`は3行の実行文より前にmodule codeをloadして実行する。
どちらも「comment行を除去してから照合する」規則を素通りする。加えてcomment自由記述は
`CAND-NODEBOOT-021` (comment内を含む`dist`参照でfail-close) と正面から矛盾し、どの実装でも
同時に満たせないoracleになっていた。全文固定にすることで両方が同時に閉じる。

**denylistをやめた理由** (r3 review 指摘): 本契約は r1→r2→r3 で禁止構文を継ぎ足してきたが、
そのたびに新しい迂回が見つかった。r3 が示した迂回は次で、r2 の「起動文集合」定義を
`eval`がshell builtinであるために通過する:

```sh
eval ./build/ut-tdd
exec node ./src/cli.ts "$@"
```

変数代入内の`$(./build/ut-tdd)`も同様に通過した。**禁止側を列挙する限り、列挙漏れが
そのまま迂回路になる**。許容側が4行しかない対象に対して denylist を使っていたこと自体が
誤りである。allowlistでは**wrapperのfile contentを経由する迂回路の集合が空になる**
(canonical text以外はすべてfail-closeなので、`eval`も command substitution も`dist`参照も
分岐も`#requires`も、個別に列挙せずに落ちる)。

**ただし「迂回路の集合が空」はfile contentの範囲に限る** (r4 review 指摘)。canonical textは
bare nameの`node`を起動するため、**PATH解決先の差し替え・`node`のsymlink付け替え・
`NODE_OPTIONS` / `--import`によるpreload・`src/cli.ts`自体の改竄**は、file contentを一切
変えずに別の実行体へ到達させ得る。本契約はこれらを閉じない。§5.2.2でscope外として明示する。

**trade-off (意図的に受け入れる)**: allowlistは正当な変更にも脆い。wrapperへ`set -u`を足す、
Node版数チェックを入れる、commentを1語直す、といった変更はすべて本契約の改訂を要する
(全文固定なのでcommentの字句修正も例外ではない)。4行のtrust rootに対しては
その硬さが妥当であり、変更が必要になったら契約改訂を経る (実装PR内での方式発明を許さない、
という§5.5の趣旨と一貫する)。

**現行wrapperからの差分**: `origin/main`の`scripts/ut-tdd:4`は
`ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"`でROOTを算出しているが、allowlistには
この行が無いため実装PRはROOT算出を廃す。PowerShell側も`$root` / `$bin`の代入と`Test-Path`分岐が
canonical text外となるため、上記の全文へ倒す。現行wrapperの既存commentも
canonical textのcomment行へ差し替える (字句を含めて固定である)。

**前提の確認**: `node src/cli.ts`がNodeのtype-strippingで実行可能であることは本repoで実測済み
(`node src/cli.ts plan lint` / `db rebuild` / `codex --role reviewer` が常用経路として成立している)。
`package.json`の`bin.ut-tdd`も既に`./src/cli.ts`である。

#### 5.2.2 allowlistのscope境界 (何を閉じ、何を閉じないか)

**閉じるもの**: wrapper 2本のfile contentから到達し得る全ての起動。canonical textとの
全文一致で判定するため、compiled binaryへの分岐・別interpreterの選択・preload指示・
任意のcodeの混入は、形を問わずfail-closeする。

**閉じないもの (scope外、意図的)**:

| 面 | なぜ閉じないか |
|---|---|
| PATH上の`node`実体の差し替え / symlink | wrapper textでは制約できない。絶対pathを焼くとOS・環境ごとに壊れ、可搬性というADR-001の目的そのものを損なう |
| `NODE_OPTIONS` / `--import` によるpreload | 呼び出し側プロセスのenvであり、file contentの外側にある |
| `src/cli.ts`以降のsource改竄 | wrapperではなくrepo全体のintegrityの問題であり、review / CI / git historyが担う面 |
| repo外に置いたsymlink経由の起動 | POSIX shが`$0`のsymlinkを追跡しないため解決先はsymlinkの所在に従う。**現行mainと同一の挙動**であり本PLANが導入する性質ではない (§5.5に実測)。修正はportableなsymlink解決を要し、4行のtrust rootの範囲を超える |

これらは**wrapper契約の失効ではなく、別のtrust boundaryが担う残余リスク**である。
本PLANは「wrapper textを信頼根とする」とだけ主張し、「wrapperを固定すればnodeの実行体まで
一意に定まる」とは主張しない。ambient環境の信頼はrepo外の運用 (開発機・CI runnerの構成) に
属し、本契約の検証対象ではない。実装PRの`runtime-portability` lintもこの範囲を実装しない
(実装しないことをテストで固定する必要は無い — 検出規則が存在しないだけである)。

### 5.3 撤去の根拠 (実測、基準 = `origin/main` `1f347281`)

wrapperのcompiled-first分岐が「保護すべき稼働経路」ではないことの実測:

| 観測 | コマンド | 結果 |
|---|---|---|
| Pack配布が運ばない | `git grep -n dist -- src/distribution/` | 0件 |
| consumer/README/templateが依存しない | `git grep -nE "bun run build\|dist/ut-tdd\|ut-tdd\.exe" -- README.md docs/templates/ src/setup/ .github/` | 0件 |
| CIがbuildを実行しない | `git grep -nE "run build\|bun build\|dist" -- .github/workflows/` | build step 0件 |
| bin参照が既にsource | `node -e "console.log(require('./package.json').bin)"` | `{"ut-tdd":"./src/cli.ts"}` |
| dispatch対象が実際にstale | `stat dist/ut-tdd.exe` (開発機) | 107,570,176 bytes / mtime `2026-06-19` (HEADより約2か月古い) |

tracked参照はwrapper 2本、`build` script 1件、lint/test fixtureのみである。すなわち
compiled dispatchはどのconsumer経路からも到達されず、到達し得る唯一の面 (wrapper) が
2か月前のbinaryを`ut-tdd`として実行する非決定性を持つ。

### 5.4 `build` scriptの撤去条件

§1 `buildNodeGeneration`のsealed build receiptと Node parity receiptが**双方とも**記録され、
かつ**両receiptが下記の閉じたtupleでexact一致する**時点で撤去する。
**いずれか一方でも欠けている状態での`build` script撤去を本条項が禁止する**
(`CAND-NODEBOOT-023`)。片方成立・他方不成立の組み合わせも禁止側であり、oracleは
2 receiptの論理積で判定する (片側だけを見るoracleは撤去を許してしまう)。

**receipt束縛tuple (r7 review 指摘、存在確認だけでは不足)**: 「2 receiptが存在する」ことは
撤去条件として不十分である。別revisionでbuildしたreceiptと別revisionで取ったparity receiptが
並んでいても存在条件は満たされ、どちらも現在の撤去対象を保証しない。したがって両receiptは
次の4要素からなる閉じたtupleを持ち、**両者のtupleが完全一致し、かつ撤去commitのsubjectと
一致する**ことを要求する:

| 要素 | 意味 |
|---|---|
| `subject_revision` | algorithm prefix付きGitObjectId (§4と同じ形)。build対象とparity計測対象が同一commitであること |
| `generation_id` | §1 `buildNodeGeneration`が生成したimmutable generationの識別子。同一revisionでも別generationのreceiptを混ぜない |
| `artifact_digest` | 封印されたbuild成果物のdigest。generationが同じでも成果物が異なるreceiptを混ぜない |
| `retirement_subject` | 撤去 (= `package.json`の`build` script削除) を行うcommitのsubject revision。過去の成立を現在の撤去へ流用させない |

4要素のいずれか1つでも不一致なら撤去をfail-closeする。**部分一致による撤去は禁止側**であり、
oracleは論理積 (2 receiptの存在 ∧ tuple完全一致) で判定する。

### 5.5 実装PRへの委任事項

L4 `architecture.md` §2 の削除禁止条項の改訂は**本PRで同時に行う** (r2 review 指摘: 親設計と
矛盾するL6契約をfreezeしてはならない。条項改訂を実装PRへ遅延させると、その間L4は
「parity前に旧Bun経路を撤去しない」と読めるままになる)。

実装PRが担うのは次の2点に限る:

1. wrapper 2本を§5.2.1のcanonical text (全文固定) へ倒すことと、L6 `function-spec.md` /
   requirements §7.1 の記述追随。
2. `runtime-portability` lintへの再流入fail-close追加
   (`CAND-NODEBOOT-021`〜`030`のGreen化)。025は受理4集合外のbyte列rejection、
   026は起動形oracle (symlink形はcanonical == 現行main形の等価oracle、bare-name形と
   相対PATH entry形は実測値の固定)、027/028は§5.4のreceipt束縛tuple不一致の4+1 case、
   029/030はfile別canonical byte列のBOM非対称 (`.ps1`はBOM必須、POSIXはBOM禁止) である。
   **この10件全てが実装PRの必須gateであり、一部のGreen化で撤去を進めない。**
3. `scripts/ut-tdd.ps1`への先頭BOM (`EF BB BF`) 付与。現状はBOM無しであり、
   §5.2.1の`C_ps1`と一致しない。

**wrapper書き換えに伴う起動形の検証** (r2 / r5 review 指摘): 現行の
`ROOT="$(CDPATH= cd -- … && pwd)"` は絶対・正規化されたrootを得るのに対し、§5.2.1のcanonical textは
未正規化のpathをNodeへ渡す。**bare-name (PATH経由)・symlink・相対PATH entry**の3形について
実装PRのoracleで固定する。

ただしsymlink形について、r5 review は「canonical textはsymlink自体の所在から`../src/cli.ts`を
解決するためrepo外のsymlinkからはrepo sourceを実行しない」と指摘し、これが§5.5の
「退行しない」要求とcanonical text固定を両立不能にするとした。**実測で決着した**:

```
$ sh outside/link-main    # 現行main形 (ROOT="$(CDPATH= cd -- … && pwd)")
main-form -> /tmp/symtest/src/cli.ts
$ sh outside/link-canon   # canonical形
canonical -> outside/../src/cli.ts       # = /tmp/symtest/src/cli.ts
```

POSIX shは`$0`のsymlinkを追跡しないため、**両形は同一の (repo外を指す) pathを選ぶ**。
symlink起動でrepo sourceに到達しない性質は**現行mainに既に存在し、canonical textが新たに
導入するものではない**。したがって:

- §5.5がsymlink形に要求するoracleは**等価oracle** (canonical形の解決先 == 現行main形の解決先)
  であり、絶対的な正しさ (「必ずrepo sourceを実行する」) のoracleではない。等価oracleは
  canonical textを変えずに成立するため、契約と委任oracleは両立する。
- symlink起動でrepo sourceへ到達させること自体は本PLANのscope外とし、§5.2.2の表に記載する。
  POSIX portableなsymlink解決は`readlink -f`がBSD/macOS既定で使えずloop実装を要するため、
  4行のtrust rootに載せる変更ではない。必要になれば別PLANで扱う。

bare-name形と相対PATH entry形については等価性を主張しない。実装PRで実測oracleを張ってから
撤去すること。

`package.json`の`build` script撤去、および`package-script-bun-runtime` (script起動語のBun禁止)
の有効化は§5.4の条件を満たすまで実装PRのscope外とする — 後者は前者に機械的に依存する
(現`build` scriptが`bun build`で始まるため、規則の有効化は`build`撤去を強制する)。

### 5.6 pair oracle

§5.2.1のallowlist契約と§5.4の撤去条件に対応するcandidateを
`docs/test-design/harness/L7-unit-test-design.md`へ追加した:

| candidate | 対応する契約 | 判定 |
|---|---|---|
| `CAND-NODEBOOT-021` | §5.2.1 全文一致 (`dist` 参照の再流入) | 全文不一致として落ちる。comment内を含め形を問わない |
| `CAND-NODEBOOT-022` | §5.2.1 全文一致 (分岐・存在判定の再流入) | 同上。構文解析・データフロー追跡を要さない |
| `CAND-NODEBOOT-023` | §5.4 (2 receiptの論理積) | 片側欠落でも撤去をfail-close |
| `CAND-NODEBOOT-024` | §5.2.1 全文一致 (canonical以外の起動 / 非不活性comment) | `eval` / 代入内command substitution / backtick / source / 別`exec` / 別shebang / `#requires` 等を個別caseで固定 |
| `CAND-NODEBOOT-025` | §5.2.1 比較手順 (file別受理4集合の外) | lone CR / NUL / 末尾追加空行 / trailing whitespace / NFD / homoglyph / zero-width / 不正UTF-8 をbyte列不一致で落とす (BOMは029/030が持つ) |
| `CAND-NODEBOOT-026` | §5.5 起動形の等価性 | symlink形はcanonical == 現行main形 (等価oracle)。bare-name / 相対PATH entry は実測値を固定 |
| `CAND-NODEBOOT-027` | §5.4 receipt束縛tuple | stale / wrong-revision / wrong-generation / wrong-artifact の4caseを独立に落とす |
| `CAND-NODEBOOT-028` | §5.4 `retirement_subject` | 過去成立receiptの別commitへの流用をfail-close |
| `CAND-NODEBOOT-029` | §5.2.1 `C_ps1` (BOM必須) | BOM欠落 / BOM重複 / **BOM 1個だがbyte相違 (`EF BB BE`等)** / 別encodingを独立caseで落とす |
| `CAND-NODEBOOT-030` | §5.2.1 `C_posix` (BOM禁止) | 先頭BOM混入を落とす (shebang破壊) |

021 / 022 / 024 / 025 / 029 / 030 は**同一の全文一致規則に対する別々の攻撃case**であり、
独立した検出規則ではない (029 / 030 はcanonical byte列がfile別であることを固定する)。denylist時代は規則ごとに列挙漏れが迂回路になっていたが、allowlistでは
「canonical text全文一致以外はすべて落ちる」1規則に収束する。

 実装先は`src/lint/runtime-portability.ts`、pair testは`tests/runtime-portability.test.ts`である。
candidate段階では正式oracle IDを宣言せず、各test実装とRed実測の同一commitで昇格する。

### 5.7 Issue #499 provenance pair-freeze

Node/npm の provenance 入力は L5 の `NODE-TOOLCHAIN-PROVENANCE-REGISTRY-v1` に固定し、
runtime registry への materialization はこの registry digest からのみ許可する。データの役割は
`design_input_registry` であり、L7 runtime verifier の実装や governance registry の生成を本 PLAN で行わない。
公式 archive filename/SHA-256、archive-root-relative Node/npm CLI member path/file SHA-256、version、
`packageManager`/`engines`/lock identity、closed OS/arch union (`darwin-*` は `unsupported_os`)、
canonical JCS digest、Git blob custody の mutation oracle は、対になった
`docs/test-design/harness/L7-node-toolchain-provenance-test-design.md` の
`CAND-NODEPROV-001..011` を正本とする。`CAND-NODEBOOT-006` / `009` は同表を参照し、
後続実装で Red 実測されるまで正式 `U-*` や Green を主張しない。
