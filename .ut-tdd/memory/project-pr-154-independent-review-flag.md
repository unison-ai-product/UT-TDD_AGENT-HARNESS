---
memory_id: memory:project:pr-154-independent-review-flag
kind: project
title: "PR #154 independent claim review: FLAG"
tags: ["pr-154", "claim-review", "flag", "node", "design"]
updated_at: 2026-07-24T12:45:00.000+09:00
---

PR #154の独立claim reviewはFLAG。PASS証拠として扱わない。

検出した設計欠落:

1. 現行mainのBun実体とtarget Nodeを同じ現在形で記述していた。
2. D0の候補oracleを正式`U-NODEBOOT-*`として表示していた。
3. npmのversion自己申告に対するreview済みexpected identity sourceとsame-version substitute oracleが不足していた。
4. generation pointerのPOSIX/Windows別atomic・durability・rollback・cleanup ownershipが未確定だった。
5. Issue #153に原子slice別gate条件が記録されていなかった。

このmemoryはreview verdictの履歴であり、修正commit、再review、PASSを代替しない。

## Second review FLAG

初回修正後も次の3件が残存したため、verdictはFLAGのまま維持する。

1. architecture/repository-structureに無条件Bun規範が残り、current debtとtarget Nodeが一意でなかった。
2. Windows activationがReplaceFileW等のNode標準API外へ依存し、F0をnative helper/Rustでblockした。
3. Issue #152所有のL4→L5→L6 Redesign PLAN chainとconfirmed設計artifactの差替えprovenanceが無かった。

再修正ではappend-only immutable activation markerと、PLAN-L4-33→L5-26→L6-93→L7-458の
依存鎖を導入した。これも再review PASSを意味しない。

## Third review FLAG

second修正後もA7–A11が未閉鎖だったためFLAGを維持する。

- repository structureに旧current pointer記述が残存。
- writerごとのsequence reservationでは逆順publishを防げず、global publish leaseとstale lease recoveryが未設計。
- F0で安全なreader lease無しにGC ownershipを主張。
- rollbackのsame/cross subject revision境界が未定義。
- process-crash atomicityとpower-loss durabilityを同一保証として扱っていた。

third修正はglobal exclusive lease、automatic GC禁止、approved cross-revision rollback、OS別durability
claimを設計したもので、独立再review PASSを代替しない。

### A7–A11 correction record

- repository §10をappend-only activation markerへ統一。
- lease取得後のN+1採番、loser retry 0、stale lease recovery receiptを固定。
- F0はgeneration deletion/automatic GC 0とし、reader lease設計まで全generation保持。
- same-revision rollbackとapproved cross-revision target変更を分離。
- process-crash atomicityとpower-loss durabilityを分離し、Windows F0の保証を旧complete fail-safeまでに限定。

この追記後もverdictはFLAGであり、再review結果を待つ。

## Fourth review FLAG

third修正後のN1–N5を安全側へ再設計した。

- F0をF0a toolchain / F0b sealed build / F0c CIへ統一し、CAND ownerを一意化。
- F0bからlease recovery/steal/clearとcross-revision rollbackを削除。
- power loss後はcomplete marker 1件以上なら最大を選び、0件ならfail-close。
- lease backendをexact `dist/node-publish.lock/` atomic mkdirだけに限定。
- stale lock後はreader継続・publisher永久fail-close。後続PLANまで手動削除も禁止。

この記録も再review PASSを意味しない。

Fourth修正の直接plan-governanceでは、初回に新PLANの`agent_slots`欠落と既存base designとの
`duplicate_layer_sub_doc`を検出した。3 PLANをsection追加に適合する`add-design`へ修正し、
required agent slotsを追加した後、candidate-owned plan-governance、design-language、
oracle-test-traceはGreenとなった。FLAG verdict自体は再reviewまで維持する。

## Final review FLAG correction

最終reviewで、L7 PLANの候補ID意味論、candidate ownership、旧general PLANとの所有関係に
不整合が残っていることを検出した。

- `CAND-NODEBOOT-004..008`をL7 test-designのpath escape、marker crash、npm env spoof、
  Node missing/no fallback、Windows invocationへ一致させた。
- D0-Nから未定義の`CAND-BUNBAN-001..020` freezeを除去し、Node self-host動作後の別PLAN revisionで
  定義する境界を明記した。
- L4/L5/L6 Node PLANの`supersedes`とdesign frontmatterの`superseded_plan`を除去し、
  旧general PLANをpredecessor/reference、本PLANをNode差分ownerとした。
- candidate ownerをF0a=`101`、F0b=`001..016,102..103,205`、
  F0c=`104..106,206`、Q0=`201..204,207..208`へ固定した。
- 各候補のtestとimplementationは、そのowner sliceの同一commitに置く契約へ統一した。

単発検証ではsemantic marker 9件とoracle-test-traceがGreen、plan-governanceはdraft上流を
`requires`に置いた1件、design-languageは英語prose 1件を検出したため、それぞれ
`requires: []`と日本語主語へ修正した。規律どおり再試行はしていない。この追記後も独立再reviewが
完了するまでverdictはFLAGであり、PASSを主張しない。

## Consolidated product FLAG correction

最終product reviewで、Node self-hostとBun-ban finalの完了境界、F0a/F0b責務、draft activation、
5-state cutoverの実行契約が不足していることを検出した。

- PLAN-L7をsame-slice前提から段階programへ変更し、PR #154/F0完了とBun-ban finalを分離した。
- F0aをstatic pin/clean npm ci/lock再現性に限定し、runtime custodyはF0bへ移した。
- L8 101/102/103とownershipをF0a=`101`、F0b=`001..016,102,205`、
  F0c=`103..106,206`へ一致させた。
- draft同時authoringでは`requires=[]`を維持しつつ、L6 confirmedとreview/admission receiptまで
  実装・activationをfail-closeする契約を追加した。
- TypeScript-owned append-only `CutoverTransitionReceipt` chainをL4からL6へ降下し、
  invalid/skip/reverse/replayを拒否するL9 oracleへ接続した。

この追記も独立再review PASSを意味せず、verdictはFLAGを維持する。

単発Node検証はsemantic marker 5件、plan-governance、oracle-test-traceをGreenとし、
design-languageが日本語見出し/prose不足2件を検出した。該当見出しと入力説明を日本語化したが、
single-run規律に従い再試行していない。

## Cutover specification final FLAG

genesis不在、edge evidenceの型不足、activation candidateとownership混線を修正した。
null previous fieldsのgenesis、空chain=`uninitialized`、edge-discriminated evidence exact照合、
`CAND-NODEBOOT-017`、`CAND-CUTOVER-001..008`をL6/L7/L9 pairへ固定し、F0/Q0/cutover/final deletionの
ownerを分離した。独立再reviewまではFLAGを維持する。

単発Node検証はsemantic marker、plan-governance、oracle traceがGreen。design-languageが既存段落の
英語開始1行を検出したため日本語主語を追加した。single-run規律により再試行していない。

## Exact HEAD 33f1d3ee final FLAG

genesis専用`initializeCutoverChain`、5-edge evidence registry、receiptのreview/admission/evidence-set digestを
追加した。017 bootstrap blockerを廃止してproduction gateを`CAND-CUTOVER-009`へ移し、
`tests/cutover-transition.test.ts` / `U-CUTOVER-001..009`を固定した。非activation F0 bootstrapとproduction
activationを分離し、owner一意性を回復した。独立再reviewまではFLAGを維持する。

単発Node検証はsemantic markerとdesign-languageがGreen。oracle traceはcandidate test未実装なのにrange表記を
正式宣言として解釈し`U-CUTOVER-001` orphanを検出したため、test-designをcandidate段階のID family表記へ修正し、
実test+Red同一commitで個別正式IDへ昇格する境界を明記した。再試行はしていない。

## Exact HEAD 26953949 spec-blind FLAG

cutover evidence registryをL5 design `CUTOVER-EVIDENCE-REGISTRY-v1`へ一本化し、lexical kind/producer IDを固定した。
F0c後のQ0をNode-only Bun detector/ban auditの実装・qualification revisionとし、final deletionを別revisionに維持した。
inventory→shadowはF0 receiptの同一subject強制を撤回し、各producer commitからcandidate HEADへのdescendant
closureを検証する。stale/replay/non-ancestorはfail-closeする。独立再reviewまではFLAGを維持する。
build、slice evidence、transitionのreceipt schemaを分離し、candidate HEAD規則の適用先を明示した。
Q0がNode-only detector/ban auditのtest+implementation+実行+qualificationを所有し、repo-wide final deletionだけを
Q0後の別revisionへ残す。

## Exact HEAD 3a565f5a claim/spec FLAG

`CutoverTransitionReceipt`に旧`evidence_digest` / `chain_digest`別名が残り、source/test生成closure、
slice admission順序、sealed edgeの負債2件必須性、evidence set canonicalizationが未閉鎖だった。
L5を正本として11-field schema、review/admission row等価、D0→F0a→F0b→F0c→Q0 typed FSM、
`PLAN-RECOVERY-16` + `PLAN-L7-452` typed evidence、registry row順UTF-8 JSON length-frame SHA-256を固定した。
functions→`src/runtime/cutover-transition.ts`→`tests/cutover-transition.test.ts`とnegative/cross-OS候補を
L4-L9へ降下した。独立再reviewまではFLAGを維持する。

## Exact HEAD 3f0d0ee9 claim/spec FLAG

slice admissionがreceipt schema/commit acceptanceとして未完、production edgeのreview/admissionが部分的、
evidence receipt digest未固定、L5↔L8 candidate誤参照、chain append競合、zod SSoT、2-lane review bundleが
未閉鎖だった。D0→F0a→F0b→F0c→Q0をedit-start gateではなくcandidate commit merge admissionへ固定し、
schema→runtime→test artifact closureを追加した。全edge fresh claim/spec PASS bundle+approved admission、
sequence+expected headのexclusive-lock atomic CAS、chain-only再検証、専用`CAND-CUTOVER-101..107`を
L4-L9へ降下した。PLAN ownershipをIssue #152 projectionの正本とし、独立再reviewまではFLAGを維持する。

## Exact HEAD 343f981b claim/spec FLAG

design-language 6件、slice admissionのcutover流用、evidence真正性未接続、抽象CAS、review/admission負例不足、
D0 missing admission waiverを検出した。design-languageはtargeted実測で6→0。
`CutoverAdmissionReceipt`をslice FSMから分離し、全review/admissionを既存
`EvidenceRecord` / trusted `EvidenceAttestationVerifierPort`へ接続した。production backendを
`.ut-tdd/harness.db` SQLite `BEGIN IMMEDIATE`+WAL+FULL sync+head/version CASへ固定し、
`CAND-CUTOVER-101..108`で競合、forgery、全edge positive、chain-only再検証をpair化した。

## Exact HEAD 601bd8ae final spec-blind FLAG

Q0 wrapperがvalidated slice chainを間接化し、typed evidence objectのidentityがpayload digestとreceipt digestで
二重化していた。CutoverAdmissionはvalidated Q0 `SliceAdmissionReceipt`をdirect参照し、各sliceの
predecessor/required input refsとD0 typed rootsを保存してQ0→D0をchain-onlyで閉じる。
outer object identity、PK、refs、nested lookupは`receipt_digest`へ一本化し、payload `evidence_digest`とaliasを
lookupに使わない。独自`issuer_key_id`は削除し、既存`EvidenceAttestationVerifierPort`のauthority ID、
key version、signature、producer、record digestだけをtrust bindingとする。

reviewはhybridのcross-providerを優先し、単一provider modeだけ異model+独立sessionの2 laneを許可する。
同一model/session/authorは禁止し、Issue #153でもexact 2 laneを維持する。canonical ledgerのonline backup、
restore、transaction migration rollback、unknown newer/downgrade拒否、projection rebuild independenceを
L7/L8/L9候補へ降下した。

## Exact HEAD 4e1add6e final spec-blind FLAG

review laneのindependenceをruntime family一律分離からexecution mode別へ修正した。hybridはprovider差、
単一provider modeはmodel差を要求し、全modeでsession/identity/authorを分離する。laneのprovider/model/mode/
runtime familyはdigestとattestationへ封印する。SliceEvidenceReceiptはkind-discriminated typed refsとし、
review/admission receiptを`receipt_digest`で参照し、generic payloadだけがpayload digestを持つ。

未定義D0 root型を廃止し、D0 SliceAdmissionから既存ReviewBundleReceiptとfull schemaを持つ
BootstrapEnvelopeReceiptへ直接参照する。canonical cutover ledgerは
`.ut-tdd/ledger/cutover-ledger.db`へ分離し、PLAN ledger DBとrebuildable harness projection DBの
物理責務を混在させない。

## Claude共有メモリ指摘の受領と解消（exact HEAD 773b36c4）

共有main HARNESSメモリのmedium 2件を受領した。`NODE-SLICE-INPUT-REGISTRY-v1`をL5へ固定し、
D0のReviewBundle exact 1、PLAN-L4-33/L5-26/L6-93/L7-458のcanonical TrackedReceiptRecord exact 4、
BootstrapEnvelope #153 exact 1と、F0a/F0b/F0c/Q0のpredecessor/owned evidenceを決定可能にした。

`physical-data.md` §2.7.1へcanonical ledger file registryを追加し、harness projection、PLAN ledger、
cutover ledgerのrebuild/delete/migration/backup ownershipを分離した。architecture/internal-processingと
双方向参照し、projectionからcanonical DBへ書き戻す経路をfail-closeした。
Issue #153の許容Redは継承2件だけで、D0 admissionはmerge前必須とした。独立再reviewまではFLAGを維持する。

## Exact HEAD 8659effb final trust/scope FLAG

review independenceをmode別に再固定した。hybridはprovider/runtimeを分離し、codex-only/claude-onlyは
same runtimeを許す代わりに異model/session/identity/authorを要求する。standaloneはAI laneを禁止し、
distinct human reviewer 2名が揃わなければfail-closeする。

tracked projectionはintegrity-onlyであるため、canonical TrackedReceiptRecord全fieldを既存
EvidenceAttestationへ束縛するAttestedTrackedReceiptRecord exact 4だけをD0 eligibilityへ数える。
formal plan admission-checkとfuture D0 genesis trustを分離した。L4-33/L5-26/L6-93はgeneral PLAN全体を
supersedeせず、Node-specific additive refinementとしてcanonical predecessor/referenceを維持する。

## Exact HEAD f20a1bc4 final trust/confirmation FLAG

EvidenceAttestationを実コード正本のnested schemaVersion/algorithm/authorityId/keyVersion/signatureへ統一し、
producer/recordDigestはverifier inputとして分離した。review independenceの無条件runtime拒否を除去し、
mode別規則だけを正本にした。PLAN-L6-93 confirmedをtrusted L6ConfirmationReceiptとしてcutover chainへ
直接格納し、draft/wrong/stale/unsignedではgenesisを開始しない。L6 writer pathとL4/L5 V-pair rangeも
専用cutover DB及び実test正本へ同期した。

## Exact HEAD ec81bea9 receipt preimage FLAG

domain producer ownerと既存EvidenceProducer enumを分離し、owner bindingを署名対象record digestへ保持した。
SliceEvidence、AttestedTracked wrapper、L6Confirmationのexact field順と二段digestを固定し、
self-reference/field omission/wrong mappingを拒否する。ReviewBundleへexecution modeを追加し、lane及びactual
admission modeと一致させた。PLAN-L6-93の旧runtime-family一律条件もmode別正本へ同期した。

## Exact HEAD 121afc17 final FLAG

freshnessがSliceAdmissionを誤参照し、CutoverAdmission artifact binding、revision-rule subject、
canonical ledgerとprojectionの分離、nested evidence/Q0 reachabilityが不足していた。
CutoverAdmissionへartifact digestを追加し、typed content-addressed evidence graphをchain-only reducerへ固定した。
cutover ledger tableを`.ut-tdd/harness.db`内canonical sourceとしてprojection rebuild対象から除外し、
online backup/recovery/additive migration契約を追加した。正規D0 admission発行と独立再reviewまではFLAGを維持する。

## Exact HEAD 2d228fc4 contract closure FLAG

D0設計merge admissionと将来のproduction cutover activationを分離し、L6 confirmedは後者だけの必須条件へ
固定した。ReviewBundle coreのself除外6-field preimage、CutoverAdmission execution mode、
canonical slice owner mapping、generic EvidencePayloadObject、各receiptの既存EvidenceAttestation verifierへ
接続可能な二段digest wrapperを同期した。AttestedTrackedのembedded record digest equalityもfail-closeする。
PLAN-L6-93 revision 6 / PLAN-L7-458 revision 9を正規`plan revise`経路で発行した。独立再reviewまではFLAGを維持する。

## Exact HEAD c8ce1651 envelope graph FLAG

SliceAdmission coreも既存`EvidenceAttestationVerifierPort`へ接続できるouter envelopeへ統一し、typed unionから
raw coreを除外した。ReviewBundle→lane、SliceEvidence→bundle、D0 roots、Q0 predecessorのlookup keyをouter
envelope receipt digestへ固定した。evidence setのowner fieldをcanonical化し、15 owner mappingとpayload schemaを
closed registryにした。cross-kind/cross-owner replayを拒否する。PLAN-L6-93 revision 7 /
PLAN-L7-458 revision 10を正規`plan revise`経路で発行した。独立再reviewまではFLAGを維持する。

## Exact HEAD eaace387 payload/authority FLAG

D0 input owner 2種をclosed producer mapへ追加し、CutoverAdmissionの5 authorityでdomain owner、
EvidenceProducer、nested authority IDを分離した。SliceAdmission core/outer owner equalityを固定した。
payload bytesをRFC 8785 canonical JSON→UTF-8→unpadded base64urlへ一意化し、13 kindをrequired
field/type/domain/semantic predicate付きclosed discriminated unionにした。PLAN-L6-93 revision 8 /
PLAN-L7-458 revision 11を正規`plan revise`経路で発行した。独立再reviewまではFLAGを維持する。

## Exact HEAD 27c522fd semantic evidence FLAG

subject revisionをalgorithm prefix付きGitObjectIdへ固定し、outer/payload exact equalityを要求した。
payload object/decoded/envelopeのschema literalを閉じ、F0c OS run、Q0 case set、aggregate lane outcomesから
semantic successを再導出する。Cutover edge別authority ID/keyVersionもclosed set化した。
PLAN-L6-93 revision 9 / PLAN-L7-458 revision 12を正規`plan revise`経路で発行した。
独立再reviewまではFLAGを維持する。

## Exact HEAD c0b96c0d CAS/attempt FLAG

SliceAdmission preimageを9/self除外8 fieldsへ固定した。Frozen registry canonical head、attested removal、
single-use admission time attempt、policy event canonical headを専用cutover ledger CASへ閉じた。
PLAN-L6-93 revision 12 / PLAN-L7-458 revision 15を正規`plan revise`経路で発行した。
独立再reviewまではFLAGを維持する。

## Temporary bootstrap productization撤回

Issue #153のtemporary bootstrapをproduct trust rootへ拡張したpolicy/time/event、expiry/revocation、
mutable case registry/head/CAS/removal設計は過剰だったため撤回した。D0 design mergeは通常5 inputs
（ReviewBundle outer 1 + AttestedTrackedReceiptRecord exact 4）だけへ戻す。production cutoverは別gateで
L6 confirmed、validated Q0、required inherited debt evidenceを要求する。Q0 case setはruntime registryではなく
subject revision拘束のimmutable attested CaseManifestObjectを使う。

## Exact HEAD c94a6f9b policy/frozen-registry FLAG

ReviewLane exact preimageを12/self除外11 fieldsへ修正した。Frozen case registryをattested envelope、
append-only chain、approved removalへ固定しD0 baseline化した。Bootstrap policy/time/eventを非循環signed
graphへ分離し、historical validity/current reuseを別検証にした。PLAN-L6-93 revision 11 /
PLAN-L7-458 revision 14を正規`plan revise`経路で発行した。独立再reviewまではFLAGを維持する。

## Exact HEAD 842833dd registry/bootstrap FLAG

aggregate required lane profileとQ0 frozen case registryをtyped正本へ分離し、set equalityを固定した。
共通GitObjectIdを全receipt subject/HEADへ展開し、tracked/L6/review/bootstrap schema versionを閉じた。
Bootstrapへpolicy/expiry/revocationを封印しhistorical validityと新規再利用を分離した。
PLAN-L6-93 revision 10 / PLAN-L7-458 revision 13を正規`plan revise`経路で発行した。
独立再reviewまではFLAGを維持する。

## Exact HEAD 42ffde8b CaseManifest局所FLAG

CaseManifestの局所契約を閉じた。owner map実数を17へ修正し、case IDのUTF-8 code-point昇順unique配列、
RFC 8785 canonical JSON→UTF-8→SHA-256 lowerhex、subject時点test-design artifact digest再計算を固定した。
core/outer owner一致と`ci` mapping、subject単位の同digest冪等・異digest競合、q0.authoring/runtimeの
同一outer digest参照、`cutover_evidence_refs` typed edge traversalを要求し、missing/orphan/split manifestを
fail-closeする。CAND-CUTOVER-108をL7/L8へ同期し、PLAN-L6-93 revision 14 /
PLAN-L7-458 revision 17を正規`plan revise`経路で発行した。独立再reviewまではFLAGを維持する。

## Exact HEAD 9d5ace1a CaseManifest artifact/DDL局所FLAG

L8内のexact 1 marker pairと単一canonical JSON objectをQ0 case正本へ固定した。CaseManifestへartifact ID/pathを
封印し、8-field core preimage、RFC 8785/UTF-8/SHA-256 receipt digestを明示した。物理object tableへclosed
`object_kind`とnullable canonical GitObjectId `subject_revision`、CaseManifest NOT NULL相当CHECK、subject partial
UNIQUE indexを追加した。同digestだけ冪等、同subject別digestをfail-closeし、既存DB migrationはadditiveとする。
PLAN-L6-93 revision 15 / PLAN-L7-458 revision 18を正規`plan revise`経路で発行した。
独立再reviewまではFLAGを維持する。
