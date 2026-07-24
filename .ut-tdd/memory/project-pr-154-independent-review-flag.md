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
Issue #153の許容Redは継承2件だけで、D0 admissionはmerge前必須とした。独立再reviewまではFLAGを維持する。

## Exact HEAD 121afc17 final FLAG

freshnessがSliceAdmissionを誤参照し、CutoverAdmission artifact binding、revision-rule subject、
canonical ledgerとprojectionの分離、nested evidence/Q0 reachabilityが不足していた。
CutoverAdmissionへartifact digestを追加し、typed content-addressed evidence graphをchain-only reducerへ固定した。
cutover ledger tableを`.ut-tdd/harness.db`内canonical sourceとしてprojection rebuild対象から除外し、
online backup/recovery/additive migration契約を追加した。正規D0 admission発行と独立再reviewまではFLAGを維持する。
