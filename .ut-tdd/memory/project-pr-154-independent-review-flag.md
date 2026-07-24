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
