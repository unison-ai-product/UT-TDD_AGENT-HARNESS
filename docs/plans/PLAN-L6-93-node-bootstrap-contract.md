---
plan_id: PLAN-L6-93-node-bootstrap-contract
title: "PLAN-L6-93: sealed Node bootstrap function redesign"
kind: add-design
layer: L6
drive: fullstack
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-24
updated: 2026-08-26
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
    - docs/plans/PLAN-L7-462-bun-runtime-withdrawal.md
  blocks:
    - docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
review_evidence: []
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

- **維持**: `package.json`の`build` script (`bun build --compile`)。§1 `buildNodeGeneration`の
  sealed build receiptが成立するまでrollback手段として保持する。
- **撤去**: `scripts/ut-tdd` / `scripts/ut-tdd.ps1`のcompiled-first分岐。wrapperは
  `node src/cli.ts`を無条件にexecするthin dispatcherとする。
- **禁止の追加**: §5.2.1のwrapper検出契約を`runtime-portability` lintがfail-closeする。

#### 5.2.1 wrapper検出契約 (3条、実装PRが方式を発明しないための確定仕様)

lintは`scripts/ut-tdd` / `scripts/ut-tdd.ps1`の2ファイルのみを対象とし、次の3条**すべて**を
満たさないファイルをfail-closeする。データフロー追跡は行わない (行わなくても閉じる設計にする)。

1. **分岐・存在判定の不在** (負条件)。行のcomment除去後のtextに次が現れたらfail-close:
   - 文の先頭tokenとしての `if` / `elif` / `case` / `esac` / `switch` / `else`
   - 存在判定 `[` / `test` / `[[` / `Test-Path` / `command -v` / `which` / `Get-Command`
   - 制御演算子 `&&` / `||` (command substitution内を含め例外なし)
2. **`dist` tokenの不在** (負条件)。comment除去後のtextを`[^A-Za-z0-9_]`で区切ったtoken列に
   `dist`が現れたらfail-close。**token境界で判定する**ので`distribution`等の語は誤検出しない。
3. **canonical起動行がちょうど1つ** (正条件)。comment除去後に次のいずれかに完全一致する行が
   **ちょうど1行**存在すること (0行または2行以上でfail-close):
   - POSIX: `exec node <path> "$@"` (`<path>`は`src/cli.ts`で終わる非空token)
   - PowerShell: `& node <path> @args` (`<path>`は`src\cli.ts`で終わるexpression)

条3が本契約の要である。条1・2は負の契約にすぎず、`exec "$ROOT/build/ut-tdd" "$@"` のように
分岐なし・`dist`なしでcompiled binaryへ再流入する経路を塞げない (advisor `claude-fable-5` の
反証1、2026-08-26)。**「node以外を起動しない」を正のアサーションとして固定する**のは条3だけである。

**条1が要求するwrapper書き換え** (実測済みの偽陽性回避、advisor反証2): `origin/main`の
`scripts/ut-tdd:4` は `ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"` であり、この`&&`は
分岐ではなくpath正規化イディオムだが条1に抵触する。したがって実装PRはROOT算出を廃し、
POSIX wrapperを次の形へ倒す (`$0`依存度は現行と同一であり退行しない):

```sh
#!/usr/bin/env sh
set -e
exec node "$(dirname -- "$0")/../src/cli.ts" "$@"
```

PowerShell側は`$LASTEXITCODE`の伝播が分岐を要さないため、`Test-Path`分岐の削除のみで条1を満たす
(`exit $LASTEXITCODE` は代入・伝播であって分岐ではない)。

**前提の確認**: `node src/cli.ts`がNodeのtype-strippingで実行可能であることは本repoで実測済み
(`node src/cli.ts plan lint` / `db rebuild` / `codex --role reviewer` が常用経路として成立している)。
`package.json`の`bin.ut-tdd`も既に`./src/cli.ts`である。

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

§1 `buildNodeGeneration`のsealed build receiptと Node parity receiptが**双方とも**記録された時点で
撤去する。**いずれか一方でも欠けている状態での`build` script撤去を本条項が禁止する**
(`CAND-NODEBOOT-023`)。片方成立・他方不成立の組み合わせも禁止側であり、oracleは
2 receiptの論理積で判定する (片側だけを見るoracleは撤去を許してしまう)。

### 5.5 実装PRへの委任事項

本節はcontractのfreezeであり、実装は別PRが行う。実装PRが担うのは次の3点に限る:

1. L4 `architecture.md` §2への保護範囲追記 (§5.1と同義)。条項の**改訂**として明示し、
   「もともと保護していなかった」という解釈操作にしない。
2. wrapper 2本のcompiled-first分岐撤去と、L6 `function-spec.md` / requirements §7.1 の記述追随。
3. `runtime-portability` lintへの再流入fail-close追加 (`CAND-NODEBOOT-021/022/023`のGreen化)。

`package.json`の`build` script撤去、および`package-script-bun-runtime` (script起動語のBun禁止)
の有効化は§5.4の条件を満たすまで実装PRのscope外とする — 後者は前者に機械的に依存する
(現`build` scriptが`bun build`で始まるため、規則の有効化は`build`撤去を強制する)。

### 5.6 pair oracle

§5.2.1の3条と§5.4の条件に1対1で対応するcandidateを
`docs/test-design/harness/L7-unit-test-design.md`へ追加した:

| candidate | 対応する契約 | 判定 |
|---|---|---|
| `CAND-NODEBOOT-021` | §5.2.1 条2 (`dist` token不在) | token境界判定。`distribution`等は誤検出しない |
| `CAND-NODEBOOT-022` | §5.2.1 条1 (分岐・存在判定の不在) | 列挙したtokenのみを見る。データフロー追跡なし |
| `CAND-NODEBOOT-023` | §5.4 (2 receiptの論理積) | 片側欠落でも撤去をfail-close |
| `CAND-NODEBOOT-024` | §5.2.1 条3 (canonical起動行ちょうど1つ) | 0行/2行以上、およびnode以外の起動語をfail-close |

実装先は`src/lint/runtime-portability.ts`、pair testは`tests/runtime-portability.test.ts`である。
candidate段階では正式oracle IDを宣言せず、各test実装とRed実測の同一commitで昇格する。
